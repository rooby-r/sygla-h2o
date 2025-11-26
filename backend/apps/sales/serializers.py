from rest_framework import serializers
from .models import Vente, LigneVente, Paiement
from apps.clients.serializers import ClientSerializer
from apps.products.serializers import ProduitSerializer
from apps.authentication.serializers import UserProfileSerializer
from decimal import Decimal


class LigneVenteSerializer(serializers.ModelSerializer):
    produit_details = ProduitSerializer(source='produit', read_only=True)
    
    class Meta:
        model = LigneVente
        fields = [
            'id', 'produit', 'produit_details', 'quantite',
            'prix_unitaire', 'montant'
        ]
        read_only_fields = ['montant']


class PaiementSerializer(serializers.ModelSerializer):
    recu_par_details = UserProfileSerializer(source='recu_par', read_only=True)
    
    class Meta:
        model = Paiement
        fields = [
            'id', 'vente', 'montant', 'methode', 'reference',
            'date_paiement', 'recu_par', 'recu_par_details', 'notes'
        ]
        read_only_fields = ['date_paiement']


class VenteSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    vendeur_details = UserProfileSerializer(source='vendeur', read_only=True)
    lignes = LigneVenteSerializer(many=True, required=False)
    paiements = PaiementSerializer(many=True, read_only=True)
    est_paye = serializers.ReadOnlyField()
    taux_paiement = serializers.ReadOnlyField()
    
    class Meta:
        model = Vente
        fields = [
            'id', 'numero_vente', 'client', 'client_details',
            'vendeur', 'vendeur_details', 'montant_total', 'montant_paye',
            'montant_restant', 'statut_paiement', 'methode_paiement',
            'remise_pourcentage', 'remise_montant', 'frais_supplementaires',
            'raison_frais', 'type_livraison', 'frais_livraison', 
            'date_livraison_prevue', 'date_vente', 'date_echeance', 'notes', 
            'lignes', 'paiements', 'est_paye', 'taux_paiement', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'numero_vente', 'montant_restant', 'statut_paiement',
            'vendeur', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        
        # Créer la vente
        vente = Vente.objects.create(**validated_data)
        
        # Créer les lignes de vente
        for ligne_data in lignes_data:
            LigneVente.objects.create(vente=vente, **ligne_data)
        
        # Recalculer le montant total
        total = sum(ligne.montant for ligne in vente.lignes.all())
        vente.montant_total = total
        vente.save()
        
        return vente
    
    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        
        # Mettre à jour la vente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour les lignes si fournies
        if lignes_data is not None:
            # Supprimer les anciennes lignes
            instance.lignes.all().delete()
            
            # Créer les nouvelles lignes
            for ligne_data in lignes_data:
                LigneVente.objects.create(vente=instance, **ligne_data)
            
            # Recalculer le montant total
            total = sum(ligne.montant for ligne in instance.lignes.all())
            instance.montant_total = total
            instance.save()
        
        return instance


class VenteListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des ventes"""
    client_nom = serializers.SerializerMethodField()
    vendeur_nom = serializers.CharField(source='vendeur.get_full_name', read_only=True)
    nombre_lignes = serializers.SerializerMethodField()
    
    class Meta:
        model = Vente
        fields = [
            'id', 'numero_vente', 'client_nom', 'vendeur_nom',
            'montant_total', 'montant_paye', 'montant_restant',
            'statut_paiement', 'date_vente', 'nombre_lignes'
        ]
    
    def get_client_nom(self, obj):
        """Retourne le nom du client (nom_commercial ou raison_sociale)"""
        if obj.client:
            return obj.client.nom_commercial or obj.client.raison_sociale or obj.client.contact
        return None
    
    def get_nombre_lignes(self, obj):
        return obj.lignes.count()

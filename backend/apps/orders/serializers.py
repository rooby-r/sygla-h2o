from rest_framework import serializers
from .models import Commande, ItemCommande, PaiementCommande
from apps.clients.serializers import ClientSerializer
from apps.authentication.serializers import UserSerializer


class ItemCommandeSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les articles de commande
    """
    produit_id = serializers.IntegerField()
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    
    class Meta:
        model = ItemCommande
        fields = [
            'id',
            'produit_id',
            'produit_nom', 
            'quantite',
            'prix_unitaire',
            'sous_total'
        ]
        read_only_fields = ['id', 'sous_total', 'produit_nom']


class PaiementCommandeSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les paiements de commande
    """
    recu_par_details = UserSerializer(source='recu_par', read_only=True)
    
    class Meta:
        model = PaiementCommande
        fields = [
            'id',
            'commande',
            'montant',
            'methode',
            'reference',
            'date_paiement',
            'recu_par',
            'recu_par_details',
            'notes'
        ]
        read_only_fields = ['id', 'date_paiement', 'recu_par_details']
    
    def validate_montant(self, value):
        """Valider que le montant est positif"""
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0")
        return value


class CommandeSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les commandes
    """
    client = ClientSerializer(read_only=True)
    client_id = serializers.IntegerField(write_only=True)
    items = ItemCommandeSerializer(many=True, required=False)
    paiements_commande = PaiementCommandeSerializer(many=True, read_only=True)
    vendeur_nom = serializers.CharField(source='vendeur.username', read_only=True)
    vendeur_nom_complet = serializers.SerializerMethodField()
    taux_paiement = serializers.SerializerMethodField()
    
    class Meta:
        model = Commande
        fields = [
            'id',
            'numero_commande',
            'client',
            'client_id',
            'vendeur_nom',
            'vendeur_nom_complet',
            'livreur',
            'date_creation',
            'date_livraison_prevue',
            'date_livraison_effective',
            'date_echeance',
            'type_livraison',
            'statut',
            'adresse_livraison',
            'montant_produits',
            'frais_livraison',
            'montant_total',
            'montant_paye',
            'montant_restant',
            'statut_paiement',
            'taux_paiement',
            'convertie_en_vente',
            'notes',
            'items',
            'paiements_commande',
        ]
        read_only_fields = ['id', 'numero_commande', 'date_creation', 'montant_produits', 'frais_livraison', 'montant_total', 'montant_paye', 'montant_restant', 'statut_paiement', 'taux_paiement', 'convertie_en_vente', 'vendeur_nom', 'vendeur_nom_complet']
    
    def get_vendeur_nom_complet(self, obj):
        """Retourne le nom complet du vendeur"""
        if obj.vendeur:
            if obj.vendeur.first_name and obj.vendeur.last_name:
                return f"{obj.vendeur.first_name} {obj.vendeur.last_name}"
            return obj.vendeur.username
        return "Système"
    
    def get_taux_paiement(self, obj):
        """Calcule le taux de paiement en pourcentage"""
        if obj.montant_total > 0:
            return round((obj.montant_paye / obj.montant_total) * 100, 2)
        return 0
    
    def validate(self, data):
        """
        Validation des données de commande
        """
        type_livraison = data.get('type_livraison', 'retrait_magasin')
        date_livraison_prevue = data.get('date_livraison_prevue')
        
        # Pour livraison à domicile, la date de livraison est obligatoire
        if type_livraison == 'livraison_domicile' and not date_livraison_prevue:
            raise serializers.ValidationError({
                'date_livraison_prevue': 'La date de livraison est obligatoire pour une livraison à domicile.'
            })
        
        # Pour retrait en magasin, pas besoin de date de livraison
        if type_livraison == 'retrait_magasin':
            data['date_livraison_prevue'] = None
        
        return data
    
    def create(self, validated_data):
        """
        Créer une nouvelle commande avec ses items
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔥 CREATE - validated_data reçues: {validated_data}")
        logger.info(f"🔥 CREATE - Keys dans validated_data: {validated_data.keys()}")
        
        items_data = validated_data.pop('items', [])
        logger.info(f"🔥 CREATE - Items extraits: {items_data}")
        logger.info(f"🔥 CREATE - Nombre d'items: {len(items_data)}")
        
        # Vérifier que client_id existe
        if 'client_id' not in validated_data:
            logger.error("❌ client_id missing from validated_data")
            raise serializers.ValidationError("client_id is required")
        
        # Créer la commande d'abord SANS les items
        commande = Commande.objects.create(**validated_data)
        logger.info(f"✅ Commande créée avec ID: {commande.id}, numero: {commande.numero_commande}")
        
        # Maintenant créer les items (la commande a un ID)
        items_created = 0
        for item_data in items_data:
            logger.info(f"🔥 Traitement item: {item_data}")
            produit_id = item_data.pop('produit_id')
            sous_total = item_data['quantite'] * item_data['prix_unitaire']
            item_data['sous_total'] = sous_total
            item = ItemCommande.objects.create(commande=commande, produit_id=produit_id, **item_data)
            items_created += 1
            logger.info(f"✅ Item créé: {item.id} - Produit {produit_id}, Qty: {item.quantite}, Prix: {item.prix_unitaire}")
        
        logger.info(f"✅ Total items créés: {items_created}")
        
        # Calculer les montants avec frais de livraison et forcer la sauvegarde
        logger.info(f"🔥 Calcul des montants...")
        commande.calculer_montant_total()
        commande.save()
        logger.info(f"✅ Montant final: {commande.montant_total} HTG")
        logger.info(f"✅ Vérification finale - Items dans commande: {commande.items.count()}")
        
        return commande
    
    def update(self, instance, validated_data):
        """
        Mettre à jour une commande existante avec ses items
        """
        items_data = validated_data.pop('items', None)
        
        # Mettre à jour les champs de la commande
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Gérer les items si fournis
        if items_data is not None:
            # Supprimer les anciens items
            instance.items.all().delete()
            
            # Créer les nouveaux items
            for item_data in items_data:
                produit_id = item_data.pop('produit_id')
                sous_total = item_data['quantite'] * item_data['prix_unitaire']
                item_data['sous_total'] = sous_total
                ItemCommande.objects.create(commande=instance, produit_id=produit_id, **item_data)
        
        # Recalculer les montants avec frais de livraison
        instance.calculer_montant_total()
        instance.save()
        return instance
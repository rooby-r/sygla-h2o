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
    numero_vente_associee = serializers.SerializerMethodField()
    est_apres_echeance = serializers.SerializerMethodField()
    penalite_applicable = serializers.SerializerMethodField()
    montant_total_a_payer = serializers.SerializerMethodField()
    
    class Meta:
        model = Commande
        fields = [
            'id',
            'numero_commande',
            'numero_vente_associee',
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
            'montant_penalite',
            'penalite_applicable',
            'montant_total_a_payer',
            'est_apres_echeance',
            'statut_paiement',
            'taux_paiement',
            'convertie_en_vente',
            'notes',
            'items',
            'paiements_commande',
        ]
        read_only_fields = ['id', 'numero_commande', 'numero_vente_associee', 'date_creation', 'montant_produits', 'montant_total', 'montant_paye', 'montant_restant', 'montant_penalite', 'penalite_applicable', 'montant_total_a_payer', 'est_apres_echeance', 'statut_paiement', 'taux_paiement', 'convertie_en_vente', 'vendeur_nom', 'vendeur_nom_complet']
    
    def get_est_apres_echeance(self, obj):
        """Vérifie si la date d'échéance est passée"""
        return obj.est_apres_echeance()
    
    def get_penalite_applicable(self, obj):
        """Calcule la pénalité applicable (1.5% si après échéance)"""
        return float(obj.calculer_penalite())
    
    def get_montant_total_a_payer(self, obj):
        """Retourne le montant total à payer incluant la pénalité"""
        return float(obj.get_montant_total_a_payer())
    
    def get_vendeur_nom_complet(self, obj):
        """Retourne le nom complet du vendeur"""
        if obj.vendeur:
            if obj.vendeur.first_name and obj.vendeur.last_name:
                return f"{obj.vendeur.first_name} {obj.vendeur.last_name}"
            return obj.vendeur.username
        return "Système"
    
    def get_numero_vente_associee(self, obj):
        """Retourne le numéro de vente associée si la commande a été convertie"""
        if obj.convertie_en_vente and obj.vente_associee:
            return obj.vente_associee.numero_vente
        return None
    
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
        date_echeance = data.get('date_echeance')
        
        # Pour livraison à domicile, la date de livraison est obligatoire
        if type_livraison == 'livraison_domicile' and not date_livraison_prevue:
            raise serializers.ValidationError({
                'date_livraison_prevue': 'La date de livraison est obligatoire pour une livraison à domicile.'
            })
        
        # Vérifier que la date d'échéance ne dépasse pas la date de livraison
        if date_echeance and date_livraison_prevue:
            if date_echeance > date_livraison_prevue:
                raise serializers.ValidationError({
                    'date_echeance': 'La date d\'échéance ne peut pas dépasser la date de livraison.'
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
        
        # Vérifier si les frais de livraison ont été fournis manuellement
        frais_livraison_manuel = validated_data.get('frais_livraison')
        logger.info(f"🔥 CREATE - Frais de livraison fournis: {frais_livraison_manuel}")
        
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
        
        # Calculer les montants
        # Si les frais ont été fournis manuellement (y compris 0), les conserver
        # Sinon (None), recalculer automatiquement
        logger.info(f"🔥 Calcul des montants...")
        recalculer_frais = frais_livraison_manuel is None
        commande.calculer_montant_total(recalculer_frais_livraison=recalculer_frais)
        
        # Si les frais ont été fournis explicitement, s'assurer qu'ils sont appliqués
        if frais_livraison_manuel is not None:
            commande.frais_livraison = frais_livraison_manuel
            commande.montant_total = commande.montant_produits + commande.frais_livraison
        
        # Calculer automatiquement la date d'échéance (1 jour avant livraison)
        if commande.date_livraison_prevue and not commande.date_echeance:
            commande.calculer_date_echeance()
            logger.info(f"✅ Date d'échéance calculée: {commande.date_echeance}")
        
        commande.save()
        logger.info(f"✅ Frais de livraison: {commande.frais_livraison} HTG (recalculé: {recalculer_frais})")
        logger.info(f"✅ Montant final: {commande.montant_total} HTG")
        logger.info(f"✅ Vérification finale - Items dans commande: {commande.items.count()}")
        
        return commande
    
    def update(self, instance, validated_data):
        """
        Mettre à jour une commande existante avec ses items
        """
        items_data = validated_data.pop('items', None)
        
        # Vérifier si les frais de livraison ont été fournis manuellement
        frais_livraison_manuel = validated_data.get('frais_livraison')
        
        # Sauvegarder les frais de livraison actuels avant toute modification
        frais_livraison_a_conserver = frais_livraison_manuel if frais_livraison_manuel is not None else instance.frais_livraison
        
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
        
        # Recalculer les montants SANS recalculer les frais de livraison
        # Les frais ont été définis manuellement et doivent être préservés
        instance.calculer_montant_total(recalculer_frais_livraison=False)
        
        # Restaurer les frais de livraison conservés
        if frais_livraison_a_conserver and frais_livraison_a_conserver > 0:
            instance.frais_livraison = frais_livraison_a_conserver
            instance.montant_total = instance.montant_produits + instance.frais_livraison
        
        # Calculer automatiquement la date d'échéance si nouvelle date de livraison
        if instance.date_livraison_prevue:
            instance.calculer_date_echeance()
        
        instance.save()
        return instance
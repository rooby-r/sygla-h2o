from rest_framework import serializers
from .models import Produit, MouvementStock


class ProduitSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Produit
    """
    
    class Meta:
        model = Produit
        fields = [
            'id',
            'nom',
            'code_produit',
            'description', 
            'type_produit',
            'unite_mesure',
            'prix_unitaire',
            'stock_actuel',
            'stock_initial',
            'stock_minimal',
            'is_active',
            'date_creation',
            'date_modification'
        ]
        read_only_fields = ['id', 'code_produit', 'date_creation', 'date_modification']


class MouvementStockSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle MouvementStock
    """
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    produit_code = serializers.CharField(source='produit.code_produit', read_only=True)
    type_mouvement_display = serializers.CharField(source='get_type_mouvement_display', read_only=True)
    utilisateur_nom = serializers.SerializerMethodField()
    
    class Meta:
        model = MouvementStock
        fields = [
            'id',
            'produit',
            'produit_nom',
            'produit_code',
            'type_mouvement',
            'type_mouvement_display',
            'quantite',
            'stock_avant',
            'stock_apres',
            'motif',
            'utilisateur',
            'utilisateur_nom',
            'date_creation',
            'numero_document'
        ]
        read_only_fields = ['id', 'stock_avant', 'stock_apres', 'date_creation', 'utilisateur']
    
    def get_utilisateur_nom(self, obj):
        if obj.utilisateur:
            return obj.utilisateur.get_full_name() or obj.utilisateur.username
        return None


class MouvementStockCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour créer un mouvement de stock
    """
    class Meta:
        model = MouvementStock
        fields = [
            'produit',
            'type_mouvement',
            'quantite',
            'motif',
            'numero_document'
        ]
    
    def validate(self, data):
        produit = data.get('produit')
        type_mouvement = data.get('type_mouvement')
        quantite = data.get('quantite')
        
        # Vérifier que la quantité est positive
        if quantite <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0")
        
        # Vérifier le stock pour les sorties
        if type_mouvement in ['sortie', 'perte'] and quantite > produit.stock_actuel:
            raise serializers.ValidationError(
                f"Stock insuffisant. Stock actuel: {produit.stock_actuel}, demandé: {quantite}"
            )
        
        return data
    
    def create(self, validated_data):
        produit = validated_data['produit']
        type_mouvement = validated_data['type_mouvement']
        quantite = validated_data['quantite']
        motif = validated_data.get('motif', '')
        numero_document = validated_data.get('numero_document', '')
        
        # Récupérer l'utilisateur du contexte
        request = self.context.get('request')
        utilisateur = request.user if request else None
        
        # Calculer stock avant
        stock_avant = produit.stock_actuel
        
        # Appliquer le mouvement
        if type_mouvement == 'entree':
            produit.stock_actuel += quantite
        elif type_mouvement in ['sortie', 'perte']:
            produit.stock_actuel -= quantite
        elif type_mouvement == 'ajustement':
            # Pour un ajustement, la quantité est le nouveau stock
            produit.stock_actuel = quantite
        
        produit.save()
        
        # Créer le mouvement
        mouvement = MouvementStock.objects.create(
            produit=produit,
            type_mouvement=type_mouvement,
            quantite=quantite,
            stock_avant=stock_avant,
            stock_apres=produit.stock_actuel,
            motif=motif,
            utilisateur=utilisateur,
            numero_document=numero_document
        )
        
        return mouvement
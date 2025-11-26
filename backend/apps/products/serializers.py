from rest_framework import serializers
from .models import Produit


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
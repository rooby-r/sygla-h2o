from rest_framework import serializers
from django.db.models import Sum
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Client
    """
    credit_disponible = serializers.ReadOnlyField()
    peut_commander = serializers.ReadOnlyField()
    total_depenses = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'type_client', 'nom_commercial', 'raison_sociale', 'telephone',
            'adresse', 'contact', 'email', 'credit_limite',
            'credit_utilise', 'credit_disponible', 'peut_commander',
            'total_depenses', 'date_creation', 'date_modification', 'is_active', 'notes'
        ]
        read_only_fields = ['id', 'credit_utilise', 'date_creation', 'date_modification', 'total_depenses']

    def get_total_depenses(self, obj):
        """Calcule le total des dépenses du client (montant réellement payé, hors commandes converties)"""
        total = obj.commandes.filter(convertie_en_vente=False).aggregate(
            total=Sum('montant_paye')
        )['total']
        return float(total) if total else 0.0

    def validate_telephone(self, value):
        """Validation du numéro de téléphone"""
        if not value.replace('+', '').replace(' ', '').replace('-', '').isdigit():
            raise serializers.ValidationError("Le numéro de téléphone ne doit contenir que des chiffres.")
        return value

    def validate_credit_limite(self, value):
        """Validation de la limite de crédit"""
        if value < 0:
            raise serializers.ValidationError("La limite de crédit ne peut pas être négative.")
        return value


class ClientListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur simplifié pour la liste des clients
    """
    credit_disponible = serializers.ReadOnlyField()
    peut_commander = serializers.ReadOnlyField()
    total_depenses = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'type_client', 'nom_commercial', 'raison_sociale', 'telephone', 'adresse',
            'contact', 'email', 'credit_limite', 'credit_utilise', 'credit_disponible',
            'peut_commander', 'total_depenses', 'is_active'
        ]

    def get_total_depenses(self, obj):
        """Calcule le total des dépenses du client (montant réellement payé, hors commandes converties)"""
        total = obj.commandes.filter(convertie_en_vente=False).aggregate(
            total=Sum('montant_paye')
        )['total']
        return float(total) if total else 0.0


class ClientDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur détaillé pour un client avec historique des commandes
    """
    credit_disponible = serializers.ReadOnlyField()
    peut_commander = serializers.ReadOnlyField()
    nombre_commandes = serializers.SerializerMethodField()
    total_commandes = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'type_client', 'nom_commercial', 'raison_sociale', 'telephone',
            'adresse', 'contact', 'email', 'credit_limite',
            'credit_utilise', 'credit_disponible', 'peut_commander',
            'date_creation', 'date_modification', 'is_active', 'notes',
            'nombre_commandes', 'total_commandes'
        ]

    def get_nombre_commandes(self, obj):
        """Retourne le nombre total de commandes"""
        return obj.commandes.count()

    def get_total_commandes(self, obj):
        """Retourne le montant total des commandes (montant réellement payé, hors commandes converties)"""
        from django.db.models import Sum
        total = obj.commandes.filter(convertie_en_vente=False).aggregate(total=Sum('montant_paye'))['total']
        return total or 0
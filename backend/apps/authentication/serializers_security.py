from rest_framework import serializers
from .models import SecuritySettings


class SecuritySettingsSerializer(serializers.ModelSerializer):
    """Serializer pour les paramètres de sécurité"""
    
    updated_by_email = serializers.EmailField(source='updated_by.email', read_only=True)
    
    class Meta:
        model = SecuritySettings
        fields = [
            'id',
            'session_timeout',
            'max_login_attempts',
            'lockout_duration',
            'password_min_length',
            'require_uppercase',
            'require_lowercase',
            'require_numbers',
            'require_special_chars',
            'jwt_access_token_lifetime',
            'jwt_refresh_token_lifetime',
            'enable_two_factor',
            'force_password_change',
            'updated_at',
            'updated_by_email'
        ]
        read_only_fields = ['id', 'updated_at', 'updated_by_email']
    
    def validate_session_timeout(self, value):
        if value < 5 or value > 480:
            raise serializers.ValidationError("Le timeout de session doit être entre 5 et 480 minutes")
        return value
    
    def validate_max_login_attempts(self, value):
        if value < 3 or value > 10:
            raise serializers.ValidationError("Le nombre de tentatives doit être entre 3 et 10")
        return value
    
    def validate_lockout_duration(self, value):
        if value < 5 or value > 60:
            raise serializers.ValidationError("La durée de blocage doit être entre 5 et 60 minutes")
        return value
    
    def validate_password_min_length(self, value):
        if value < 6 or value > 20:
            raise serializers.ValidationError("La longueur minimale doit être entre 6 et 20 caractères")
        return value
    
    def validate_jwt_access_token_lifetime(self, value):
        if value < 5 or value > 1440:
            raise serializers.ValidationError("La durée du token d'accès doit être entre 5 et 1440 minutes")
        return value
    
    def validate_jwt_refresh_token_lifetime(self, value):
        if value < 60 or value > 10080:
            raise serializers.ValidationError("La durée du token de rafraîchissement doit être entre 60 et 10080 minutes")
        return value
    
    def validate_force_password_change(self, value):
        if value < 0 or value > 365:
            raise serializers.ValidationError("Le forçage de changement doit être entre 0 et 365 jours")
        return value

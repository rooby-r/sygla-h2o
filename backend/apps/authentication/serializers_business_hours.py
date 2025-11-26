from rest_framework import serializers
from .models import BusinessHoursConfig


class BusinessHoursConfigSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la configuration des horaires d'accès
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    time_range = serializers.CharField(source='get_time_range', read_only=True)
    allowed_days_display = serializers.CharField(source='get_allowed_days_display', read_only=True)
    
    class Meta:
        model = BusinessHoursConfig
        fields = [
            'id', 'role', 'role_display', 'enabled',
            'start_hour', 'start_minute', 'end_hour', 'end_minute',
            'allowed_days', 'allowed_days_display', 'time_range',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Validation des horaires"""
        start_hour = data.get('start_hour', 0)
        end_hour = data.get('end_hour', 0)
        start_minute = data.get('start_minute', 0)
        end_minute = data.get('end_minute', 0)
        
        # Vérifier que les heures sont valides
        if not (0 <= start_hour <= 23):
            raise serializers.ValidationError("L'heure de début doit être entre 0 et 23")
        if not (0 <= end_hour <= 23):
            raise serializers.ValidationError("L'heure de fin doit être entre 0 et 23")
        if not (0 <= start_minute <= 59):
            raise serializers.ValidationError("La minute de début doit être entre 0 et 59")
        if not (0 <= end_minute <= 59):
            raise serializers.ValidationError("La minute de fin doit être entre 0 et 59")
        
        # Vérifier que l'heure de fin est après l'heure de début
        start_total_minutes = start_hour * 60 + start_minute
        end_total_minutes = end_hour * 60 + end_minute
        
        if end_total_minutes <= start_total_minutes:
            raise serializers.ValidationError("L'heure de fin doit être après l'heure de début")
        
        # Vérifier que les jours sont valides
        allowed_days = data.get('allowed_days', [])
        if not allowed_days:
            raise serializers.ValidationError("Au moins un jour doit être sélectionné")
        
        for day in allowed_days:
            if not (0 <= day <= 6):
                raise serializers.ValidationError("Les jours doivent être entre 0 (Lundi) et 6 (Dimanche)")
        
        return data

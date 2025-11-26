from rest_framework import serializers
from .models import NotificationPreferences


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer pour les préférences de notifications"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationPreferences
        fields = [
            'id',
            'user',
            'user_email',
            'notify_client_created',
            'notify_order_created',
            'notify_order_validated',
            'notify_delivery_assigned',
            'notify_delivery_completed',
            'notify_stock_low',
            'notify_stock_updated',
            'notify_system_errors',
            'notify_security_alerts',
            'notify_daily_report',
            'notify_weekly_report',
            'notify_monthly_report',
            'enable_email_notifications',
            'enable_browser_notifications',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'created_at', 'updated_at']

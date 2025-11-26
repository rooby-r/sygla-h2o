from rest_framework import serializers
from .models import SystemLog


class SystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = [
            'id',
            'type',
            'type_display',
            'message',
            'details',
            'user',
            'user_email',
            'module',
            'module_display',
            'ip_address',
            'user_agent',
            'request_method',
            'endpoint',
            'status_code',
            'response_time',
            'metadata',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else 'system'


class SystemLogDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = [
            'id',
            'type',
            'type_display',
            'message',
            'details',
            'user',
            'user_email',
            'user_full_name',
            'module',
            'module_display',
            'ip_address',
            'user_agent',
            'request_method',
            'endpoint',
            'status_code',
            'response_time',
            'metadata',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else 'system'
    
    def get_user_full_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'Système'

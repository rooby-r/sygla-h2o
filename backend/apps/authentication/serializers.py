from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Notification, UserSession, PasswordResetToken


class UserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle User
    """
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'telephone', 'adresse', 'photo', 'photo_url', 'is_active',
            'date_creation', 'date_modification', 'password', 'password_confirm'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'photo_url']
    
    def get_photo_url(self, obj):
        """Retourner l'URL complète de la photo"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def validate(self, attrs):
        if 'password' in attrs and 'password_confirm' in attrs:
            if attrs['password'] != attrs['password_confirm']:
                raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        
        # Activer le flag must_change_password pour les non-admins
        if user.role != 'admin':
            user.must_change_password = True
        
        user.save()
        return user

    def update(self, instance, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour l'authentification
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Chercher l'utilisateur par email
            try:
                from .models import User
                user = User.objects.get(email=email)
                # Vérifier le mot de passe
                if user.check_password(password):
                    if not user.is_active:
                        raise serializers.ValidationError('Votre compte a été désactivé. Contactez l\'administrateur.')
                    attrs['user'] = user
                else:
                    raise serializers.ValidationError('Mot de passe incorrect. Veuillez réessayer.')
            except User.DoesNotExist:
                raise serializers.ValidationError('Aucun compte trouvé avec cet email. Vérifiez votre adresse email.')
        else:
            raise serializers.ValidationError('Veuillez saisir votre email et mot de passe.')

        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le profil utilisateur (lecture seule)
    """
    full_name = serializers.ReadOnlyField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'telephone', 'adresse', 'photo', 'photo_url',
            'date_creation', 'is_active'
        ]
        read_only_fields = ['id', 'username', 'role', 'date_creation', 'photo_url']
    
    def get_photo_url(self, obj):
        """Retourner l'URL complète de la photo"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class ChangePasswordSerializer(serializers.Serializer):
    """
    Sérialiseur pour changer le mot de passe
    """
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")
        return attrs

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Sérialiseur pour demander une réinitialisation de mot de passe
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if not user.is_active:
                raise serializers.ValidationError("Ce compte a été désactivé.")
            return value
        except User.DoesNotExist:
            # On ne révèle pas si l'email existe ou non pour des raisons de sécurité
            return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Sérialiseur pour confirmer la réinitialisation de mot de passe
    """
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "Les mots de passe ne correspondent pas."
            })
        
        # Valider la complexité du mot de passe
        password = attrs['new_password']
        if not any(c.isupper() for c in password):
            raise serializers.ValidationError({
                'new_password': "Le mot de passe doit contenir au moins une majuscule."
            })
        if not any(c.islower() for c in password):
            raise serializers.ValidationError({
                'new_password': "Le mot de passe doit contenir au moins une minuscule."
            })
        if not any(c.isdigit() for c in password):
            raise serializers.ValidationError({
                'new_password': "Le mot de passe doit contenir au moins un chiffre."
            })
        
        return attrs

    def validate_token(self, value):
        try:
            token_obj = PasswordResetToken.objects.get(token=value)
            if not token_obj.is_valid():
                raise serializers.ValidationError("Ce lien a expiré ou a déjà été utilisé.")
            return value
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Lien de réinitialisation invalide.")


class NotificationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les notifications
    """
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message',
            'related_order_id', 'related_product_id', 'related_client_id', 'related_sale_id',
            'is_read', 'read_at', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_time_ago(self, obj):
        """Retourne le temps écoulé depuis la création"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "À l'instant"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"Il y a {minutes} min"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"Il y a {hours}h"
        elif diff < timedelta(days=30):
            days = diff.days
            return f"Il y a {days}j"
        else:
            return obj.created_at.strftime("%d/%m/%Y")


class UserSessionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les sessions utilisateurs
    """
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.get_role_display', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    is_online = serializers.ReadOnlyField()
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'user_email', 'user_name', 'user_role',
            'ip_address', 'device_info', 'user_agent',
            'login_time', 'last_activity', 'logout_time',
            'is_active', 'is_online', 'duration_minutes'
        ]
        read_only_fields = ['id', 'login_time', 'last_activity']
    
    def get_duration_minutes(self, obj):
        """Retourne la durée de la session en minutes"""
        duration = obj.duration
        return int(duration.total_seconds() / 60)


class ActiveUserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les utilisateurs actifs avec leurs sessions
    """
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    active_session = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'last_activity', 'active_session'
        ]
    
    def get_active_session(self, obj):
        """Retourne la session active de l'utilisateur"""
        active_session = obj.sessions.filter(is_active=True).order_by('-last_activity').first()
        if active_session:
            return {
                'id': active_session.id,
                'ip_address': active_session.ip_address,
                'device_info': active_session.device_info,
                'login_time': active_session.login_time,
                'last_activity': active_session.last_activity,
                'is_online': active_session.is_online
            }
        return None

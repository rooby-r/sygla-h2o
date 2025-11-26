from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class SecuritySettings(models.Model):
    """Configuration des paramètres de sécurité du système"""
    
    # Singleton - une seule instance
    id = models.AutoField(primary_key=True)
    
    # Timeout de session (en minutes)
    session_timeout = models.IntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(480)],
        help_text="Durée d'inactivité avant déconnexion automatique (5-480 minutes)"
    )
    
    # Tentatives de connexion
    max_login_attempts = models.IntegerField(
        default=5,
        validators=[MinValueValidator(3), MaxValueValidator(10)],
        help_text="Nombre maximum de tentatives de connexion avant blocage (3-10)"
    )
    
    lockout_duration = models.IntegerField(
        default=15,
        validators=[MinValueValidator(5), MaxValueValidator(60)],
        help_text="Durée de blocage après échec de connexion (5-60 minutes)"
    )
    
    # Politique de mot de passe
    password_min_length = models.IntegerField(
        default=8,
        validators=[MinValueValidator(6), MaxValueValidator(20)],
        help_text="Longueur minimale du mot de passe (6-20 caractères)"
    )
    
    require_uppercase = models.BooleanField(
        default=True,
        help_text="Exiger au moins une majuscule"
    )
    
    require_lowercase = models.BooleanField(
        default=True,
        help_text="Exiger au moins une minuscule"
    )
    
    require_numbers = models.BooleanField(
        default=True,
        help_text="Exiger au moins un chiffre"
    )
    
    require_special_chars = models.BooleanField(
        default=False,
        help_text="Exiger au moins un caractère spécial"
    )
    
    # Sécurité JWT
    jwt_access_token_lifetime = models.IntegerField(
        default=60,
        validators=[MinValueValidator(5), MaxValueValidator(1440)],
        help_text="Durée de validité du token d'accès (5-1440 minutes)"
    )
    
    jwt_refresh_token_lifetime = models.IntegerField(
        default=1440,
        validators=[MinValueValidator(60), MaxValueValidator(10080)],
        help_text="Durée de validité du token de rafraîchissement (60-10080 minutes / 7 jours)"
    )
    
    # Autres paramètres
    enable_two_factor = models.BooleanField(
        default=False,
        help_text="Activer l'authentification à deux facteurs (futur)"
    )
    
    force_password_change = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(365)],
        help_text="Forcer changement de mot de passe tous les X jours (0 = désactivé)"
    )
    
    # Métadonnées
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='security_updates'
    )
    
    class Meta:
        db_table = 'security_settings'
        verbose_name = 'Paramètres de sécurité'
        verbose_name_plural = 'Paramètres de sécurité'
    
    def __str__(self):
        return f"Paramètres de sécurité (mis à jour le {self.updated_at.strftime('%d/%m/%Y')})"
    
    @classmethod
    def get_settings(cls):
        """Récupérer ou créer les paramètres de sécurité"""
        settings, created = cls.objects.get_or_create(id=1)
        return settings
    
    def save(self, *args, **kwargs):
        # Forcer l'ID à 1 pour garantir une seule instance
        self.id = 1
        super().save(*args, **kwargs)

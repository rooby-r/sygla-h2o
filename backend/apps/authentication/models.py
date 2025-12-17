from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils import timezone


class User(AbstractUser):
    """
    Modèle utilisateur personnalisé pour SYGLA-H2O
    """
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('vendeur', 'Vendeur'),
        ('stock', 'Gestionnaire Stock'),
        ('livreur', 'Livreur'),
    ]
    
    # Utiliser l'email comme identifiant principal
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    # Rendre l'email unique
    email = models.EmailField(unique=True, verbose_name='Email')
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='vendeur',
        verbose_name='Rôle'
    )
    
    telephone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
    )
    telephone = models.CharField(
        validators=[telephone_validator],
        max_length=17,
        blank=True,
        verbose_name='Téléphone'
    )
    
    adresse = models.TextField(
        blank=True,
        verbose_name='Adresse'
    )
    
    photo = models.ImageField(
        upload_to='profile_photos/',
        null=True,
        blank=True,
        verbose_name='Photo de profil',
        help_text='Photo de profil de l\'utilisateur'
    )
    
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification'
    )
    
    must_change_password = models.BooleanField(
        default=False,
        verbose_name='Doit changer le mot de passe',
        help_text='Force l\'utilisateur à changer son mot de passe à la prochaine connexion'
    )
    
    last_activity = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Dernière activité',
        help_text='Date et heure de la dernière activité de l\'utilisateur'
    )

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['username']
    
    def save(self, *args, **kwargs):
        # Si c'est un nouvel utilisateur (pas de pk) et pas un admin
        if not self.pk and self.role != 'admin':
            self.must_change_password = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def full_name(self):
        """Retourne le nom complet de l'utilisateur"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    def can_manage_stock(self):
        """Vérifie si l'utilisateur peut gérer le stock"""
        return self.role in ['admin', 'stock']

    def can_manage_orders(self):
        """Vérifie si l'utilisateur peut gérer les commandes"""
        return self.role in ['admin', 'vendeur']

    def can_manage_deliveries(self):
        """Vérifie si l'utilisateur peut gérer les livraisons"""
        return self.role in ['admin', 'livreur']

    def can_view_reports(self):
        """Vérifie si l'utilisateur peut voir les rapports"""
        return self.role in ['admin', 'vendeur']


class BusinessHoursConfig(models.Model):
    """Configuration des horaires d'accès par rôle"""
    
    ROLE_CHOICES = [
        ('vendeur', 'Vendeur'),
        ('stock', 'Stock'),
        ('livreur', 'Livreur'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True, verbose_name="Rôle")
    enabled = models.BooleanField(default=True, verbose_name="Restriction activée")
    start_hour = models.IntegerField(default=7, verbose_name="Heure de début")
    start_minute = models.IntegerField(default=0, verbose_name="Minute de début")
    end_hour = models.IntegerField(default=18, verbose_name="Heure de fin")
    end_minute = models.IntegerField(default=0, verbose_name="Minute de fin")
    allowed_days = models.JSONField(default=list, verbose_name="Jours autorisés")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'business_hours_config'
        verbose_name = "Configuration horaire"
        verbose_name_plural = "Configurations horaires"
    
    def __str__(self):
        return f"Horaires pour {self.get_role_display()}"
    
    def get_time_range(self):
        return f"{self.start_hour:02d}:{self.start_minute:02d} - {self.end_hour:02d}:{self.end_minute:02d}"
    
    def get_allowed_days_display(self):
        days_names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
        return ', '.join([days_names[d] for d in sorted(self.allowed_days)])


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
        User,
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


class NotificationPreferences(models.Model):
    """Préférences de notifications par utilisateur"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name='Utilisateur'
    )
    
    # Notifications d'actions
    notify_client_created = models.BooleanField(default=True, verbose_name='Nouveau client créé')
    notify_order_created = models.BooleanField(default=True, verbose_name='Nouvelle commande créée')
    notify_order_validated = models.BooleanField(default=True, verbose_name='Commande validée')
    notify_delivery_assigned = models.BooleanField(default=True, verbose_name='Livraison assignée')
    notify_delivery_completed = models.BooleanField(default=True, verbose_name='Livraison terminée')
    notify_stock_low = models.BooleanField(default=True, verbose_name='Stock faible')
    notify_stock_updated = models.BooleanField(default=False, verbose_name='Stock mis à jour')
    
    # Alertes système
    notify_system_errors = models.BooleanField(default=True, verbose_name='Erreurs système')
    notify_security_alerts = models.BooleanField(default=True, verbose_name='Alertes de sécurité')
    
    # Rapports
    notify_daily_report = models.BooleanField(default=False, verbose_name='Rapport quotidien')
    notify_weekly_report = models.BooleanField(default=False, verbose_name='Rapport hebdomadaire')
    notify_monthly_report = models.BooleanField(default=False, verbose_name='Rapport mensuel')
    
    # Paramètres généraux
    enable_email_notifications = models.BooleanField(default=True, verbose_name='Notifications par email')
    enable_browser_notifications = models.BooleanField(default=True, verbose_name='Notifications navigateur')
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Préférences de notification'
        verbose_name_plural = 'Préférences de notifications'
    
    def __str__(self):
        return f"Préférences de {self.user.email}"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Récupérer ou créer les préférences d'un utilisateur"""
        preferences, created = cls.objects.get_or_create(user=user)
        return preferences


class Notification(models.Model):
    """Modèle pour les notifications système"""
    
    TYPE_CHOICES = [
        # Commandes
        ('order_created', 'Nouvelle commande'),
        ('order_validated', 'Commande validée'),
        ('order_in_preparation', 'Commande en préparation'),
        ('order_in_delivery', 'Commande en livraison'),
        ('order_delivered', 'Commande livrée'),
        ('order_cancelled', 'Commande annulée'),
        ('order_updated', 'Commande modifiée'),
        
        # Paiements
        ('payment_received', 'Paiement reçu'),
        ('payment_partial', 'Paiement partiel'),
        
        # Stock & Produits
        ('stock_low', 'Stock faible'),
        ('stock_out', 'Rupture de stock'),
        ('product_created', 'Nouveau produit'),
        ('product_updated', 'Produit modifié'),
        ('stock_movement', 'Mouvement de stock'),
        
        # Clients
        ('client_created', 'Nouveau client'),
        ('client_updated', 'Client modifié'),
        
        # Ventes
        ('sale_created', 'Nouvelle vente'),
        ('sale_completed', 'Vente finalisée'),
        
        # Livraisons
        ('delivery_assigned', 'Livraison assignée'),
        ('delivery_completed', 'Livraison terminée'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='Utilisateur')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='Type')
    title = models.CharField(max_length=200, verbose_name='Titre')
    message = models.TextField(verbose_name='Message')
    related_order_id = models.IntegerField(null=True, blank=True, verbose_name='ID Commande')
    related_product_id = models.IntegerField(null=True, blank=True, verbose_name='ID Produit')
    related_client_id = models.IntegerField(null=True, blank=True, verbose_name='ID Client')
    related_sale_id = models.IntegerField(null=True, blank=True, verbose_name='ID Vente')
    is_read = models.BooleanField(default=False, verbose_name='Lue')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lue le')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Créée le')
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Marquer la notification comme lue"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()


class UserSession(models.Model):
    """Modèle pour tracker les sessions actives des utilisateurs"""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name='Utilisateur'
    )
    token = models.CharField(
        max_length=500,
        unique=True,
        verbose_name='Token JWT'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Adresse IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    device_info = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Information appareil'
    )
    login_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Heure de connexion'
    )
    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière activité'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Session active'
    )
    logout_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Heure de déconnexion'
    )
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-login_time']
        verbose_name = 'Session utilisateur'
        verbose_name_plural = 'Sessions utilisateurs'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.login_time.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def duration(self):
        """Durée de la session"""
        end_time = self.logout_time or timezone.now()
        return end_time - self.login_time
    
    @property
    def is_online(self):
        """Vérifie si l'utilisateur est en ligne (actif dans les 5 dernières minutes)"""
        if not self.is_active:
            return False
        time_threshold = timezone.now() - timezone.timedelta(minutes=5)
        return self.last_activity >= time_threshold
    
    def logout(self):
        """Marquer la session comme déconnectée"""
        self.is_active = False
        self.logout_time = timezone.now()
        self.save()
    
    @classmethod
    def get_active_sessions(cls):
        """Récupérer toutes les sessions actives"""
        time_threshold = timezone.now() - timezone.timedelta(minutes=5)
        return cls.objects.filter(
            is_active=True,
            last_activity__gte=time_threshold
        ).select_related('user')
    
    @classmethod
    def cleanup_old_sessions(cls):
        """Nettoyer les sessions inactives depuis plus de 24h"""
        time_threshold = timezone.now() - timezone.timedelta(hours=24)
        inactive_sessions = cls.objects.filter(
            is_active=True,
            last_activity__lt=time_threshold
        )
        count = inactive_sessions.count()
        inactive_sessions.update(is_active=False, logout_time=timezone.now())
        return count


class PasswordResetToken(models.Model):
    """
    Token pour la réinitialisation de mot de passe
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='password_reset_tokens',
        verbose_name='Utilisateur'
    )
    token = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name='Token'
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name='Date de création'
    )
    expires_at = models.DateTimeField(
        verbose_name='Date d\'expiration'
    )
    used = models.BooleanField(
        default=False, 
        verbose_name='Utilisé'
    )
    used_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name='Date d\'utilisation'
    )

    class Meta:
        verbose_name = 'Token de réinitialisation'
        verbose_name_plural = 'Tokens de réinitialisation'
        ordering = ['-created_at']

    def __str__(self):
        return f"Reset token pour {self.user.email}"

    def is_valid(self):
        """Vérifie si le token est encore valide"""
        if self.used:
            return False
        return timezone.now() < self.expires_at

    def mark_as_used(self):
        """Marque le token comme utilisé"""
        self.used = True
        self.used_at = timezone.now()
        self.save()

    @classmethod
    def create_token(cls, user, expiry_hours=1):
        """Crée un nouveau token de réinitialisation"""
        import secrets
        
        # Invalider les anciens tokens non utilisés
        cls.objects.filter(user=user, used=False).update(used=True)
        
        # Créer un nouveau token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(hours=expiry_hours)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

    @classmethod
    def cleanup_expired_tokens(cls):
        """Supprime les tokens expirés"""
        return cls.objects.filter(expires_at__lt=timezone.now()).delete()

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator


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
        ('order_created', 'Nouvelle commande'),
        ('order_validated', 'Commande validée'),
        ('order_in_preparation', 'Commande en préparation'),
        ('order_in_delivery', 'Commande en livraison'),
        ('order_delivered', 'Commande livrée'),
        ('order_cancelled', 'Commande annulée'),
        ('payment_received', 'Paiement reçu'),
        ('stock_low', 'Stock faible'),
        ('stock_out', 'Rupture de stock'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='Utilisateur')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, verbose_name='Type')
    title = models.CharField(max_length=200, verbose_name='Titre')
    message = models.TextField(verbose_name='Message')
    related_order_id = models.IntegerField(null=True, blank=True, verbose_name='ID Commande')
    related_product_id = models.IntegerField(null=True, blank=True, verbose_name='ID Produit')
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

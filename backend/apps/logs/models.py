from django.db import models
from django.conf import settings


class SystemLog(models.Model):
    """
    Modèle pour stocker les logs du système
    """
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Succès'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
    ]
    
    MODULE_CHOICES = [
        ('authentication', 'Authentification'),
        ('clients', 'Clients'),
        ('products', 'Produits'),
        ('orders', 'Commandes'),
        ('deliveries', 'Livraisons'),
        ('reports', 'Rapports'),
        ('stock', 'Stock'),
        ('system', 'Système'),
    ]
    
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='info',
        verbose_name='Type'
    )
    
    message = models.CharField(
        max_length=500,
        verbose_name='Message'
    )
    
    details = models.TextField(
        blank=True,
        verbose_name='Détails'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs',
        verbose_name='Utilisateur'
    )
    
    module = models.CharField(
        max_length=50,
        choices=MODULE_CHOICES,
        verbose_name='Module'
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
    
    request_method = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Méthode HTTP'
    )
    
    endpoint = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Endpoint'
    )
    
    status_code = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Code de statut'
    )
    
    response_time = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Temps de réponse'
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Métadonnées'
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date et heure'
    )
    
    class Meta:
        verbose_name = 'Log Système'
        verbose_name_plural = 'Logs Système'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['type']),
            models.Index(fields=['module']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"[{self.get_type_display()}] {self.message} - {self.timestamp}"
    
    @property
    def user_email(self):
        """Retourne l'email de l'utilisateur ou 'system'"""
        return self.user.email if self.user else 'system'

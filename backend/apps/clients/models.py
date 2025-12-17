from django.db import models
from django.core.validators import RegexValidator


class Client(models.Model):
    """
    Modèle pour les clients (entreprises commerciales ou particuliers)
    """
    TYPE_CLIENT_CHOICES = [
        ('entreprise', 'Entreprise'),
        ('particulier', 'Particulier'),
    ]
    
    type_client = models.CharField(
        max_length=20,
        choices=TYPE_CLIENT_CHOICES,
        default='entreprise',
        verbose_name='Type de client',
        help_text='Indique si le client est une entreprise ou un particulier'
    )
    nom_commercial = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nom commercial',
        help_text='Nom sous lequel l\'entreprise est connue'
    )
    raison_sociale = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Raison sociale',
        help_text='Dénomination officielle de l\'entreprise'
    )
    telephone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
    )
    telephone = models.CharField(
        validators=[telephone_validator],
        max_length=17,
        verbose_name='Téléphone'
    )
    adresse = models.TextField(
        verbose_name='Adresse complète'
    )
    contact = models.CharField(
        max_length=200,
        verbose_name='Personne de contact',
        help_text='Nom de la personne à contacter'
    )
    email = models.EmailField(
        blank=True,
        verbose_name='Email'
    )
    
    # Informations commerciales
    credit_limite = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Limite de crédit (HTG)',
        help_text='Montant maximum autorisé à crédit en Gourdes Haïtiennes'
    )
    credit_utilise = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Crédit utilisé (HTG)',
        help_text='Montant actuellement dû en Gourdes Haïtiennes'
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Actif'
    )
    notes = models.TextField(
        blank=True,
        verbose_name='Notes',
        help_text='Remarques particulières sur le client'
    )

    class Meta:
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['nom_commercial']
        indexes = [
            models.Index(fields=['nom_commercial']),
            models.Index(fields=['telephone']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.nom_commercial

    @property
    def nom(self):
        """Retourne le nom commercial pour compatibilité"""
        return self.nom_commercial

    @property
    def credit_disponible(self):
        """Calcule le crédit disponible"""
        return self.credit_limite - self.credit_utilise

    @property
    def peut_commander(self):
        """Vérifie si le client peut passer commande"""
        return self.is_active and self.credit_disponible >= 0

    def augmenter_credit_utilise(self, montant):
        """Augmente le crédit utilisé"""
        self.credit_utilise += montant
        self.save()

    def diminuer_credit_utilise(self, montant):
        """Diminue le crédit utilisé"""
        self.credit_utilise = max(0, self.credit_utilise - montant)
        self.save()

    def get_historique_commandes(self):
        """Retourne l'historique des commandes"""
        return self.commandes.all().order_by('-date_creation')
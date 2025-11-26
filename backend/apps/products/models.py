from django.db import models
from django.core.validators import MinValueValidator
import uuid


class Produit(models.Model):
    """
    Modèle pour les produits (eau et glace)
    """
    TYPE_CHOICES = [
        ('eau', 'Eau potable'),
        ('glace', 'Glace'),
    ]
    
    UNITE_CHOICES = [
        ('litre', 'Litre'),
        ('sachet', 'Sachet'),
        ('bidon', 'Bidon'),
        ('bouteille', 'Bouteille'),
        ('kg', 'Kilogramme'),
        ('bloc', 'Bloc'),
    ]
    
    nom = models.CharField(
        max_length=200,
        verbose_name='Nom du produit'
    )
    code_produit = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Code produit',
        help_text='Code unique généré automatiquement'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Description'
    )
    type_produit = models.CharField(
        max_length=50,  # Augmenté pour permettre plus de caractères
        verbose_name='Type de produit',
        help_text='Type de produit (eau, glace, ou type personnalisé)'
    )
    unite_mesure = models.CharField(
        max_length=50,  # Augmenté pour permettre plus de caractères
        verbose_name='Unité de mesure',
        help_text='Unité de mesure (litre, kg, unité, ou unité personnalisée)'
    )
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Prix unitaire (HTG)',
        help_text='Prix en Gourdes Haïtiennes (HTG)'
    )
    stock_actuel = models.PositiveIntegerField(
        default=0,
        verbose_name='Stock actuel'
    )
    stock_initial = models.PositiveIntegerField(
        default=0,
        verbose_name='Stock initial',
        help_text='Stock de référence pour calculer le pourcentage'
    )
    stock_minimal = models.PositiveIntegerField(
        default=10,
        verbose_name='Stock minimal',
        help_text='Seuil d\'alerte pour le stock faible'
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

    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        ordering = ['nom']
        indexes = [
            models.Index(fields=['nom']),
            models.Index(fields=['type_produit']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.nom} ({self.get_unite_mesure_display()})"

    def save(self, *args, **kwargs):
        # Générer automatiquement le code produit si non défini
        if not self.code_produit:
            self.code_produit = self._generate_product_code()
        super().save(*args, **kwargs)

    def _generate_product_code(self):
        """Génère un code produit unique"""
        # Format: PROD-XXXXX (5 chiffres aléatoires)
        import random
        while True:
            code = f"PROD-{random.randint(10000, 99999)}"
            if not Produit.objects.filter(code_produit=code).exists():
                return code

    @property
    def stock_faible(self):
        """Vérifie si le stock est faible"""
        return self.stock_actuel <= self.stock_minimal

    @property
    def stock_disponible(self):
        """Retourne True si le produit est en stock"""
        return self.stock_actuel > 0 and self.is_active

    def peut_vendre(self, quantite):
        """Vérifie si on peut vendre une quantité donnée"""
        return self.is_active and self.stock_actuel >= quantite

    def augmenter_stock(self, quantite, motif="Entrée stock", user=None):
        """Augmente le stock et crée un mouvement"""
        stock_avant = self.stock_actuel
        self.stock_actuel += quantite
        self.save()
        
        # Créer un mouvement de stock
        mouvement = MouvementStock.objects.create(
            produit=self,
            type_mouvement='entree',
            quantite=quantite,
            motif=motif,
            stock_apres=self.stock_actuel
        )
        
        # Créer un log si l'utilisateur est fourni
        if user:
            from apps.logs.utils import create_log
            try:
                create_log(
                    log_type='success',
                    message=f"Stock augmenté: {self.nom}",
                    details=f"Ajout de {quantite} unités - {motif}",
                    user=user,
                    module='products',
                    request=None,
                    metadata={
                        'productId': self.id,
                        'productName': self.nom,
                        'quantity': quantite,
                        'previousStock': stock_avant,
                        'newStock': self.stock_actuel,
                        'reason': motif,
                        'movementType': 'entree'
                    }
                )
            except Exception:
                pass  # Ne pas bloquer si le logging échoue

    def diminuer_stock(self, quantite, motif="Vente", user=None):
        """Diminue le stock et crée un mouvement"""
        if quantite > self.stock_actuel:
            raise ValueError("Stock insuffisant")
        
        stock_avant = self.stock_actuel
        self.stock_actuel -= quantite
        self.save()
        
        # Créer un mouvement de stock
        mouvement = MouvementStock.objects.create(
            produit=self,
            type_mouvement='sortie',
            quantite=quantite,
            motif=motif,
            stock_apres=self.stock_actuel
        )
        
        # Créer un log si l'utilisateur est fourni
        if user:
            from apps.logs.utils import create_log
            try:
                create_log(
                    log_type='info',
                    message=f"Stock diminué: {self.nom}",
                    details=f"Retrait de {quantite} unités - {motif}",
                    user=user,
                    module='products',
                    request=None,
                    metadata={
                        'productId': self.id,
                        'productName': self.nom,
                        'quantity': quantite,
                        'previousStock': stock_avant,
                        'newStock': self.stock_actuel,
                        'reason': motif,
                        'movementType': 'sortie'
                    }
                )
            except Exception:
                pass  # Ne pas bloquer si le logging échoue


class MouvementStock(models.Model):
    """
    Modèle pour suivre les mouvements de stock
    """
    TYPE_MOUVEMENT_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
        ('ajustement', 'Ajustement'),
        ('perte', 'Perte'),
    ]
    
    produit = models.ForeignKey(
        Produit,
        on_delete=models.CASCADE,
        related_name='mouvements',
        verbose_name='Produit'
    )
    type_mouvement = models.CharField(
        max_length=20,
        choices=TYPE_MOUVEMENT_CHOICES,
        verbose_name='Type de mouvement'
    )
    quantite = models.PositiveIntegerField(
        verbose_name='Quantité'
    )
    stock_avant = models.PositiveIntegerField(
        verbose_name='Stock avant',
        help_text='Stock avant le mouvement'
    )
    stock_apres = models.PositiveIntegerField(
        verbose_name='Stock après',
        help_text='Stock après le mouvement'
    )
    motif = models.CharField(
        max_length=200,
        verbose_name='Motif',
        help_text='Raison du mouvement'
    )
    utilisateur = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Utilisateur'
    )
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date du mouvement'
    )
    numero_document = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Numéro de document',
        help_text='Référence du bon, facture, etc.'
    )

    class Meta:
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['produit', '-date_creation']),
            models.Index(fields=['type_mouvement']),
            models.Index(fields=['date_creation']),
        ]

    def __str__(self):
        return f"{self.get_type_mouvement_display()} - {self.produit.nom} ({self.quantite})"

    def save(self, *args, **kwargs):
        # Calculer le stock_avant si ce n'est pas défini
        if not self.stock_avant and not self.pk:
            self.stock_avant = self.produit.stock_actuel
        super().save(*args, **kwargs)
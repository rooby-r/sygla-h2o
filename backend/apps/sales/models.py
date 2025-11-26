from django.db import models
from django.core.validators import MinValueValidator
from apps.clients.models import Client
from apps.products.models import Produit
from apps.authentication.models import User
from decimal import Decimal


class Vente(models.Model):
    """
    Modèle pour les ventes finalisées
    """
    STATUT_CHOICES = [
        ('paye', 'Payé'),
        ('paye_partiel', 'Payé Partiellement'),
        ('impaye', 'Impayé'),
    ]
    
    METHODE_PAIEMENT_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
        ('virement', 'Virement'),
        ('cheque', 'Chèque'),
        ('mobile', 'Paiement mobile'),
        ('credit', 'Crédit'),
        ('mixte', 'Paiement mixte'),
    ]
    
    # Informations de base
    numero_vente = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Numéro de vente'
    )
    
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='ventes',
        verbose_name='Client'
    )
    
    vendeur = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='ventes_effectuees',
        limit_choices_to={'role__in': ['admin', 'vendeur']},
        verbose_name='Vendeur'
    )
    
    # Montants
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Montant total (HTG)'
    )
    
    montant_paye = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Montant payé (HTG)'
    )
    
    montant_restant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Montant restant (HTG)'
    )
    
    # Paiement
    statut_paiement = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='impaye',
        verbose_name='Statut de paiement'
    )
    
    methode_paiement = models.CharField(
        max_length=20,
        choices=METHODE_PAIEMENT_CHOICES,
        blank=True,
        verbose_name='Méthode de paiement'
    )
    
    # Remise et taxes
    remise_pourcentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Remise (%)'
    )
    
    remise_montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Remise (HTG)'
    )
    
    # Frais supplémentaires
    frais_supplementaires = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Frais supplémentaires (HTG)'
    )
    
    raison_frais = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Raison des frais supplémentaires'
    )
    
    # Livraison
    type_livraison = models.CharField(
        max_length=50,
        choices=[
            ('retrait_magasin', 'Retrait en magasin'),
            ('livraison_domicile', 'Livraison à domicile'),
        ],
        default='retrait_magasin',
        verbose_name='Type de livraison'
    )
    
    frais_livraison = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Frais de livraison (HTG)'
    )
    
    date_livraison_prevue = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date de livraison prévue'
    )
    
    # Dates
    date_vente = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de vente'
    )
    
    date_echeance = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date d\'échéance'
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        verbose_name='Notes'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ventes'
        verbose_name = 'Vente'
        verbose_name_plural = 'Ventes'
        ordering = ['-date_vente']
        indexes = [
            models.Index(fields=['-date_vente']),
            models.Index(fields=['client', '-date_vente']),
            models.Index(fields=['statut_paiement']),
        ]
    
    def __str__(self):
        return f"Vente {self.numero_vente} - {self.client.nom}"
    
    def save(self, *args, **kwargs):
        # Générer le numéro de vente automatiquement
        if not self.numero_vente:
            from django.utils import timezone
            today = timezone.now()
            prefix = f"V{today.strftime('%Y%m%d')}"
            
            # Trouver le dernier numéro du jour
            last_vente = Vente.objects.filter(
                numero_vente__startswith=prefix
            ).order_by('-numero_vente').first()
            
            if last_vente:
                last_num = int(last_vente.numero_vente[-4:])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.numero_vente = f"{prefix}{new_num:04d}"
        
        # Calculer le montant restant
        self.montant_restant = self.montant_total - self.montant_paye
        
        # Mettre à jour le statut de paiement
        if self.montant_paye >= self.montant_total:
            self.statut_paiement = 'paye'
            self.montant_restant = Decimal('0.00')
        elif self.montant_paye > 0:
            self.statut_paiement = 'paye_partiel'
        else:
            self.statut_paiement = 'impaye'
        
        super().save(*args, **kwargs)
    
    @property
    def est_paye(self):
        return self.statut_paiement == 'paye'
    
    @property
    def taux_paiement(self):
        if self.montant_total > 0:
            # Plafonner le taux à 100% maximum
            return min(100, (self.montant_paye / self.montant_total) * 100)
        return 0


class LigneVente(models.Model):
    """
    Ligne de détail d'une vente
    """
    vente = models.ForeignKey(
        Vente,
        on_delete=models.CASCADE,
        related_name='lignes',
        verbose_name='Vente'
    )
    
    produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        verbose_name='Produit'
    )
    
    quantite = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Quantité'
    )
    
    prix_unitaire = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Prix unitaire (HTG)'
    )
    
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Montant (HTG)'
    )
    
    class Meta:
        db_table = 'lignes_vente'
        verbose_name = 'Ligne de vente'
        verbose_name_plural = 'Lignes de vente'
    
    def __str__(self):
        return f"{self.produit.nom} x {self.quantite}"
    
    def save(self, *args, **kwargs):
        # Calculer le montant automatiquement
        self.montant = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)


class Paiement(models.Model):
    """
    Historique des paiements pour une vente
    """
    METHODE_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
        ('virement', 'Virement'),
        ('cheque', 'Chèque'),
        ('mobile', 'Paiement mobile'),
    ]
    
    vente = models.ForeignKey(
        Vente,
        on_delete=models.CASCADE,
        related_name='paiements',
        verbose_name='Vente'
    )
    
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Montant (HTG)'
    )
    
    methode = models.CharField(
        max_length=20,
        choices=METHODE_CHOICES,
        verbose_name='Méthode de paiement'
    )
    
    reference = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Référence'
    )
    
    date_paiement = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de paiement'
    )
    
    recu_par = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        verbose_name='Reçu par'
    )
    
    notes = models.TextField(
        blank=True,
        verbose_name='Notes'
    )
    
    class Meta:
        db_table = 'paiements'
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.montant} HTG - {self.vente.numero_vente}"
    
    def save(self, *args, **kwargs):
        # Vérifier que le paiement ne dépasse pas le montant restant
        if not self.pk:  # Nouveau paiement seulement
            total_paiements_actuels = self.vente.paiements.aggregate(
                total=models.Sum('montant')
            )['total'] or Decimal('0.00')
            
            montant_restant_reel = self.vente.montant_total - total_paiements_actuels
            
            if self.montant > montant_restant_reel:
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    f"Le montant du paiement ({self.montant} HTG) dépasse le montant restant ({montant_restant_reel} HTG)"
                )
        
        super().save(*args, **kwargs)
        
        # Mettre à jour le montant payé de la vente (plafonné au total)
        total_paiements = self.vente.paiements.aggregate(
            total=models.Sum('montant')
        )['total'] or Decimal('0.00')
        
        self.vente.montant_paye = min(total_paiements, self.vente.montant_total)
        self.vente.save()

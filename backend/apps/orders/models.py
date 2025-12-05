from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Commande(models.Model):
    """
    Modèle pour les commandes
    """
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('annulee', 'Annulée'),
        ('validee', 'Validée'),
        ('en_preparation', 'En préparation'),
        ('en_livraison', 'En livraison'),
        ('livree', 'Livrée'),
    ]
    
    STATUT_PAIEMENT_CHOICES = [
        ('impaye', 'Impayé'),
        ('paye_partiel', 'Payé Partiellement'),
        ('paye', 'Payé'),
    ]
    
    TYPE_LIVRAISON_CHOICES = [
        ('retrait_magasin', 'Retrait en magasin'),
        ('livraison_domicile', 'Livraison à domicile'),
    ]
    
    # Génération automatique du numéro de commande
    numero_commande = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        verbose_name='Numéro de commande'
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='commandes',
        verbose_name='Client'
    )
    vendeur = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='commandes_vendeur',
        verbose_name='Vendeur'
    )
    livreur = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Livreur',
        help_text='Nom du livreur assigné à cette commande'
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente',
        verbose_name='Statut'
    )
    
    # Montants
    montant_produits = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Montant des produits (HTG)',
        help_text='Montant total des produits uniquement'
    )
    frais_livraison = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Frais de livraison (HTG)',
        help_text='15% du montant pour livraison à domicile, 0 pour retrait en magasin'
    )
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Montant total (HTG)',
        help_text='Montant total = montant produits + frais de livraison'
    )
    
    # Paiement
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
    statut_paiement = models.CharField(
        max_length=20,
        choices=STATUT_PAIEMENT_CHOICES,
        default='impaye',
        verbose_name='Statut de paiement'
    )
    
    # Conversion en vente
    convertie_en_vente = models.BooleanField(
        default=False,
        verbose_name='Convertie en vente'
    )
    vente_associee = models.ForeignKey(
        'sales.Vente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commande_origine',
        verbose_name='Vente associée'
    )
    
    # Type de livraison
    type_livraison = models.CharField(
        max_length=20,
        choices=TYPE_LIVRAISON_CHOICES,
        default='retrait_magasin',
        verbose_name='Type de livraison'
    )
    
    # Dates
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    date_validation = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de validation'
    )
    date_livraison_prevue = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de livraison prévue'
    )
    date_livraison_effective = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de livraison effective'
    )
    date_echeance = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date d\'échéance',
        help_text='Date limite pour le paiement du montant restant (1 jour avant livraison)'
    )
    
    # Pénalité
    montant_penalite = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Montant pénalité (HTG)',
        help_text='Pénalité de 1.5% sur le montant restant si paiement après échéance'
    )
    
    # Informations de livraison
    adresse_livraison = models.TextField(
        blank=True,
        verbose_name='Adresse de livraison',
        help_text='Si différente de l\'adresse du client'
    )
    instructions_livraison = models.TextField(
        blank=True,
        verbose_name='Instructions de livraison'
    )
    
    notes = models.TextField(
        blank=True,
        verbose_name='Notes'
    )

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['numero_commande']),
            models.Index(fields=['client', '-date_creation']),
            models.Index(fields=['statut']),
            models.Index(fields=['vendeur']),
        ]

    def __str__(self):
        return f"Commande {self.numero_commande} - {self.client.nom_commercial}"

    def save(self, *args, **kwargs):
        # Générer le numéro de commande si c'est une nouvelle commande
        if not self.numero_commande:
            self.numero_commande = self.generer_numero_commande()
        
        # Calculer le montant total SEULEMENT si la commande existe déjà
        # (car une nouvelle commande n'a pas encore d'items)
        # IMPORTANT: Ne PAS recalculer les frais de livraison ici (ils ont été définis manuellement)
        if self.pk:
            try:
                # Sauvegarder les frais de livraison actuels avant le calcul
                frais_actuels = self.frais_livraison
                self.calculer_montant_total(recalculer_frais_livraison=False)
                # S'assurer que les frais n'ont pas été modifiés
                if frais_actuels and frais_actuels > 0:
                    self.frais_livraison = frais_actuels
                    self.montant_total = self.montant_produits + self.frais_livraison
            except Exception as e:
                # Si le calcul échoue (pas d'items par exemple), on continue
                pass
        
        # Calculer le montant restant et le statut de paiement
        self.montant_restant = self.montant_total - self.montant_paye
        
        # S'assurer que montant_paye est un Decimal
        montant_paye = Decimal(str(self.montant_paye or 0))
        montant_total = Decimal(str(self.montant_total or 0))
        
        if montant_paye >= montant_total and montant_total > Decimal('0'):
            self.statut_paiement = 'paye'
            self.montant_restant = Decimal('0.00')
        elif montant_paye > Decimal('0'):
            self.statut_paiement = 'paye_partiel'
        else:
            self.statut_paiement = 'impaye'
        
        super().save(*args, **kwargs)
        
        # Convertir automatiquement en vente si payée totalement
        if self.statut_paiement == 'paye' and not self.convertie_en_vente:
            self.convertir_en_vente()

    def generer_numero_commande(self):
        """Génère un numéro de commande unique"""
        from datetime import datetime
        import random
        
        date_str = datetime.now().strftime('%Y%m%d')
        # Compter les commandes du jour
        count = Commande.objects.filter(
            numero_commande__startswith=f'CMD{date_str}'
        ).count() + 1
        
        return f'CMD{date_str}{count:04d}'

    def calculer_montant_total(self, recalculer_frais_livraison=False):
        """
        Calcule le montant total de la commande avec frais de livraison
        
        Args:
            recalculer_frais_livraison: Si True, recalcule les frais de livraison à 15%.
                                        Si False, conserve les frais actuels (entrée manuelle).
        """
        # Calculer le montant des produits
        montant_produits = sum(item.sous_total for item in self.items.all())
        self.montant_produits = montant_produits
        
        # Calculer les frais de livraison SEULEMENT si demandé explicitement
        # ou si les frais sont à 0 et c'est une livraison à domicile (première fois)
        if recalculer_frais_livraison:
            if self.type_livraison == 'livraison_domicile':
                # 15% du montant des produits pour livraison à domicile
                self.frais_livraison = montant_produits * Decimal('0.15')
            else:
                # Gratuit pour retrait en magasin
                self.frais_livraison = Decimal('0.00')
        # Sinon, on garde les frais actuels (ils ont peut-être été définis manuellement)
        
        # Calculer le montant total
        self.montant_total = self.montant_produits + self.frais_livraison
        
        return self.montant_total
    
    def get_type_livraison_display_custom(self):
        """Retourne le type de livraison avec les détails"""
        if self.type_livraison == 'retrait_magasin':
            return "Retrait en magasin (Gratuit)"
        else:
            return f"Livraison à domicile (+15% = {self.frais_livraison} HTG)"
    
    def livraison_necessite_date(self):
        """Vérifie si le type de livraison nécessite une date"""
        return self.type_livraison == 'livraison_domicile'
    
    def calculer_date_echeance(self):
        """
        Calcule la date d'échéance automatiquement (1 jour avant la livraison)
        """
        from datetime import timedelta
        
        if self.date_livraison_prevue:
            # La date d'échéance est 1 jour avant la date de livraison
            if hasattr(self.date_livraison_prevue, 'date'):
                date_livraison = self.date_livraison_prevue.date()
            else:
                date_livraison = self.date_livraison_prevue
            self.date_echeance = date_livraison - timedelta(days=1)
        return self.date_echeance
    
    def est_apres_echeance(self):
        """
        Vérifie si la date actuelle dépasse la date d'échéance
        """
        from django.utils import timezone
        from datetime import date
        
        if not self.date_echeance:
            return False
        
        today = timezone.now().date() if hasattr(timezone.now(), 'date') else date.today()
        return today > self.date_echeance
    
    def calculer_penalite(self):
        """
        Calcule la pénalité de 1.5% sur le montant restant si paiement après échéance
        """
        if self.est_apres_echeance() and self.montant_restant > 0:
            self.montant_penalite = self.montant_restant * Decimal('0.015')
        else:
            self.montant_penalite = Decimal('0.00')
        return self.montant_penalite
    
    def peut_passer_en_livraison(self):
        """
        Vérifie si la commande peut passer en statut 'en_livraison'
        Bloque si l'échéance est passée et le paiement n'est pas complet
        """
        # Si l'échéance est passée et il reste un montant à payer, bloquer
        if self.est_apres_echeance() and self.montant_restant > 0:
            return False, "La date d'échéance est passée et le paiement n'est pas complet. Le client doit payer le montant restant plus la pénalité de 1.5%."
        return True, "OK"
    
    def get_montant_total_a_payer(self):
        """
        Retourne le montant total à payer incluant la pénalité si applicable
        """
        self.calculer_penalite()
        return self.montant_restant + self.montant_penalite

    def peut_etre_validee(self):
        """Vérifie si la commande peut être validée"""
        if self.statut != 'en_attente':
            return False, "La commande n'est pas en attente"
        
        if not self.items.exists():
            return False, "La commande ne contient aucun article"
        
        # Vérifier la disponibilité du stock
        for item in self.items.all():
            if not item.produit.peut_vendre(item.quantite):
                return False, f"Stock insuffisant pour {item.produit.nom}"
        
        return True, "OK"

    def valider(self, utilisateur=None):
        """Valide la commande et réserve le stock"""
        from django.utils import timezone
        
        peut_valider, message = self.peut_etre_validee()
        if not peut_valider:
            raise ValueError(message)
        
        # Vérifier la date de livraison pour livraison à domicile
        if self.type_livraison == 'livraison_domicile' and not self.date_livraison_prevue:
            raise ValueError("Une date de livraison est requise pour une livraison à domicile")
        
        # Recalculer les montants avant validation SANS recalculer les frais de livraison
        self.calculer_montant_total(recalculer_frais_livraison=False)
        
        # Réserver le stock
        for item in self.items.all():
            item.produit.diminuer_stock(
                item.quantite,
                f"Commande {self.numero_commande}"
            )
        
        self.statut = 'validee'
        self.date_validation = timezone.now()
        self.save()

    def annuler(self):
        """Annule la commande et libère le stock si nécessaire"""
        if self.statut == 'validee':
            # Libérer le stock
            for item in self.items.all():
                item.produit.augmenter_stock(
                    item.quantite,
                    f"Annulation commande {self.numero_commande}"
                )
        
        self.statut = 'annulee'
        self.save()
    
    def convertir_en_vente(self):
        """Convertit la commande en vente une fois payée totalement"""
        from apps.sales.models import Vente, LigneVente
        from django.utils import timezone
        
        # Ne pas reconvertir si déjà convertie
        if self.convertie_en_vente:
            return self.vente_associee
        
        # Créer la vente
        vente = Vente.objects.create(
            client=self.client,
            vendeur=self.vendeur,
            montant_total=self.montant_total,
            montant_paye=self.montant_paye,
            statut_paiement='paye',
            methode_paiement='mixte' if self.paiements_commande.count() > 1 else (
                self.paiements_commande.first().methode if self.paiements_commande.exists() else 'especes'
            ),
            date_vente=timezone.now(),
            notes=f"Convertie depuis la commande {self.numero_commande}\n{self.notes}"
        )
        
        # Copier les lignes de commande vers la vente
        for item in self.items.all():
            LigneVente.objects.create(
                vente=vente,
                produit=item.produit,
                quantite=item.quantite,
                prix_unitaire=item.prix_unitaire
            )
        
        # Copier les paiements
        for paiement_cmd in self.paiements_commande.all():
            from apps.sales.models import Paiement
            Paiement.objects.create(
                vente=vente,
                montant=paiement_cmd.montant,
                methode=paiement_cmd.methode,
                reference=paiement_cmd.reference,
                recu_par=paiement_cmd.recu_par,
                notes=f"Paiement transféré de la commande {self.numero_commande}"
            )
        
        # Marquer la commande comme convertie
        self.convertie_en_vente = True
        self.vente_associee = vente
        # Utiliser update pour éviter de déclencher save() et boucle infinie
        Commande.objects.filter(pk=self.pk).update(
            convertie_en_vente=True,
            vente_associee=vente
        )
        
        return vente


class ItemCommande(models.Model):
    """
    Modèle pour les articles d'une commande
    """
    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Commande'
    )
    produit = models.ForeignKey(
        'products.Produit',
        on_delete=models.CASCADE,
        verbose_name='Produit'
    )
    quantite = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Quantité'
    )
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Prix unitaire (HTG)',
        help_text='Prix unitaire en Gourdes Haïtiennes'
    )
    sous_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Sous-total (HTG)',
        help_text='Sous-total en Gourdes Haïtiennes'
    )

    class Meta:
        verbose_name = 'Article de commande'
        verbose_name_plural = 'Articles de commande'
        unique_together = ['commande', 'produit']

    def __str__(self):
        return f"{self.produit.nom} x{self.quantite}"

    def save(self, *args, **kwargs):
        # Utiliser le prix actuel du produit si pas défini
        if not self.prix_unitaire:
            self.prix_unitaire = self.produit.prix_unitaire
        
        # Calculer le sous-total
        self.sous_total = self.quantite * self.prix_unitaire
        
        super().save(*args, **kwargs)
        
        # Recalculer le montant total de la commande SI elle existe
        # IMPORTANT: Ne pas recalculer les frais de livraison (ils ont été définis manuellement)
        if self.commande_id and self.commande.pk:
            try:
                self.commande.calculer_montant_total(recalculer_frais_livraison=False)
                self.commande.save()
            except Exception:
                # Si le calcul échoue, on continue (évite les erreurs en cascade)
                pass

    def delete(self, *args, **kwargs):
        commande = self.commande
        super().delete(*args, **kwargs)
        
        # Recalculer le montant total de la commande
        # IMPORTANT: Ne pas recalculer les frais de livraison (ils ont été définis manuellement)
        commande.calculer_montant_total(recalculer_frais_livraison=False)
        commande.save()


class PaiementCommande(models.Model):
    """
    Historique des paiements pour une commande
    """
    METHODE_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
        ('virement', 'Virement'),
        ('cheque', 'Chèque'),
        ('mobile', 'Paiement mobile'),
    ]
    
    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='paiements_commande',
        verbose_name='Commande'
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
        'authentication.User',
        on_delete=models.PROTECT,
        verbose_name='Reçu par'
    )
    
    notes = models.TextField(
        blank=True,
        verbose_name='Notes'
    )
    
    class Meta:
        db_table = 'paiements_commande'
        verbose_name = 'Paiement de commande'
        verbose_name_plural = 'Paiements de commande'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.montant} HTG - {self.commande.numero_commande}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Mettre à jour le montant payé de la commande
        self.commande.montant_paye = self.commande.paiements_commande.aggregate(
            total=models.Sum('montant')
        )['total'] or Decimal('0.00')
        self.commande.save()
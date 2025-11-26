from django.db import models


class BusinessHoursConfig(models.Model):
    """
    Configuration des horaires d'accès par rôle
    """
    ROLE_CHOICES = [
        ('vendeur', 'Vendeur'),
        ('stock', 'Stock'),
        ('livreur', 'Livreur'),
    ]
    
    DAYS_CHOICES = [
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
        (5, 'Samedi'),
        (6, 'Dimanche'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    enabled = models.BooleanField(default=True, help_text="Activer les restrictions horaires pour ce rôle")
    start_time = models.TimeField(help_text="Heure de début d'accès")
    end_time = models.TimeField(help_text="Heure de fin d'accès")
    allowed_days = models.JSONField(default=list, help_text="Liste des jours autorisés (0=Lundi, 6=Dimanche)")
    message = models.TextField(blank=True, help_text="Message personnalisé pour ce rôle")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'business_hours_config'
        verbose_name = 'Configuration des horaires'
        verbose_name_plural = 'Configurations des horaires'
    
    def __str__(self):
        return f"Horaires pour {self.get_role_display()}"
    
    @property
    def formatted_days(self):
        """Retourne les jours formatés en français"""
        days_names = {
            0: 'Lundi', 1: 'Mardi', 2: 'Mercredi', 
            3: 'Jeudi', 4: 'Vendredi', 5: 'Samedi', 6: 'Dimanche'
        }
        return ', '.join([days_names[d] for d in self.allowed_days if d in days_names])
    
    @property
    def formatted_time(self):
        """Retourne les horaires formatés"""
        return f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"

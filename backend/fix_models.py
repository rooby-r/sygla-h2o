# Script pour ajouter le modèle BusinessHoursConfig correctement formaté

model_code = '''

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
'''

# Lire le fichier actuel
with open('apps/authentication/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Supprimer l'ancien BusinessHoursConfig mal formaté s'il existe
if 'class BusinessHoursConfig' in content:
    # Trouver le début
    start_idx = content.find('class BusinessHoursConfig')
    # Prendre tout jusqu'à cette classe
    content = content[:start_idx].rstrip()

# Ajouter le nouveau modèle
content += model_code

# Écrire le fichier
with open('apps/authentication/models.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Modèle BusinessHoursConfig ajouté avec succès")

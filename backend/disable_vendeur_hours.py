import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import BusinessHoursConfig

print("\n" + "="*70)
print("DÉSACTIVATION DES RESTRICTIONS HORAIRES POUR VENDEURS")
print("="*70)

# Récupérer ou créer la config pour vendeur
config, created = BusinessHoursConfig.objects.get_or_create(role='vendeur')

print(f"\nConfiguration actuelle:")
print(f"  Rôle: {config.role}")
print(f"  Activée: {config.enabled}")
if config.enabled:
    print(f"  Horaires: {config.get_time_range()}")
    print(f"  Jours: {config.get_allowed_days_display()}")

# Désactiver la restriction
config.enabled = False
config.save()

print(f"\n✅ Restrictions horaires désactivées!")
print(f"  Les vendeurs peuvent maintenant se connecter 24h/24, 7j/7")

print("\n⚠️  Note:")
print("  Vous pouvez réactiver les restrictions depuis l'interface admin")
print("  Menu: Paramètres > Horaires d'accès")

print("\n" + "="*70)

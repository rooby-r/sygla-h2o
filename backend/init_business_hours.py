import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import BusinessHoursConfig

# Créer les configurations par défaut
configs = [
    {
        'role': 'vendeur',
        'enabled': True,
        'start_hour': 7,
        'start_minute': 0,
        'end_hour': 18,
        'end_minute': 0,
        'allowed_days': [0, 1, 2, 3, 4, 5]  # Lundi à Samedi
    },
    {
        'role': 'stock',
        'enabled': True,
        'start_hour': 6,
        'start_minute': 0,
        'end_hour': 20,
        'end_minute': 0,
        'allowed_days': [0, 1, 2, 3, 4, 5, 6]  # Tous les jours
    },
    {
        'role': 'livreur',
        'enabled': True,
        'start_hour': 5,
        'start_minute': 0,
        'end_hour': 21,
        'end_minute': 0,
        'allowed_days': [0, 1, 2, 3, 4, 5, 6]  # Tous les jours
    }
]

for config_data in configs:
    config, created = BusinessHoursConfig.objects.get_or_create(
        role=config_data['role'],
        defaults=config_data
    )
    
    if created:
        print(f"✅ Configuration créée pour {config.get_role_display()}: {config.get_time_range()}")
    else:
        print(f"ℹ️  Configuration existe déjà pour {config.get_role_display()}")

print("\n✅ Initialisation terminée!")
print("\nVous pouvez maintenant gérer les horaires via:")
print("  GET    /api/auth/business-hours/         - Voir toutes les configurations")
print("  POST   /api/auth/business-hours/<role>/  - Créer/Modifier une configuration")

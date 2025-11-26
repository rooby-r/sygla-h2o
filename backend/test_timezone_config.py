"""
Script pour tester la configuration timezone après modification
"""
import os
import sys
import django
from datetime import datetime

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from django.conf import settings
from django.utils import timezone

def test_timezone():
    print("=" * 70)
    print("TEST DE CONFIGURATION TIMEZONE")
    print("=" * 70)
    
    # Configuration
    print("\n📋 CONFIGURATION DJANGO:")
    print(f"   TIME_ZONE: {settings.TIME_ZONE}")
    print(f"   USE_TZ: {settings.USE_TZ}")
    
    # Heure actuelle
    print("\n🕐 HEURE ACTUELLE:")
    
    # Heure système Python (sans timezone)
    local_time = datetime.now()
    print(f"   Python datetime.now(): {local_time}")
    
    # Heure Django timezone-aware (selon TIME_ZONE configuré)
    django_time = timezone.now()
    print(f"   Django timezone.now(): {django_time}")
    
    # Heure locale selon TIME_ZONE
    local_django_time = timezone.localtime(django_time)
    print(f"   Django localtime(): {local_django_time}")
    
    # Vérifications
    print("\n✅ VÉRIFICATIONS:")
    
    if settings.TIME_ZONE == 'America/Port-au-Prince':
        print("   ✅ TIME_ZONE correctement configuré pour Haïti")
    else:
        print(f"   ❌ TIME_ZONE incorrect: {settings.TIME_ZONE}")
    
    if settings.USE_TZ:
        print("   ✅ USE_TZ activé (timezone-aware)")
    else:
        print("   ❌ USE_TZ désactivé")
    
    # Informations timezone
    print("\n🌍 INFORMATIONS TIMEZONE:")
    print(f"   Timezone actuel: {django_time.tzinfo}")
    print(f"   Offset UTC: {local_django_time.strftime('%z')}")
    print(f"   Nom timezone: {local_django_time.tzname()}")
    
    # Test horaires d'accès
    print("\n⏰ TEST HORAIRES D'ACCÈS:")
    current_time = local_django_time.time()
    current_day = local_django_time.weekday()
    
    days_fr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    print(f"   Jour actuel: {days_fr[current_day]} ({current_day})")
    print(f"   Heure actuelle: {current_time.strftime('%H:%M:%S')}")
    
    # Simulation vérification horaires 06:00-18:45
    from datetime import time
    start_time = time(6, 0)
    end_time = time(18, 45)
    
    if start_time <= current_time <= end_time:
        print(f"   ✅ Dans la plage horaire 06:00-18:45")
    else:
        print(f"   ❌ Hors plage horaire 06:00-18:45")
    
    print("\n" + "=" * 70)
    print("✅ Configuration timezone pour Haïti (America/Port-au-Prince) active!")
    print("   Tous les horaires d'accès seront maintenant calculés en heure locale.")
    print("=" * 70)

if __name__ == '__main__':
    test_timezone()

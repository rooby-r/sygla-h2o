"""
Script pour tester le système de déconnexion automatique
"""
import os
import sys
import django
from datetime import datetime, time

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from django.utils import timezone
from apps.authentication.models import User, BusinessHoursConfig
from apps.authentication.business_hours import check_business_hours

def test_auto_disconnect():
    print("=" * 70)
    print("TEST SYSTÈME DE DÉCONNEXION AUTOMATIQUE")
    print("=" * 70)
    
    # Heure actuelle
    current_time = timezone.localtime(timezone.now())
    print(f"\n🕐 HEURE ACTUELLE: {current_time.strftime('%d/%m/%Y %H:%M:%S')} ({current_time.tzname()})")
    print(f"   Jour: {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][current_time.weekday()]}")
    
    # Tester chaque rôle
    roles_to_test = ['vendeur', 'stock', 'livreur', 'admin']
    
    print("\n" + "=" * 70)
    print("VÉRIFICATION HORAIRES D'ACCÈS PAR RÔLE")
    print("=" * 70)
    
    for role in roles_to_test:
        print(f"\n📋 Rôle: {role.upper()}")
        print("-" * 70)
        
        # Récupérer la config depuis la DB
        try:
            config = BusinessHoursConfig.objects.get(role=role)
            print(f"   Config DB trouvée:")
            print(f"   - Activé: {config.enabled}")
            
            if config.enabled:
                print(f"   - Horaires: {config.start_hour:02d}:{config.start_minute:02d} - {config.end_hour:02d}:{config.end_minute:02d}")
                print(f"   - Jours: {config.allowed_days}")
                
                # Vérifier si on est dans les horaires
                current_day = current_time.weekday()
                start_time = time(config.start_hour, config.start_minute)
                end_time = time(config.end_hour, config.end_minute)
                current_time_only = current_time.time()
                
                in_days = current_day in config.allowed_days
                in_hours = start_time <= current_time_only <= end_time
                
                print(f"   - Jour autorisé: {'✅' if in_days else '❌'}")
                print(f"   - Dans horaires: {'✅' if in_hours else '❌'}")
                
                if in_days and in_hours:
                    print(f"   🟢 ACCÈS AUTORISÉ")
                else:
                    print(f"   🔴 ACCÈS REFUSÉ - Déconnexion automatique activée")
            else:
                print(f"   🟢 ACCÈS 24/7 (restrictions désactivées)")
                
        except BusinessHoursConfig.DoesNotExist:
            print(f"   ⚠️ Pas de config DB, utilise config par défaut")
        
        # Test avec un utilisateur fictif
        try:
            user = User.objects.filter(role=role).first()
            if user:
                can_connect, message = check_business_hours(user)
                print(f"\n   Test avec utilisateur réel: {user.email}")
                if can_connect:
                    print(f"   ✅ Peut rester connecté")
                else:
                    print(f"   ❌ SERA DÉCONNECTÉ: {message}")
        except Exception as e:
            print(f"   ⚠️ Erreur test: {e}")
    
    print("\n" + "=" * 70)
    print("FONCTIONNEMENT DU SYSTÈME")
    print("=" * 70)
    print("""
    1. Frontend vérifie toutes les 30 secondes via /api/auth/check-access/
    2. Backend utilise check_business_hours() avec heure locale Haïti
    3. Si hors horaires: déconnexion immédiate + redirection /login
    4. Rôles concernés: vendeur, stock, livreur
    5. Admin: aucune restriction (24/7)
    """)
    
    print("\n" + "=" * 70)
    print("✅ Système de déconnexion automatique configuré!")
    print("=" * 70)

if __name__ == '__main__':
    test_auto_disconnect()

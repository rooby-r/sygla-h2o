"""
Test des messages d'erreur pour les horaires d'accès
"""
import os
import sys
import django
from datetime import time

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from django.utils import timezone
from apps.authentication.models import User
from apps.authentication.business_hours import check_business_hours

def test_error_messages():
    print("=" * 70)
    print("TEST DES MESSAGES D'ERREUR - HORAIRES D'ACCÈS")
    print("=" * 70)
    
    # Heure actuelle
    current_time = timezone.localtime(timezone.now())
    print(f"\n🕐 Heure actuelle: {current_time.strftime('%H:%M:%S')}")
    print(f"📅 Jour: {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][current_time.weekday()]}")
    
    # Tester avec différents utilisateurs
    users_to_test = [
        ('noelphara52@gmail.com', 'vendeur'),
        ('suze@gmail.com', 'livreur'),
    ]
    
    print("\n" + "=" * 70)
    print("MESSAGES D'ERREUR AFFICHÉS")
    print("=" * 70)
    
    for email, role in users_to_test:
        try:
            user = User.objects.get(email=email)
            can_connect, message = check_business_hours(user)
            
            print(f"\n👤 {email} ({role.upper()})")
            print("-" * 70)
            
            if can_connect:
                print("   ✅ Accès autorisé")
            else:
                print(f"   ❌ Message affiché: \"{message}\"")
                
        except User.DoesNotExist:
            print(f"\n⚠️ Utilisateur {email} introuvable")
    
    print("\n" + "=" * 70)
    print("EXEMPLES DE MESSAGES")
    print("=" * 70)
    print("""
    Cas 1 - Hors horaires:
    "Accès autorisé de 06:00 à 18:45"
    
    Cas 2 - Mauvais jour:
    "Accès refusé : jour non autorisé"
    
    Ces messages sont courts, clairs et directement compréhensibles.
    """)

if __name__ == '__main__':
    test_error_messages()

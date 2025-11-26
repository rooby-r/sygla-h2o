#!/usr/bin/env python
import os
import sys
import django

# Configuration du chemin vers Django
sys.path.append('c:\\Users\\USER\\Documents\\GP\\V1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def create_test_user():
    try:
        # Créer un utilisateur de test
        test_user = User.objects.create_user(
            username='test',
            email='test@sygla-h2o.com',
            password='test123',
            first_name='Test',
            last_name='User',
            role='vendeur',
            is_active=True
        )
        
        print("✅ UTILISATEUR TEST CRÉÉ!")
        print("=" * 30)
        print(f"📧 Email: {test_user.email}")
        print(f"🔑 Mot de passe: test123")
        print(f"🏷️ Rôle: {test_user.role}")
        print("=" * 30)
        
        # Afficher tous les utilisateurs
        print(f"\n📊 TOTAL UTILISATEURS: {User.objects.count()}")
        for user in User.objects.all():
            print(f"   - {user.email} ({user.role}) - Actif: {user.is_active}")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")

if __name__ == "__main__":
    create_test_user()
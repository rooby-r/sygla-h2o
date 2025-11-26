#!/usr/bin/env python
import os
import sys
import django

# Configuration du chemin vers Django
sys.path.append('c:\\Users\\USER\\Documents\\GP\\V1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def reset_users():
    try:
        # Supprimer tous les utilisateurs existants
        User.objects.all().delete()
        print("🗑️ Tous les utilisateurs supprimés")
        
        # Créer le nouvel administrateur
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@sygla-h2o.com',
            password='admin2025',
            first_name='Administrateur',
            last_name='SYGLA-H2O',
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        print("\n✅ ADMINISTRATEUR CRÉÉ!")
        print("=" * 40)
        print(f"📧 Email: {admin_user.email}")
        print(f"👤 Username: {admin_user.username}")
        print(f"🔑 Mot de passe: admin2025")
        print(f"🏷️ Rôle: {admin_user.role}")
        print("=" * 40)
        
        # Créer un utilisateur vendeur
        vendeur_user = User.objects.create_user(
            username='vendeur',
            email='vendeur@sygla-h2o.com',
            password='vendeur123',
            first_name='Jean',
            last_name='Dupont',
            role='vendeur',
            is_active=True
        )
        
        print("\n✅ VENDEUR CRÉÉ!")
        print("=" * 30)
        print(f"📧 Email: {vendeur_user.email}")
        print(f"🔑 Mot de passe: vendeur123")
        print(f"🏷️ Rôle: {vendeur_user.role}")
        print("=" * 30)
        
        print(f"\n📊 TOTAL UTILISATEURS: {User.objects.count()}")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_users()
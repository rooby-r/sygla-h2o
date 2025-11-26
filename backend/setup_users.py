#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
sys.path.append('c:\\Users\\USER\\Documents\\GP\\V1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def create_users():
    try:
        print("🔧 Création des utilisateurs...")
        
        # Supprimer tous les utilisateurs existants pour éviter les conflits
        User.objects.all().delete()
        print("🗑️ Utilisateurs existants supprimés")
        
        # Créer un utilisateur admin
        admin = User.objects.create_user(
            username='admin',
            email='admin@sygla-h2o.com',
            password='admin123',
            first_name='Admin',
            last_name='SYGLA',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        print(f"✅ Admin créé: {admin.email}")
        
        # Créer un vendeur
        vendeur = User.objects.create_user(
            username='vendeur',
            email='vendeur@sygla-h2o.com',
            password='vendeur123',
            first_name='Jean',
            last_name='Vendeur',
            role='vendeur'
        )
        print(f"✅ Vendeur créé: {vendeur.email}")
        
        print("\n📊 INFORMATIONS DE CONNEXION:")
        print("=" * 40)
        print("👤 ADMIN:")
        print("   Email: admin@sygla-h2o.com")
        print("   Mot de passe: admin123")
        print("\n👤 VENDEUR:")
        print("   Email: vendeur@sygla-h2o.com")
        print("   Mot de passe: vendeur123")
        print("=" * 40)
        
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    create_users()
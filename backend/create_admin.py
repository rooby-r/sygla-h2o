#!/usr/bin/env python
import os
import sys
import django

# Configuration du chemin vers Django
sys.path.append('c:\\Users\\USER\\Documents\\GP\\V1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def create_admin_user():
    try:
        # Vérifier si l'utilisateur admin existe déjà
        admin_email = "admin@sygla-h2o.com"
        
        try:
            existing_user = User.objects.get(email=admin_email)
            print(f"🔍 Utilisateur existant trouvé: {existing_user.email}")
            print(f"📊 ID: {existing_user.id}, Username: {existing_user.username}, Active: {existing_user.is_active}")
            
            # Supprimer l'ancien utilisateur
            existing_user.delete()
            print("🗑️ Ancien utilisateur supprimé")
            
        except User.DoesNotExist:
            print("ℹ️ Aucun utilisateur admin existant")
        
        # Créer le nouvel administrateur
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@sygla-h2o.com',
            password='admin2025',  # Nouveau mot de passe
            first_name='Administrateur',
            last_name='SYGLA-H2O',
            role='admin',  # Rôle administrateur
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        print("\n✅ NOUVEL ADMINISTRATEUR CRÉÉ AVEC SUCCÈS!")
        print("=" * 50)
        print(f"📧 Email: {admin_user.email}")
        print(f"👤 Username: {admin_user.username}")
        print(f"🔑 Mot de passe: admin2025")
        print(f"🏷️ Rôle: {admin_user.role}")
        print(f"👑 Superuser: {admin_user.is_superuser}")
        print(f"⚙️ Staff: {admin_user.is_staff}")
        print(f"✅ Actif: {admin_user.is_active}")
        print("=" * 50)
        
        # Créer aussi un utilisateur vendeur pour les tests
        vendeur_user = User.objects.create_user(
            username='vendeur',
            email='vendeur@sygla-h2o.com',
            password='vendeur123',
            first_name='Jean',
            last_name='Dupont',
            role='vendeur',
            is_active=True
        )
        
        print("\n✅ UTILISATEUR VENDEUR CRÉÉ!")
        print("=" * 30)
        print(f"📧 Email: {vendeur_user.email}")
        print(f"🔑 Mot de passe: vendeur123")
        print(f"🏷️ Rôle: {vendeur_user.role}")
        print("=" * 30)
        
        # Afficher tous les utilisateurs
        print(f"\n📊 TOTAL UTILISATEURS: {User.objects.count()}")
        for user in User.objects.all():
            print(f"   - {user.email} ({user.role}) - Actif: {user.is_active}")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
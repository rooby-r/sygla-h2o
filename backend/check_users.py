#!/usr/bin/env python
"""
Script pour vérifier et créer des utilisateurs de test
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def check_and_create_users():
    """Vérifier et créer des utilisateurs de test"""
    
    print("🔍 Vérification des utilisateurs existants...")
    
    # Vérifier les utilisateurs existants
    users = User.objects.all()
    print(f"📊 Nombre d'utilisateurs trouvés: {users.count()}")
    
    for user in users:
        print(f"   • {user.username} ({user.email}) - Rôle: {user.role}")
    
    # Créer un admin de test s'il n'existe pas
    admin_email = "roobyjeancharles7@gmail.com"
    if not User.objects.filter(email=admin_email).exists():
        print(f"\n✅ Création de l'administrateur avec email: {admin_email}")
        admin_user = User.objects.create_user(
            username='admin',
            email=admin_email,
            first_name='Admin',
            last_name='SYGLA',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"   ✅ Administrateur créé: {admin_user.username}")
    else:
        admin_user = User.objects.get(email=admin_email)
        print(f"\n ℹ️  Administrateur existant trouvé: {admin_user.username}")
        # Vérifier le mot de passe
        if admin_user.check_password('admin123'):
            print("   ✅ Mot de passe correct")
        else:
            print("   ⚠️  Mot de passe incorrect, mise à jour...")
            admin_user.set_password('admin123')
            admin_user.save()
            print("   ✅ Mot de passe mis à jour")
    
    # Créer un vendeur de test
    vendeur_email = "vendeur@sygla.com"
    if not User.objects.filter(email=vendeur_email).exists():
        print(f"\n✅ Création du vendeur avec email: {vendeur_email}")
        vendeur_user = User.objects.create_user(
            username='vendeur',
            email=vendeur_email,
            first_name='Jean',
            last_name='Vendeur',
            role='vendeur'
        )
        vendeur_user.set_password('vendeur123')
        vendeur_user.save()
        print(f"   ✅ Vendeur créé: {vendeur_user.username}")
    else:
        vendeur_user = User.objects.get(email=vendeur_email)
        print(f"\n ℹ️  Vendeur existant trouvé: {vendeur_user.username}")
    
    print(f"\n📋 Récapitulatif des comptes disponibles:")
    print(f"   🔑 Admin: {admin_email} / admin123")
    print(f"   👤 Vendeur: {vendeur_email} / vendeur123")
    
    print(f"\n✅ Utilisateurs prêts pour la connexion!")
    
    return True

if __name__ == "__main__":
    print("🏗️  Vérification et création des utilisateurs de test...")
    check_and_create_users()
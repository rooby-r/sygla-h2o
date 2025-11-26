#!/usr/bin/env python
"""
Script pour vérifier et configurer le compte admin pour Django Admin
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

print("=" * 60)
print("CONFIGURATION COMPTE ADMIN DJANGO")
print("=" * 60)

try:
    # Chercher ou créer l'admin
    admin, created = User.objects.get_or_create(
        email='admin@sygla-h2o.com',
        defaults={
            'username': 'admin',
            'first_name': 'Admin',
            'last_name': 'Principal',
            'role': 'admin',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    # Configurer le mot de passe
    admin.set_password('admin123')
    
    # S'assurer que les permissions sont correctes
    admin.is_staff = True
    admin.is_superuser = True
    admin.is_active = True
    admin.role = 'admin'
    
    admin.save()
    
    if created:
        print("\n✅ Nouveau compte admin créé!")
    else:
        print("\n✅ Compte admin mis à jour!")
    
    print("\n" + "=" * 60)
    print("DÉTAILS DU COMPTE:")
    print("=" * 60)
    print(f"📧 Email: {admin.email}")
    print(f"👤 Username: {admin.username}")
    print(f"🔑 Mot de passe: admin123")
    print(f"✓ is_active: {admin.is_active}")
    print(f"✓ is_staff: {admin.is_staff}")
    print(f"✓ is_superuser: {admin.is_superuser}")
    print(f"✓ role: {admin.role}")
    
    print("\n" + "=" * 60)
    print("ACCÈS:")
    print("=" * 60)
    print("🌐 Django Admin: http://localhost:8000/admin/")
    print("   Email: admin@sygla-h2o.com")
    print("   Mot de passe: admin123")
    print("\n" + "=" * 60)
    
    # Test de connexion
    print("\n🧪 TEST DE CONNEXION:")
    from django.contrib.auth import authenticate
    user = authenticate(username='admin@sygla-h2o.com', password='admin123')
    if user:
        print("✅ Authentification réussie!")
    else:
        print("❌ Échec de l'authentification")
        # Essayer avec le username
        user = authenticate(username='admin', password='admin123')
        if user:
            print("✅ Authentification avec username réussie!")
        else:
            print("❌ Échec avec username aussi")

except Exception as e:
    print(f"\n❌ Erreur: {e}")
    import traceback
    traceback.print_exc()

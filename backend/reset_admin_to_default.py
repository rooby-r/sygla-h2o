#!/usr/bin/env python
"""
Script pour réinitialiser le mot de passe admin
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
print("RÉINITIALISATION DU MOT DE PASSE ADMIN")
print("=" * 60)

try:
    # Chercher l'utilisateur admin
    admin = User.objects.get(email='admin@sygla-h2o.com')
    
    # Réinitialiser le mot de passe
    admin.set_password('admin123')
    admin.save()
    
    print("\n✅ Mot de passe réinitialisé avec succès!")
    print("\n📧 Email: admin@sygla-h2o.com")
    print("🔑 Mot de passe: admin123")
    print("\n🌐 Connexion:")
    print("   • Application: http://localhost:3000/")
    print("   • Django Admin: http://localhost:8000/admin/")
    print("\n" + "=" * 60)

except User.DoesNotExist:
    print("\n❌ Erreur: Utilisateur admin@sygla-h2o.com non trouvé!")
    print("\nCréation d'un nouveau compte admin...")
    
    admin = User.objects.create_user(
        username='admin',
        email='admin@sygla-h2o.com',
        password='admin123',
        first_name='Admin',
        last_name='Principal',
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    
    print("\n✅ Nouveau compte admin créé!")
    print("\n📧 Email: admin@sygla-h2o.com")
    print("🔑 Mot de passe: admin123")
    print("\n" + "=" * 60)

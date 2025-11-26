#!/usr/bin/env python
"""
Script pour vérifier l'email noelphara52@gmail.com
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

print("=" * 60)
print("RECHERCHE UTILISATEUR")
print("=" * 60)

try:
    user = User.objects.get(email='noelphara52@gmail.com')
    print(f"\n✅ Utilisateur trouvé!")
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")
    print(f"Rôle: {user.get_role_display()}")
    print(f"Actif: {user.is_active}")
    
    # Réinitialiser le mot de passe
    user.set_password('admin123')
    user.is_active = True
    user.save()
    
    print(f"\n✅ Mot de passe réinitialisé à: admin123")
    
except User.DoesNotExist:
    print(f"\n❌ Aucun utilisateur avec l'email: noelphara52@gmail.com")
    print("\nUtilisateurs disponibles:")
    for u in User.objects.all()[:10]:
        print(f"  • {u.email} ({u.get_role_display()})")

print("\n" + "=" * 60)

#!/usr/bin/env python
"""
Script pour lister les utilisateurs admin
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
print("UTILISATEURS ADMIN DU SYSTÈME")
print("=" * 60)

# Chercher les superusers
superusers = User.objects.filter(is_superuser=True)
if superusers.exists():
    print("\n🔐 SUPERUSERS (Accès Django Admin):")
    for user in superusers:
        print(f"   • Email: {user.email}")
        print(f"     Username: {user.username}")
        print(f"     Nom: {user.get_full_name()}")
        print()

# Chercher les admins de l'application
app_admins = User.objects.filter(role='admin', is_active=True)
if app_admins.exists():
    print("\n👑 ADMINISTRATEURS (Application):")
    for user in app_admins:
        print(f"   • Email: {user.email}")
        print(f"     Username: {user.username}")
        print(f"     Nom: {user.get_full_name()}")
        print(f"     Superuser: {'Oui' if user.is_superuser else 'Non'}")
        print()

# Tous les staff
staff_users = User.objects.filter(is_staff=True, is_active=True)
if staff_users.exists():
    print("\n📋 TOUS LES STAFF:")
    for user in staff_users:
        print(f"   • {user.email} ({user.get_role_display()})")

print("\n" + "=" * 60)
print("NOTES:")
print("• Le mot de passe ne peut pas être affiché (crypté)")
print("• Pour Django Admin: http://localhost:8000/admin/")
print("• Pour l'application: http://localhost:3000/")
print("=" * 60)

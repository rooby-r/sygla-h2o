#!/usr/bin/env python
"""
Script pour réinitialiser le mot de passe de Phara
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

print("=" * 60)
print("RÉINITIALISATION MOT DE PASSE - PHARA")
print("=" * 60)

try:
    user = User.objects.get(email='noelphara52@gmail.com')
    
    print(f"\n✅ Utilisateur trouvé!")
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")
    print(f"Nom: {user.first_name} {user.last_name}")
    print(f"Rôle: {user.get_role_display()}")
    print(f"Actif: {user.is_active}")
    
    # Réinitialiser le mot de passe
    user.set_password('admin123')
    user.is_active = True
    user.save()
    
    print(f"\n✅ Mot de passe réinitialisé!")
    print(f"\n📧 Email: noelphara52@gmail.com")
    print(f"🔑 Mot de passe: admin123")
    print(f"👤 Rôle: {user.get_role_display()}")
    
    print("\n" + "=" * 60)
    print("Vous pouvez maintenant vous connecter!")
    print("=" * 60)
    
except User.DoesNotExist:
    print(f"\n❌ Erreur: Utilisateur non trouvé!")
except Exception as e:
    print(f"\n❌ Erreur: {e}")

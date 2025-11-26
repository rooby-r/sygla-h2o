#!/usr/bin/env python
"""
Script pour tester la connexion directement
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User
from django.contrib.auth import authenticate

print("=" * 60)
print("TEST DE CONNEXION")
print("=" * 60)

email = 'noelphara52@gmail.com'
password = 'admin123'

print(f"\n🔍 Test avec:")
print(f"   Email: {email}")
print(f"   Mot de passe: {password}")

# Vérifier que l'utilisateur existe
try:
    user = User.objects.get(email=email)
    print(f"\n✅ Utilisateur trouvé dans la base:")
    print(f"   Username: {user.username}")
    print(f"   Email: {user.email}")
    print(f"   Actif: {user.is_active}")
    print(f"   Rôle: {user.role}")
    
    # Vérifier le mot de passe
    if user.check_password(password):
        print(f"\n✅ Mot de passe CORRECT!")
    else:
        print(f"\n❌ Mot de passe INCORRECT!")
        print(f"   Le mot de passe stocké ne correspond pas")
    
    # Test d'authentification avec email
    print(f"\n🔐 Test authenticate avec EMAIL:")
    auth_user = authenticate(username=email, password=password)
    if auth_user:
        print(f"   ✅ Authentification réussie avec email")
    else:
        print(f"   ❌ Authentification échouée avec email")
    
    # Test d'authentification avec username
    print(f"\n🔐 Test authenticate avec USERNAME:")
    auth_user = authenticate(username=user.username, password=password)
    if auth_user:
        print(f"   ✅ Authentification réussie avec username")
    else:
        print(f"   ❌ Authentification échouée avec username")
        
except User.DoesNotExist:
    print(f"\n❌ Utilisateur NON TROUVÉ dans la base!")

print("\n" + "=" * 60)

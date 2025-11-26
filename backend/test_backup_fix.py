#!/usr/bin/env python
"""Test de la création de sauvegarde avec le fix"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.authentication.models import User
from apps.authentication.views_database import create_backup

print("=" * 60)
print("TEST DE CRÉATION DE SAUVEGARDE (JSON + Excel)")
print("=" * 60)

# Créer une requête
factory = APIRequestFactory()
request = factory.post('/api/auth/database/backup/')

# Authentifier avec admin
user = User.objects.get(email='admin@sygla-h2o.com')
force_authenticate(request, user=user)

print(f"\n✓ Utilisateur authentifié: {user.email} (rôle: {user.role})")
print("\nAppel de create_backup()...\n")

try:
    response = create_backup(request)
    print(f"✓ Status Code: {response.status_code}")
    print(f"\nRéponse:")
    import json
    print(json.dumps(response.data, indent=2, ensure_ascii=False))
    
    if response.status_code == 200:
        print("\n" + "=" * 60)
        print("✅ SUCCÈS - Sauvegarde créée!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ ERREUR")
        print("=" * 60)
        
except Exception as e:
    print(f"\n❌ Exception: {type(e).__name__}: {e}")
    import traceback
    print(traceback.format_exc())

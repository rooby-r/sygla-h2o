#!/usr/bin/env python
"""
Script de test pour l'endpoint database/stats
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
sys.path.insert(0, os.path.dirname(__file__))

django.setup()

# Test de l'endpoint
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.authentication.models import User
from apps.authentication.views_database import get_database_stats

print("=" * 60)
print("TEST DE L'ENDPOINT /api/auth/database/stats/")
print("=" * 60)

# Créer une fausse requête
factory = APIRequestFactory()
request = factory.get('/api/auth/database/stats/')

# Récupérer l'utilisateur admin
try:
    user = User.objects.get(email='admin@sygla-h2o.com')
    print(f"\n✓ Utilisateur trouvé: {user.email}")
    print(f"  - Role: {user.role}")
    print(f"  - Is authenticated: {user.is_authenticated}")
    print(f"  - Has 'role' attr: {hasattr(user, 'role')}")
except User.DoesNotExist:
    print("\n✗ Utilisateur admin@sygla-h2o.com non trouvé!")
    sys.exit(1)

# Forcer l'authentification
force_authenticate(request, user=user)
print(f"\n✓ Requête authentifiée avec {user.email}")

# Appeler la vue
print("\nAppel de get_database_stats()...")
try:
    response = get_database_stats(request)
    print(f"\n✓ Réponse reçue:")
    print(f"  - Status: {response.status_code}")
    print(f"  - Data: {response.data}")
except Exception as e:
    print(f"\n✗ Erreur lors de l'appel:")
    print(f"  - Type: {type(e).__name__}")
    print(f"  - Message: {str(e)}")
    import traceback
    print(f"\n  Traceback:")
    print(traceback.format_exc())

print("\n" + "=" * 60)

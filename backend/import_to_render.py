#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script pour importer les données vers PostgreSQL (Render)
"""
import os
import sys

# Forcer l'encodage UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Configuration - Utiliser la config Render du .env
os.environ['DJANGO_SETTINGS_MODULE'] = 'sygla_h2o.settings'

# NE PAS définir DATABASE_URL ici pour utiliser celui du .env (Render)

import django
django.setup()

from django.core.management import call_command
from django.db import connection

print("=" * 60)
print("   IMPORT DES DONNÉES VERS RENDER (PostgreSQL)")
print("=" * 60)

# Vérifier la connexion
print("\n📡 Vérification de la connexion à la base de données...")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Connecté à PostgreSQL")
        print(f"   Version: {version[:50]}...")
except Exception as e:
    print(f"❌ Erreur de connexion: {e}")
    sys.exit(1)

# Vérifier que le fichier d'export existe
if not os.path.exists('data_export_for_render.json'):
    print("\n❌ Le fichier 'data_export_for_render.json' n'existe pas!")
    print("   Exécutez d'abord: python export_sqlite_utf8.py")
    sys.exit(1)

print("\n⚠️  ATTENTION: Cette opération va:")
print("   1. Appliquer les migrations")
print("   2. Importer les données depuis data_export_for_render.json")
print("")
response = input("Voulez-vous continuer? (oui/non): ")

if response.lower() not in ['oui', 'o', 'yes', 'y']:
    print("Opération annulée.")
    sys.exit(0)

# Appliquer les migrations
print("\n📦 Application des migrations...")
try:
    call_command('migrate', '--verbosity=1')
    print("✅ Migrations appliquées")
except Exception as e:
    print(f"❌ Erreur: {e}")
    sys.exit(1)

# Importer les données
print("\n📥 Import des données...")
try:
    call_command('loaddata', 'data_export_for_render.json', '--verbosity=2')
    print("\n✅ Import terminé avec succès!")
except Exception as e:
    print(f"\n❌ Erreur lors de l'import: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Vérification finale
print("\n📊 Vérification des données importées:")
from django.apps import apps

for model in apps.get_models():
    try:
        count = model.objects.count()
        if count > 0:
            print(f"   - {model._meta.app_label}.{model.__name__}: {count} objets")
    except:
        pass

print("\n" + "=" * 60)
print("   ✅ MIGRATION TERMINÉE AVEC SUCCÈS!")
print("=" * 60)

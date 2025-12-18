#!/usr/bin/env python
"""
Script pour exporter les données depuis SQLite local
"""
import os
import sys

# Configuration
os.environ['DJANGO_SETTINGS_MODULE'] = 'sygla_h2o.settings'

# Forcer SQLite
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'

import django
django.setup()

from django.core.management import call_command

print("=" * 60)
print("   EXPORT DES DONNÉES DEPUIS SQLite")
print("=" * 60)

print("\nExport en cours...")

try:
    call_command(
        'dumpdata',
        '--natural-foreign',
        '--natural-primary',
        '--exclude=contenttypes',
        '--exclude=auth.permission', 
        '--exclude=admin.logentry',
        '--exclude=sessions.session',
        '--exclude=token_blacklist',
        '--indent=2',
        '--output=data_export_for_render.json'
    )
    print("\n✅ Export réussi!")
    print("   Fichier créé: data_export_for_render.json")
    
    # Vérifier la taille du fichier
    import os
    size = os.path.getsize('data_export_for_render.json')
    print(f"   Taille: {size:,} octets")
    
except Exception as e:
    print(f"\n❌ Erreur: {e}")
    import traceback
    traceback.print_exc()

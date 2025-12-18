#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script pour exporter les données depuis SQLite local avec encodage UTF-8
"""
import os
import sys
import json

# Forcer l'encodage UTF-8
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Configuration
os.environ['DJANGO_SETTINGS_MODULE'] = 'sygla_h2o.settings'
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'

import django
django.setup()

from django.core import serializers
from django.apps import apps

print("=" * 60)
print("   EXPORT DES DONNÉES DEPUIS SQLite (UTF-8)")
print("=" * 60)

# Liste des apps à exclure
EXCLUDE_APPS = ['contenttypes', 'auth.permission', 'admin', 'sessions']
EXCLUDE_MODELS = ['auth.permission']

# Récupérer tous les modèles
all_models = []
for app_config in apps.get_app_configs():
    app_label = app_config.label
    
    # Ignorer les apps exclues
    if app_label in EXCLUDE_APPS:
        continue
    if app_label == 'token_blacklist':
        continue
        
    for model in app_config.get_models():
        model_name = f"{app_label}.{model.__name__}"
        
        # Ignorer certains modèles
        if model_name.lower() in [m.lower() for m in EXCLUDE_MODELS]:
            continue
        if 'logentry' in model_name.lower():
            continue
        if 'session' in model_name.lower():
            continue
            
        all_models.append(model)

print(f"\nModèles à exporter: {len(all_models)}")
for m in all_models:
    count = m.objects.count()
    if count > 0:
        print(f"  - {m._meta.app_label}.{m.__name__}: {count} objets")

print("\nExport en cours...")

# Exporter les données
try:
    data = serializers.serialize(
        'json',
        sum([list(m.objects.all()) for m in all_models], []),
        indent=2,
        use_natural_foreign_keys=True,
        use_natural_primary_keys=True
    )
    
    # Écrire en UTF-8
    with open('data_export_for_render.json', 'w', encoding='utf-8') as f:
        f.write(data)
    
    print("\n✅ Export réussi!")
    print("   Fichier créé: data_export_for_render.json")
    
    size = os.path.getsize('data_export_for_render.json')
    print(f"   Taille: {size:,} octets")
    
except Exception as e:
    print(f"\n❌ Erreur: {e}")
    import traceback
    traceback.print_exc()

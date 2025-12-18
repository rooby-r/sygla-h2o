#!/usr/bin/env python
"""
Script de migration des données de SQLite vers PostgreSQL (Render)
"""
import os
import sys
import django

# Configuration pour utiliser SQLite localement
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')

def export_data_from_sqlite():
    """Exporte les données depuis SQLite"""
    print("=" * 60)
    print("ÉTAPE 1: Export des données depuis SQLite")
    print("=" * 60)
    
    # Temporairement utiliser SQLite
    from django.conf import settings
    from pathlib import Path
    
    BASE_DIR = Path(__file__).resolve().parent
    
    # Sauvegarder la config actuelle
    original_db = settings.DATABASES.copy()
    
    # Utiliser SQLite
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
    
    # Fermer les connexions existantes
    from django.db import connections
    for conn in connections.all():
        conn.close()
    
    # Export avec dumpdata
    from django.core.management import call_command
    from io import StringIO
    
    output = StringIO()
    
    print("\nExport des données...")
    try:
        call_command(
            'dumpdata',
            '--natural-foreign',
            '--natural-primary',
            '--exclude=contenttypes',
            '--exclude=auth.permission',
            '--exclude=admin.logentry',
            '--exclude=sessions.session',
            '--indent=2',
            stdout=output
        )
        
        data = output.getvalue()
        
        # Sauvegarder dans un fichier
        with open('data_export_for_render.json', 'w', encoding='utf-8') as f:
            f.write(data)
        
        print(f"✅ Données exportées vers 'data_export_for_render.json'")
        print(f"   Taille: {len(data)} caractères")
        
        # Restaurer la config originale
        settings.DATABASES = original_db
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'export: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "=" * 60)
    print("   MIGRATION SQLite → PostgreSQL (Render)")
    print("=" * 60 + "\n")
    
    # Vérifier que db.sqlite3 existe
    if not os.path.exists('db.sqlite3'):
        print("❌ Le fichier db.sqlite3 n'existe pas!")
        print("   Assurez-vous d'être dans le dossier backend/")
        return
    
    print("Ce script va:")
    print("1. Exporter les données de SQLite local")
    print("2. Vous donner les commandes pour importer vers Render")
    print()
    
    # Setup Django
    django.setup()
    
    # Export
    if export_data_from_sqlite():
        print("\n" + "=" * 60)
        print("ÉTAPE 2: Import vers Render")
        print("=" * 60)
        print("""
Pour importer les données vers Render, exécutez ces commandes:

1. D'abord, assurez-vous que le .env pointe vers Render (DATABASE_URL)

2. Appliquez les migrations sur Render:
   python manage.py migrate

3. Videz les données existantes (optionnel, attention!):
   python manage.py flush --no-input

4. Importez les données:
   python manage.py loaddata data_export_for_render.json

Ou utilisez le script import_to_render.py après avoir configuré .env
""")

if __name__ == '__main__':
    main()

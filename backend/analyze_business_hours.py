#!/usr/bin/env python
"""
Analyse de la configuration horaires vendeur
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import BusinessHoursConfig
from apps.authentication.business_hours import check_business_hours, ROLE_BUSINESS_HOURS
from apps.authentication.models import User
from django.utils import timezone

print("=" * 70)
print("ANALYSE LOGIQUE HORAIRES D'ACCÈS VENDEUR")
print("=" * 70)

# 1. Configuration en base de données
print("\n📊 1. CONFIGURATION EN BASE DE DONNÉES:")
config_db = BusinessHoursConfig.objects.filter(role='vendeur').first()
if config_db:
    print(f"   ✅ Configuration trouvée en DB")
    print(f"   • Restriction activée: {config_db.enabled}")
    print(f"   • Horaires: {config_db.get_time_range()}")
    print(f"   • Jours autorisés: {config_db.allowed_days}")
    print(f"   • Jours (noms): {config_db.get_allowed_days_display()}")
else:
    print(f"   ❌ Aucune configuration en DB")

# 2. Configuration par défaut dans le code
print("\n📋 2. CONFIGURATION PAR DÉFAUT DANS LE CODE:")
default_config = ROLE_BUSINESS_HOURS.get('vendeur')
if default_config:
    print(f"   • Restriction activée: {default_config['enabled']}")
    print(f"   • Horaire début: {default_config['start_time']}")
    print(f"   • Horaire fin: {default_config['end_time']}")
    print(f"   • Jours autorisés: {default_config['days']}")
    print(f"   • Message: {default_config['message']}")

# 3. Heure actuelle
print("\n🕐 3. HEURE ACTUELLE DU SYSTÈME:")
now = timezone.localtime(timezone.now())
print(f"   • Date/Heure: {now.strftime('%d/%m/%Y %H:%M:%S')}")
print(f"   • Heure: {now.time()}")
print(f"   • Jour de la semaine: {now.weekday()} (0=Lundi, 6=Dimanche)")
days_names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
print(f"   • Jour: {days_names[now.weekday()]}")

# 4. Test de connexion
print("\n🔐 4. TEST DE CONNEXION VENDEUR:")
try:
    user = User.objects.get(email='noelphara52@gmail.com')
    can_connect, message = check_business_hours(user)
    print(f"   • Utilisateur: {user.email}")
    print(f"   • Rôle: {user.role}")
    print(f"   • Peut se connecter: {'✅ OUI' if can_connect else '❌ NON'}")
    if message:
        print(f"   • Message: {message}")
except User.DoesNotExist:
    print(f"   ❌ Utilisateur non trouvé")

# 5. Analyse de la logique
print("\n🔍 5. ANALYSE DE LA LOGIQUE:")
print("\n   PRIORITÉ DE LA CONFIGURATION:")
print("   1️⃣ La fonction check_business_hours() vérifie d'abord la DB")
print("   2️⃣ Si pas de config en DB, utilise la config par défaut du code")
print("   3️⃣ Si 'enabled' = False, l'accès est autorisé 24/7")
print("   4️⃣ Si 'enabled' = True, vérifie jour + heure")

if config_db:
    print(f"\n   CONFIGURATION ACTIVE: Base de données")
    print(f"   • enabled = {config_db.enabled}")
    if config_db.enabled:
        print(f"   • L'accès est RESTREINT aux horaires configurés")
        print(f"   • Horaires: {config_db.get_time_range()}")
        print(f"   • Jours: {config_db.allowed_days}")
    else:
        print(f"   • L'accès est AUTORISÉ 24/7 (restriction désactivée)")
else:
    print(f"\n   CONFIGURATION ACTIVE: Par défaut (code)")
    print(f"   • enabled = {default_config['enabled']}")
    if default_config['enabled']:
        print(f"   • L'accès est RESTREINT aux horaires par défaut")
    else:
        print(f"   • L'accès est AUTORISÉ 24/7")

print("\n" + "=" * 70)

#!/usr/bin/env python
"""
Script pour vérifier les sessions actives
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import UserSession, User
from django.utils import timezone

print("=" * 60)
print("VÉRIFICATION DES SESSIONS")
print("=" * 60)

# Toutes les sessions
all_sessions = UserSession.objects.all().order_by('-login_time')
print(f"\n📊 Total de sessions: {all_sessions.count()}")

if all_sessions.exists():
    print("\n📋 Liste des sessions:")
    for session in all_sessions:
        status = "🟢 ACTIVE" if session.is_active else "🔴 INACTIVE"
        online = "✓ EN LIGNE" if session.is_online else "✗ Hors ligne"
        print(f"\n  {status} {online}")
        print(f"  Utilisateur: {session.user.email}")
        print(f"  IP: {session.ip_address}")
        print(f"  Appareil: {session.device_info}")
        print(f"  Connexion: {session.login_time.strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"  Dernière activité: {session.last_activity.strftime('%d/%m/%Y %H:%M:%S')}")

# Sessions actives
active_sessions = UserSession.get_active_sessions()
print(f"\n\n🟢 Sessions actives (< 5 min): {active_sessions.count()}")

# Utilisateurs connectés
print(f"\n\n👥 Utilisateurs avec session active:")
for session in active_sessions:
    print(f"  • {session.user.email} ({session.user.get_role_display()})")

print("\n" + "=" * 60)

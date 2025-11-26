#!/usr/bin/env python
import os
import sys
import django

# Configuration du chemin vers Django
sys.path.append('c:\\Users\\USER\\Documents\\GP\\V1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

try:
    # Récupérer l'utilisateur admin
    user = User.objects.get(username='admin')
    
    # Changer le mot de passe
    user.set_password('admin123')
    user.save()
    
    print(f"✅ Mot de passe mis à jour avec succès pour {user.username}")
    print(f"📧 Email: {user.email}")
    print(f"🔑 Nouveau mot de passe: admin123")
    print(f"👤 Rôle: {user.role}")
    
except User.DoesNotExist:
    print("❌ Utilisateur admin non trouvé")
except Exception as e:
    print(f"❌ Erreur: {e}")
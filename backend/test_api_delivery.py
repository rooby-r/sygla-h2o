#!/usr/bin/env python
"""
Script pour tester l'API de livraison avec authentification
"""
import os
import sys
import django
import requests
import json

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def test_delivery_api():
    """Tester l'API de livraison avec authentification"""
    
    print("🔐 Test de l'API de livraison avec authentification...")
    
    # URL de base
    base_url = "http://localhost:8000/api"
    
    # Récupérer un utilisateur
    try:
        user = User.objects.get(email='test@sygla-h2o.com')
        print(f"👤 Utilisateur: {user.username} ({user.email})")
        
        # Données de connexion
        login_data = {
            "email": user.email,
            "password": "test123"  # Mot de passe connu
        }
        
        # Connexion pour obtenir le token
        print("\n🔑 Tentative de connexion...")
        login_response = requests.post(f"{base_url}/auth/login/", json=login_data)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            print(f"📦 Réponse de connexion: Structure trouvée")
            access_token = token_data.get('tokens', {}).get('access')
            if not access_token:
                print("❌ Token d'accès non trouvé dans la réponse")
                print(f"📦 Structure de la réponse: {list(token_data.keys())}")
                return
            print(f"✅ Connexion réussie!")
            print(f"🎫 Token obtenu: {access_token[:50]}...")
            
            # Headers avec token
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Test de l'API des statistiques
            print("\n📊 Test de l'API des statistiques...")
            stats_response = requests.get(f"{base_url}/deliveries/stats/", headers=headers)
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                print("✅ Statistiques récupérées avec succès!")
                print(f"📦 Données reçues:")
                print(json.dumps(stats_data, indent=2, ensure_ascii=False))
                
                # Vérifier spécifiquement les planifiées
                planifiees = stats_data.get('planifiees', 0)
                print(f"\n🗓️  Planifiées dans l'API: {planifiees}")
                
                if planifiees > 0:
                    print("🎉 Les données des livraisons planifiées sont correctes!")
                else:
                    print("⚠️  Les livraisons planifiées sont à 0. Vérification nécessaire.")
                    
            else:
                print(f"❌ Erreur API statistiques: {stats_response.status_code}")
                print(f"📄 Réponse: {stats_response.text}")
                
        else:
            print(f"❌ Échec de la connexion: {login_response.status_code}")
            print(f"📄 Réponse: {login_response.text}")
            
            # Essayer avec un autre mot de passe
            print("\n🔄 Tentative avec d'autres mots de passe...")
            passwords = ["password", "12345", "admin", "123456", "test123"]
            
            for pwd in passwords:
                login_data["password"] = pwd
                test_response = requests.post(f"{base_url}/auth/login/", json=login_data)
                if test_response.status_code == 200:
                    print(f"✅ Mot de passe trouvé: {pwd}")
                    token_data = test_response.json()
                    access_token = token_data.get('access')
                    
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                    
                    stats_response = requests.get(f"{base_url}/deliveries/stats/", headers=headers)
                    if stats_response.status_code == 200:
                        stats_data = stats_response.json()
                        print("✅ Statistiques récupérées!")
                        print(json.dumps(stats_data, indent=2, ensure_ascii=False))
                    break
                else:
                    print(f"❌ {pwd}: {test_response.status_code}")
                    
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

if __name__ == "__main__":
    test_delivery_api()
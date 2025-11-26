#!/usr/bin/env python
"""
Script pour tester l'API des livraisons avec les adresses
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

def test_deliveries_with_addresses():
    """Tester l'API des livraisons pour vérifier les adresses"""
    
    print("🏠 Test de l'API des livraisons avec adresses...")
    
    # URL de base
    base_url = "http://localhost:8000/api"
    
    try:
        # Se connecter
        user = User.objects.get(email='test@sygla-h2o.com')
        
        login_data = {
            "email": user.email,
            "password": "test123"
        }
        
        # Connexion
        login_response = requests.post(f"{base_url}/auth/login/", json=login_data)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('tokens', {}).get('access')
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Récupérer les livraisons
            print("\n📦 Récupération des livraisons...")
            deliveries_response = requests.get(f"{base_url}/deliveries/", headers=headers)
            
            if deliveries_response.status_code == 200:
                deliveries_data = deliveries_response.json()
                deliveries = deliveries_data.get('results', deliveries_data)
                
                print(f"✅ {len(deliveries)} livraisons récupérées")
                
                # Afficher quelques exemples avec les adresses
                for i, delivery in enumerate(deliveries[:3]):
                    print(f"\n📋 Livraison {i+1}: {delivery.get('numero_commande', 'N/A')}")
                    print(f"   • Client: {delivery.get('client', {}).get('raison_sociale', 'N/A')}")
                    print(f"   • Adresse client: {delivery.get('client', {}).get('adresse', 'N/A')}")
                    print(f"   • Adresse livraison: {delivery.get('adresse_livraison', 'N/A')}")
                    print(f"   • Type: {delivery.get('type_livraison', 'N/A')}")
                    print(f"   • Statut: {delivery.get('statut', 'N/A')}")
                    print(f"   • Livreur: {delivery.get('livreur', 'N/A')}")
                
            else:
                print(f"❌ Erreur API livraisons: {deliveries_response.status_code}")
                print(f"📄 Réponse: {deliveries_response.text}")
                
        else:
            print(f"❌ Échec de la connexion: {login_response.status_code}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

if __name__ == "__main__":
    test_deliveries_with_addresses()
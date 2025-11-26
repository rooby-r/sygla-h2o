#!/usr/bin/env python
"""
Script pour tester l'assignation automatique du livreur
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
from apps.orders.models import Commande

def test_auto_assign_delivery():
    """Tester l'assignation automatique du livreur"""
    
    print("🚚 Test d'assignation automatique du livreur...")
    
    # URL de base
    base_url = "http://localhost:8000/api"
    
    try:
        # Se connecter en tant que livreur
        livreur = User.objects.get(email='livreur@sygla-h2o.com')
        print(f"👤 Livreur: {livreur.get_full_name()} ({livreur.email})")
        
        # Données de connexion
        login_data = {
            "email": livreur.email,
            "password": "livreur123"
        }
        
        # Connexion pour obtenir le token
        print("\n🔑 Connexion du livreur...")
        login_response = requests.post(f"{base_url}/auth/login/", json=login_data)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('tokens', {}).get('access')
            print(f"✅ Connexion réussie!")
            
            # Headers avec token
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Trouver une commande validée pour tester
            commande_test = Commande.objects.filter(
                statut='validee',
                type_livraison='livraison_domicile'
            ).first()
            
            if not commande_test:
                print("❌ Aucune commande validée disponible pour le test")
                return
                
            print(f"\n📦 Commande sélectionnée: {commande_test.numero_commande}")
            print(f"   • Statut actuel: {commande_test.statut}")
            print(f"   • Livreur actuel: {commande_test.livreur or 'Aucun'}")
            
            # Mettre à jour le statut vers "en_livraison"
            print(f"\n🚛 Mise à jour du statut vers 'en_livraison'...")
            status_data = {
                "statut": "en_livraison"
            }
            
            status_response = requests.patch(
                f"{base_url}/deliveries/{commande_test.id}/status/",
                json=status_data,
                headers=headers
            )
            
            if status_response.status_code == 200:
                response_data = status_response.json()
                print("✅ Statut mis à jour avec succès!")
                print(f"📄 Réponse: {response_data.get('message', 'Pas de message')}")
                
                # Vérifier la commande mise à jour
                commande_test.refresh_from_db()
                print(f"\n🔍 Vérification:")
                print(f"   • Nouveau statut: {commande_test.statut}")
                print(f"   • Livreur assigné: {commande_test.livreur or 'Aucun'}")
                
                if commande_test.livreur == livreur.get_full_name():
                    print("🎉 SUCCÈS: Livreur assigné automatiquement!")
                else:
                    print("⚠️  Le livreur n'a pas été assigné automatiquement")
                    
            else:
                print(f"❌ Erreur lors de la mise à jour: {status_response.status_code}")
                print(f"📄 Réponse: {status_response.text}")
                
        else:
            print(f"❌ Échec de la connexion: {login_response.status_code}")
            print(f"📄 Réponse: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

if __name__ == "__main__":
    test_auto_assign_delivery()
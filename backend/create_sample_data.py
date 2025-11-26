#!/usr/bin/env python
import os
import sys
import django

# Configuration Django
sys.path.append('c:\\Users\\USER\\Documents\\GP\\V1\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.clients.models import Client
from apps.products.models import Produit

def create_sample_data():
    try:
        print("🔧 Création des données de test...")
        
        # Créer des clients de test
        clients_data = [
            {
                'raison_sociale': 'Restaurant Le Palmier',
                'nom_commercial': 'Le Palmier',
                'contact': 'Marie Dubois',
                'telephone': '+50912345678',
                'email': 'contact@palmier.ht',
                'adresse': '123 Rue des Palmiers, Port-au-Prince'
            },
            {
                'raison_sociale': 'Hôtel Caraïbes SARL',
                'nom_commercial': 'Hôtel Caraïbes',
                'contact': 'Jean Baptiste',
                'telephone': '+50923456789',
                'email': 'reservation@hotelcaraibes.ht',
                'adresse': '456 Avenue des Hôtels, Pétion-Ville'
            },
            {
                'raison_sociale': 'Supermarché Central SA',
                'nom_commercial': 'Central Market',
                'contact': 'Paul Martin',
                'telephone': '+50934567890',
                'email': 'achat@supercentral.ht',
                'adresse': '789 Boulevard Commercial, Port-au-Prince'
            }
        ]
        
        for client_data in clients_data:
            client, created = Client.objects.get_or_create(
                raison_sociale=client_data['raison_sociale'],
                defaults=client_data
            )
            if created:
                print(f"✅ Client créé: {client.raison_sociale}")
            else:
                print(f"ℹ️ Client existe: {client.raison_sociale}")
        
        # Créer des produits de test
        produits_data = [
            {
                'nom': 'Eau Potable 5L',
                'description': 'Bouteille d\'eau potable de 5 litres',
                'type_produit': 'Eau',
                'unite_mesure': 'Bouteille',
                'prix_unitaire': 50.00,
                'stock_actuel': 100
            },
            {
                'nom': 'Eau Potable 20L',
                'description': 'Gallon d\'eau potable de 20 litres',
                'type_produit': 'Eau',
                'unite_mesure': 'Gallon',
                'prix_unitaire': 150.00,
                'stock_actuel': 50
            },
            {
                'nom': 'Glace en Bloc 10kg',
                'description': 'Bloc de glace de 10 kilogrammes',
                'type_produit': 'Glace',
                'unite_mesure': 'Bloc',
                'prix_unitaire': 75.00,
                'stock_actuel': 30
            },
            {
                'nom': 'Glace en Cubes 5kg',
                'description': 'Sac de glaçons de 5 kilogrammes',
                'type_produit': 'Glace',
                'unite_mesure': 'Sac',
                'prix_unitaire': 60.00,
                'stock_actuel': 40
            }
        ]
        
        for produit_data in produits_data:
            produit, created = Produit.objects.get_or_create(
                nom=produit_data['nom'],
                defaults=produit_data
            )
            if created:
                print(f"✅ Produit créé: {produit.nom}")
            else:
                print(f"ℹ️ Produit existe: {produit.nom}")
        
        print("\n📊 DONNÉES CRÉÉES:")
        print("=" * 40)
        print(f"👥 Clients: {Client.objects.count()}")
        print(f"📦 Produits: {Produit.objects.count()}")
        print("=" * 40)
        
        print("\n🏢 CLIENTS:")
        for client in Client.objects.all():
            print(f"   - {client.raison_sociale} ({client.nom_commercial})")
            
        print("\n📦 PRODUITS:")
        for produit in Produit.objects.all():
            print(f"   - {produit.nom} - {produit.prix_unitaire} HTG - Stock: {produit.stock_actuel}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    create_sample_data()
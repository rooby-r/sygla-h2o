#!/usr/bin/env python
"""
Script pour mettre à jour les adresses avec des données plus réalistes
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.orders.models import Commande
from apps.clients.models import Client

def update_realistic_addresses():
    """Mettre à jour les adresses avec des données plus réalistes"""
    
    print("🏠 Mise à jour des adresses avec des données réalistes...")
    
    # Adresses réalistes pour Haïti
    adresses_realistes = [
        "123 Rue Lamarre, Pétion-Ville, Port-au-Prince, Haïti",
        "456 Avenue Jean-Paul II, Delmas 33, Port-au-Prince, Haïti", 
        "789 Boulevard Harry Truman, Bicentenaire, Port-au-Prince, Haïti",
        "321 Rue Panamericaine, Carrefour, Port-au-Prince, Haïti",
        "654 Avenue Christophe, Cap-Haïtien, Haïti",
        "987 Rue des Casernes, Jacmel, Sud-Est, Haïti",
        "147 Boulevard 15 Octobre, Tabarre, Port-au-Prince, Haïti",
        "258 Avenue Magloire Ambroise, Pétion-Ville, Haïti",
        "369 Rue Geffrard, Lalue, Port-au-Prince, Haïti",
        "741 Boulevard de la Saline, Cité Soleil, Port-au-Prince, Haïti"
    ]
    
    # Mettre à jour les clients d'abord
    clients = Client.objects.all()
    for i, client in enumerate(clients):
        if i < len(adresses_realistes):
            old_address = client.adresse
            client.adresse = adresses_realistes[i]
            client.save()
            print(f"✅ Client {client.raison_sociale}: {old_address} → {client.adresse}")
    
    # Mettre à jour les commandes avec des adresses de livraison variées
    commandes = Commande.objects.filter(type_livraison='livraison_domicile')
    
    for i, commande in enumerate(commandes):
        # Utiliser une adresse différente pour certaines commandes (livraison à une autre adresse)
        if i % 3 == 0:  # Une commande sur trois a une adresse différente
            index = (i + 3) % len(adresses_realistes)
            commande.adresse_livraison = adresses_realistes[index]
        else:
            # Utiliser l'adresse du client
            commande.adresse_livraison = commande.client.adresse if commande.client else adresses_realistes[i % len(adresses_realistes)]
        
        commande.save()
        print(f"📦 {commande.numero_commande}: {commande.adresse_livraison}")
    
    print(f"\n🎯 {commandes.count()} commandes mises à jour avec des adresses réalistes!")

if __name__ == "__main__":
    update_realistic_addresses()
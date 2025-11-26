#!/usr/bin/env python
"""
Script pour tester l'affichage des adresses de livraison
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

def test_delivery_addresses():
    """Tester et mettre à jour les adresses de livraison"""
    
    print("🏠 Test des adresses de livraison...")
    
    # Récupérer quelques commandes pour tester
    commandes = Commande.objects.all()[:5]
    
    print(f"📦 Nombre de commandes trouvées: {commandes.count()}")
    
    for commande in commandes:
        print(f"\n📋 Commande: {commande.numero_commande}")
        print(f"   • Client: {commande.client.raison_sociale if commande.client else 'Aucun'}")
        print(f"   • Adresse client: {commande.client.adresse if commande.client else 'Aucune'}")
        print(f"   • Adresse livraison: {commande.adresse_livraison or 'Non spécifiée'}")
        print(f"   • Type de livraison: {commande.type_livraison}")
        
        # Si pas d'adresse de livraison et que c'est une livraison à domicile, utiliser l'adresse du client
        if not commande.adresse_livraison and commande.type_livraison == 'livraison_domicile' and commande.client:
            commande.adresse_livraison = commande.client.adresse
            commande.save()
            print(f"   ✅ Adresse de livraison mise à jour: {commande.adresse_livraison}")
    
    print(f"\n🎯 Test terminé!")

if __name__ == "__main__":
    test_delivery_addresses()
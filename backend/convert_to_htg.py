#!/usr/bin/env python
"""
Script pour convertir les données existantes en HTG
et créer des données de test avec la monnaie HTG
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

django.setup()

from apps.clients.models import Client
from apps.products.models import Produit, MouvementStock
from apps.orders.models import Commande, ItemCommande
from apps.authentication.models import User
from decimal import Decimal

def convert_to_htg():
    """Convertit les montants existants en HTG (approximation 1 USD = 110 HTG)"""
    
    print("🔄 Conversion des données en HTG...")
    
    # Taux de change approximatif
    USD_TO_HTG = Decimal('110.00')
    
    # Conversion des produits
    print("📦 Conversion des prix des produits...")
    produits = Produit.objects.all()
    for produit in produits:
        if produit.prix_unitaire < 50:  # Supposé être en USD
            produit.prix_unitaire = produit.prix_unitaire * USD_TO_HTG
            produit.save()
            print(f"  ✅ {produit.nom}: {produit.prix_unitaire} HTG")
    
    # Conversion des limites de crédit des clients
    print("👥 Conversion des crédits clients...")
    clients = Client.objects.all()
    for client in clients:
        if client.credit_limite < 1000:  # Supposé être en USD
            client.credit_limite = client.credit_limite * USD_TO_HTG
        if client.credit_utilise < 1000:  # Supposé être en USD
            client.credit_utilise = client.credit_utilise * USD_TO_HTG
        client.save()
        print(f"  ✅ {client.nom}: Limite {client.credit_limite} HTG")
    
    # Conversion des commandes
    print("🛒 Conversion des montants des commandes...")
    commandes = Commande.objects.all()
    for commande in commandes:
        if commande.montant_total < 1000:  # Supposé être en USD
            commande.montant_total = commande.montant_total * USD_TO_HTG
            commande.save()
            print(f"  ✅ Commande #{commande.id}: {commande.montant_total} HTG")
    
    # Conversion des items de commande
    print("📋 Conversion des prix unitaires des items...")
    items = ItemCommande.objects.all()
    for item in items:
        if item.prix_unitaire < 50:  # Supposé être en USD
            item.prix_unitaire = item.prix_unitaire * USD_TO_HTG
            item.sous_total = item.quantite * item.prix_unitaire
            item.save()
            print(f"  ✅ Item {item.produit.nom}: {item.prix_unitaire} HTG")

def create_htg_test_data():
    """Crée des données de test avec des montants réalistes en HTG"""
    
    print("🎯 Création de données de test en HTG...")
    
    # Créer des produits avec des prix en HTG
    produits_data = [
        {
            'nom': 'Eau Potable Crystal 1L',
            'type': 'eau',
            'description': 'Eau potable purifiée et minéralisée en bouteille 1L',
            'prix_unitaire': Decimal('75.00'),  # 75 HTG
            'unite_mesure': 'bouteille',
            'stock_actuel': 1000,
            'stock_minimum': 100,
        },
        {
            'nom': 'Eau Potable Crystal 5L',
            'type': 'eau',
            'description': 'Eau potable purifiée et minéralisée en bouteille 5L',
            'prix_unitaire': Decimal('350.00'),  # 350 HTG
            'unite_mesure': 'bouteille',
            'stock_actuel': 500,
            'stock_minimum': 50,
        },
        {
            'nom': 'Glace Alimentaire Premium',
            'type': 'glace',
            'description': 'Glace alimentaire de qualité premium pour conservation',
            'prix_unitaire': Decimal('125.00'),  # 125 HTG
            'unite_mesure': 'kg',
            'stock_actuel': 800,
            'stock_minimum': 100,
        },
        {
            'nom': 'Eau de Table 20L',
            'type': 'eau',
            'description': 'Eau de table en bonbonne 20L pour distributeur',
            'prix_unitaire': Decimal('450.00'),  # 450 HTG
            'unite_mesure': 'bonbonne',
            'stock_actuel': 200,
            'stock_minimum': 20,
        }
    ]
    
    for data in produits_data:
        produit, created = Produit.objects.get_or_create(
            nom=data['nom'],
            defaults=data
        )
        if created:
            print(f"  ✅ Produit créé: {produit.nom} - {produit.prix_unitaire} HTG/{produit.unite_mesure}")
    
    # Créer des clients avec des limites de crédit en HTG
    clients_data = [
        {
            'nom': 'Restaurant Le Palmier',
            'email': 'contact@lepalmier.ht',
            'telephone': '+509 1234-5678',
            'adresse': '15 Rue Capois, Port-au-Prince',
            'ville': 'Port-au-Prince',
            'code_postal': 'HT6110',
            'secteur_activite': 'Restauration',
            'credit_limite': Decimal('50000.00'),  # 50,000 HTG
            'contact_principal': 'Marie Dupont',
            'notes': 'Client premium - Restaurant gastronomique',
        },
        {
            'nom': 'Hôtel Royal Plaza',
            'email': 'reservation@royalplaza.ht',
            'telephone': '+509 2345-6789',
            'adresse': '42 Boulevard Jean-Jacques Dessalines',
            'ville': 'Port-au-Prince',
            'code_postal': 'HT6111',
            'secteur_activite': 'Hôtellerie',
            'credit_limite': Decimal('100000.00'),  # 100,000 HTG
            'contact_principal': 'Jean Baptiste',
            'notes': 'Hôtel 4 étoiles - Livraisons quotidiennes',
        },
        {
            'nom': 'Supermarché Bon Marché',
            'email': 'info@bonmarche.ht',
            'telephone': '+509 3456-7890',
            'adresse': '88 Rue Monsignor Guilloux',
            'ville': 'Port-au-Prince',
            'code_postal': 'HT6112',
            'secteur_activite': 'Commerce',
            'credit_limite': Decimal('75000.00'),  # 75,000 HTG
            'contact_principal': 'Pierre Moïse',
            'notes': 'Supermarché de quartier - Paiement 30 jours',
        }
    ]
    
    for data in clients_data:
        try:
            # Essayer de récupérer le client existant uniquement
            client = Client.objects.get(email=data['email'])
            print(f"  ℹ️ Client existant: {client.nom}")
        except Client.DoesNotExist:
            # Créer seulement si n'existe pas et qu'on veut vraiment le créer
            print(f"  ⚠️ Client {data['email']} n'existe pas (non recréé automatiquement)")
            # client = Client.objects.create(**data)
            # print(f"  ✅ Client créé: {client.nom} - Crédit: {client.credit_limite} HTG")

def main():
    print("💰 Conversion vers la monnaie HTG (Gourde Haïtienne)")
    print("=" * 50)
    
    # Convertir les données existantes
    convert_to_htg()
    
    print("\n" + "=" * 50)
    
    # Créer des données de test
    create_htg_test_data()
    
    print("\n✅ Conversion HTG terminée avec succès!")
    print("💡 Tous les montants sont maintenant en Gourdes Haïtiennes (HTG)")
    print("📊 Taux de référence utilisé: 1 USD = 110 HTG")

if __name__ == '__main__':
    main()
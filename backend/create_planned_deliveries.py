#!/usr/bin/env python
"""
Script pour créer des commandes de livraison planifiées avec des dates futures
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from django.utils import timezone
from apps.orders.models import Commande, ItemCommande
from apps.clients.models import Client
from apps.products.models import Produit
from apps.authentication.models import User

def create_planned_deliveries():
    """Créer des commandes de livraison planifiées pour aujourd'hui"""
    
    print("🚀 Création de nouvelles commandes planifiées...")
    
    # Date actuelle
    today = timezone.now()
    print(f"📅 Date actuelle: {today.date()}")
    
    # Récupérer ou créer les entités nécessaires
    try:
        vendeur = User.objects.filter(role='vendeur').first()
        if not vendeur:
            vendeur = User.objects.filter(is_staff=True).first()
        
        client = Client.objects.first()
        if not client:
            client = Client.objects.create(
                raison_sociale='Client Test Livraison Planifiée',
                nom='Test Livraison',
                contact='M. Test',
                telephone='+509 1234-5678',
                email='client.planifie@test.com',
                adresse='456 Avenue Test, Port-au-Prince, Haïti',
                type_client='entreprise'
            )
            print(f"✅ Client créé: {client.raison_sociale}")
        
        produit = Produit.objects.first()
        if not produit:
            produit = Produit.objects.create(
                nom='Eau Potable Test',
                description='Eau potable pour test',
                prix_unitaire=25.00,
                unite_mesure='litre',
                stock_actuel=1000,
                stock_minimal=50,
                type_produit='eau'
            )
            print(f"✅ Produit créé: {produit.nom}")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création des entités: {e}")
        return

    # Supprimer les anciennes commandes de test
    print("🗑️  Suppression des anciennes commandes de test...")
    Commande.objects.filter(notes__contains='Test planifié').delete()
    
    # Créer de nouvelles commandes planifiées
    commandes_data = [
        {
            'date_offset': 1,  # Demain
            'statut': 'validee',
            'notes': 'Test planifié - Livraison pour demain'
        },
        {
            'date_offset': 2,  # Après-demain
            'statut': 'en_preparation',
            'notes': 'Test planifié - Livraison après-demain'
        },
        {
            'date_offset': 3,  # Dans 3 jours
            'statut': 'validee',
            'notes': 'Test planifié - Livraison dans 3 jours'
        },
        {
            'date_offset': 5,  # Dans 5 jours
            'statut': 'en_preparation',
            'notes': 'Test planifié - Livraison dans 5 jours'
        },
        {
            'date_offset': 7,  # Dans une semaine
            'statut': 'validee',
            'notes': 'Test planifié - Livraison dans une semaine'
        }
    ]
    
    created_count = 0
    for i, cmd_data in enumerate(commandes_data):
        try:
            # Date de livraison future
            date_livraison = today + timedelta(days=cmd_data['date_offset'])
            
            # Créer la commande
            commande = Commande.objects.create(
                client=client,
                vendeur=vendeur,
                type_livraison='livraison_domicile',
                statut=cmd_data['statut'],
                date_livraison_prevue=date_livraison,
                notes=cmd_data['notes']
            )
            
            # Ajouter un article
            ItemCommande.objects.create(
                commande=commande,
                produit=produit,
                quantite=50 + (i * 10),
                prix_unitaire=produit.prix_unitaire
            )
            
            # Recalculer les totaux
            commande.calculer_montant_total()
            commande.save()
            
            created_count += 1
            print(f"✅ Commande {created_count} créée:")
            print(f"   • N°: {commande.numero_commande}")
            print(f"   • Statut: {commande.statut}")
            print(f"   • Type: {commande.type_livraison}")
            print(f"   • Date livraison: {date_livraison.strftime('%d/%m/%Y à %H:%M')}")
            print(f"   • Total: {commande.montant_total} HTG")
            
        except Exception as e:
            print(f"❌ Erreur lors de la création de la commande {i+1}: {e}")
    
    # Créer quelques commandes en livraison et livrées pour les autres stats
    try:
        # Commande en livraison
        commande_en_cours = Commande.objects.create(
            client=client,
            vendeur=vendeur,
            type_livraison='livraison_domicile',
            statut='en_livraison',
            date_livraison_prevue=today,
            notes='Test - Commande en cours de livraison'
        )
        ItemCommande.objects.create(
            commande=commande_en_cours,
            produit=produit,
            quantite=30,
            prix_unitaire=produit.prix_unitaire
        )
        commande_en_cours.calculer_montant_total()
        commande_en_cours.save()
        print(f"✅ Commande en livraison créée: {commande_en_cours.numero_commande}")
        
        # Commandes livrées
        for j in range(3):
            commande_livree = Commande.objects.create(
                client=client,
                vendeur=vendeur,
                type_livraison='livraison_domicile',
                statut='livree',
                date_livraison_prevue=today - timedelta(days=j+1),
                date_livraison_effective=today - timedelta(days=j+1),
                notes=f'Test - Commande livrée {j+1}'
            )
            ItemCommande.objects.create(
                commande=commande_livree,
                produit=produit,
                quantite=25,
                prix_unitaire=produit.prix_unitaire
            )
            commande_livree.calculer_montant_total()
            commande_livree.save()
        
        print(f"✅ 3 commandes livrées créées")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création des commandes supplémentaires: {e}")
    
    # Vérification finale
    print(f"\n📊 Récapitulatif des commandes créées:")
    
    # Commandes planifiées
    planifiees = Commande.objects.filter(
        statut__in=['validee', 'en_preparation'],
        type_livraison='livraison_domicile',
        date_livraison_prevue__gt=timezone.now()
    )
    print(f"   🗓️  Planifiées (futures): {planifiees.count()}")
    
    # En cours
    en_cours = Commande.objects.filter(statut='en_livraison')
    print(f"   🚚 En cours: {en_cours.count()}")
    
    # Livrées
    livrees = Commande.objects.filter(statut='livree')
    print(f"   ✅ Livrées: {livrees.count()}")
    
    # Total
    total = en_cours.count() + livrees.count()
    print(f"   📈 Total livraisons: {total}")
    
    print(f"\n🎉 Données de test créées avec succès!")
    print(f"   La section 'Planifiées' devrait maintenant afficher: {planifiees.count()}")

if __name__ == "__main__":
    print("🏗️  Création de données de livraisons planifiées pour octobre 2025...")
    create_planned_deliveries()
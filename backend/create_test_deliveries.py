#!/usr/bin/env python
"""
Script pour créer des commandes de test avec livraisons à domicile planifiées
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

def create_test_deliveries():
    """Créer des commandes de test avec livraisons à domicile planifiées"""
    
    # Récupérer ou créer un vendeur
    try:
        vendeur = User.objects.filter(role='vendeur').first()
        if not vendeur:
            vendeur = User.objects.create_user(
                username='vendeur_test',
                email='vendeur@test.com',
                first_name='Jean',
                last_name='Vendeur',
                role='vendeur'
            )
            vendeur.set_password('password123')
            vendeur.save()
            print(f"✅ Vendeur créé: {vendeur.username}")
    except Exception as e:
        print(f"❌ Erreur lors de la création du vendeur: {e}")
        return

    # Récupérer ou créer un client
    try:
        client = Client.objects.first()
        if not client:
            client = Client.objects.create(
                raison_sociale='Client Test Livraison',
                nom='Test Livraison',
                contact='M. Test',
                telephone='+509 1234-5678',
                email='client@test.com',
                adresse='123 Rue de Test, Port-au-Prince, Haïti',
                type_client='entreprise'
            )
            print(f"✅ Client créé: {client.raison_sociale}")
    except Exception as e:
        print(f"❌ Erreur lors de la création du client: {e}")
        return

    # Récupérer ou créer des produits
    try:
        produit1 = Produit.objects.filter(nom__icontains='eau').first()
        if not produit1:
            produit1 = Produit.objects.create(
                nom='Eau Potable Premium',
                description='Eau potable de haute qualité',
                prix_unitaire=25.00,
                unite_mesure='litre',
                stock_actuel=1000,
                stock_minimal=50,
                type_produit='eau'
            )
            print(f"✅ Produit créé: {produit1.nom}")
            
        produit2 = Produit.objects.filter(nom__icontains='glace').first()
        if not produit2:
            produit2 = Produit.objects.create(
                nom='Glace Alimentaire',
                description='Glace alimentaire pour événements',
                prix_unitaire=15.00,
                unite_mesure='kg',
                stock_actuel=500,
                stock_minimal=25,
                type_produit='glace'
            )
            print(f"✅ Produit créé: {produit2.nom}")
    except Exception as e:
        print(f"❌ Erreur lors de la création des produits: {e}")
        return

    # Créer des commandes de livraison à domicile planifiées
    today = timezone.now()
    
    commandes_data = [
        {
            'client': client,
            'vendeur': vendeur,
            'type_livraison': 'livraison_domicile',
            'statut': 'validee',
            'date_livraison_prevue': today + timedelta(days=1),  # Demain
            'notes': 'Livraison urgente pour demain matin',
            'items': [
                {'produit': produit1, 'quantite': 50, 'prix_unitaire': produit1.prix_unitaire},
                {'produit': produit2, 'quantite': 20, 'prix_unitaire': produit2.prix_unitaire}
            ]
        },
        {
            'client': client,
            'vendeur': vendeur,
            'type_livraison': 'livraison_domicile',
            'statut': 'en_preparation',
            'date_livraison_prevue': today + timedelta(days=2),  # Après-demain
            'notes': 'Commande pour événement spécial',
            'items': [
                {'produit': produit1, 'quantite': 75, 'prix_unitaire': produit1.prix_unitaire},
                {'produit': produit2, 'quantite': 40, 'prix_unitaire': produit2.prix_unitaire}
            ]
        },
        {
            'client': client,
            'vendeur': vendeur,
            'type_livraison': 'livraison_domicile',
            'statut': 'validee',
            'date_livraison_prevue': today + timedelta(days=3),  # Dans 3 jours
            'notes': 'Livraison programmée pour vendredi',
            'items': [
                {'produit': produit1, 'quantite': 100, 'prix_unitaire': produit1.prix_unitaire}
            ]
        },
        {
            'client': client,
            'vendeur': vendeur,
            'type_livraison': 'livraison_domicile',
            'statut': 'en_preparation',
            'date_livraison_prevue': today + timedelta(days=7),  # Dans une semaine
            'notes': 'Commande pour la semaine prochaine',
            'items': [
                {'produit': produit2, 'quantite': 60, 'prix_unitaire': produit2.prix_unitaire}
            ]
        },
        # Quelques commandes de retrait magasin pour comparaison
        {
            'client': client,
            'vendeur': vendeur,
            'type_livraison': 'retrait_magasin',
            'statut': 'validee',
            'date_livraison_prevue': None,
            'notes': 'Client viendra récupérer',
            'items': [
                {'produit': produit1, 'quantite': 25, 'prix_unitaire': produit1.prix_unitaire}
            ]
        }
    ]

    print("\n🚀 Création des commandes de test...")
    
    for i, commande_data in enumerate(commandes_data):
        try:
            # Créer la commande
            items_data = commande_data.pop('items')
            commande = Commande.objects.create(**commande_data)
            
            # Ajouter les articles
            for item_data in items_data:
                ItemCommande.objects.create(
                    commande=commande,
                    **item_data
                )
            
            # Recalculer les totaux
            commande.calculer_montant_total()
            commande.save()
            
            print(f"✅ Commande {i+1} créée: {commande.numero_commande} "
                  f"- {commande.type_livraison} - {commande.statut} "
                  f"- Total: {commande.montant_total} HTG")
            
            if commande.date_livraison_prevue:
                print(f"   📅 Date de livraison: {commande.date_livraison_prevue.strftime('%d/%m/%Y à %H:%M')}")
            
        except Exception as e:
            print(f"❌ Erreur lors de la création de la commande {i+1}: {e}")

    print(f"\n📊 Récapitulatif:")
    
    # Statistiques
    total_commandes = Commande.objects.count()
    livraisons_domicile = Commande.objects.filter(type_livraison='livraison_domicile').count()
    livraisons_planifiees = Commande.objects.filter(
        type_livraison='livraison_domicile',
        statut__in=['validee', 'en_preparation'],
        date_livraison_prevue__gt=timezone.now()
    ).count()
    
    print(f"   • Total des commandes: {total_commandes}")
    print(f"   • Livraisons à domicile: {livraisons_domicile}")
    print(f"   • Livraisons planifiées (futures): {livraisons_planifiees}")
    
    print(f"\n🎉 Données de test créées avec succès!")
    print(f"   Vous pouvez maintenant tester la page des livraisons")
    print(f"   La section 'Planifiées' devrait afficher: {livraisons_planifiees}")

if __name__ == "__main__":
    print("🏗️  Création de données de test pour les livraisons...")
    create_test_deliveries()
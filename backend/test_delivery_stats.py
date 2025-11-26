#!/usr/bin/env python
"""
Script pour tester les statistiques de livraison
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
from apps.orders.models import Commande

def test_delivery_stats():
    """Tester les statistiques de livraison"""
    
    print("📊 Test des statistiques de livraison...")
    print(f"📅 Date actuelle: {timezone.now()}")
    print()
    
    # Compter toutes les commandes
    total_commandes = Commande.objects.count()
    print(f"📦 Total des commandes dans la base: {total_commandes}")
    
    # Statistiques par statut
    print("\n📋 Commandes par statut:")
    statuts = ['brouillon', 'en_attente', 'validee', 'en_preparation', 'en_livraison', 'livree', 'annulee']
    for statut in statuts:
        count = Commande.objects.filter(statut=statut).count()
        if count > 0:
            print(f"   • {statut}: {count}")
    
    # Statistiques par type de livraison
    print("\n🚚 Commandes par type de livraison:")
    types = ['livraison_domicile', 'retrait_magasin']
    for type_liv in types:
        count = Commande.objects.filter(type_livraison=type_liv).count()
        if count > 0:
            print(f"   • {type_liv}: {count}")
    
    # Test des commandes planifiées (logique exacte de l'API)
    print("\n🗓️  Test de la logique 'Planifiées':")
    
    # Critères exacts de la fonction delivery_stats
    now = timezone.now()
    print(f"   📅 Date/heure actuelle: {now}")
    
    # Commandes qui correspondent aux critères "planifiées"
    planifiees_queryset = Commande.objects.filter(
        statut__in=['validee', 'en_preparation'],
        type_livraison='livraison_domicile',
        date_livraison_prevue__gt=now
    )
    
    print(f"   🔍 Critères:")
    print(f"      • Statut: validee OR en_preparation")
    print(f"      • Type: livraison_domicile")
    print(f"      • Date livraison > {now}")
    print()
    
    print(f"   📊 Résultat: {planifiees_queryset.count()} commandes planifiées")
    
    # Détail des commandes planifiées
    if planifiees_queryset.exists():
        print("\n   📋 Détail des commandes planifiées:")
        for i, cmd in enumerate(planifiees_queryset[:10], 1):
            print(f"      {i}. {cmd.numero_commande}")
            print(f"         • Statut: {cmd.statut}")
            print(f"         • Type: {cmd.type_livraison}")
            print(f"         • Date prévue: {cmd.date_livraison_prevue}")
            print(f"         • Futur? {cmd.date_livraison_prevue > now}")
            print()
    
    # Test des autres statistiques
    print("📈 Autres statistiques:")
    
    # En cours
    en_cours = Commande.objects.filter(statut='en_livraison').count()
    print(f"   🚚 En cours: {en_cours}")
    
    # Livrées
    livrees = Commande.objects.filter(statut='livree').count()
    print(f"   ✅ Livrées: {livrees}")
    
    # Total livraisons
    total_livraisons = en_cours + livrees
    print(f"   📊 Total livraisons: {total_livraisons}")

if __name__ == "__main__":
    test_delivery_stats()
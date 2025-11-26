import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.orders.models import Commande
from apps.sales.models import Vente
from django.db.models import Sum

print("💰 Test du Calcul du Chiffre d'Affaires")
print("=" * 80)

# Statistiques des ventes (100% payées)
ventes = Vente.objects.filter(statut_paiement='paye')
ventes_montant = ventes.aggregate(total=Sum('montant_paye'))['total'] or 0

print(f"\n📊 VENTES (100% payées):")
print(f"   Nombre de ventes: {ventes.count()}")
print(f"   Montant total: {ventes_montant:,.2f} HTG")

# Statistiques des commandes avec paiements
commandes = Commande.objects.all()
commandes_avec_paiement = commandes.filter(montant_paye__gt=0)
commandes_paiements = commandes_avec_paiement.aggregate(total=Sum('montant_paye'))['total'] or 0

print(f"\n📦 COMMANDES (avec paiements):")
print(f"   Total commandes: {commandes.count()}")
print(f"   Commandes avec paiement: {commandes_avec_paiement.count()}")
print(f"   Montant payé total: {commandes_paiements:,.2f} HTG")

# Détails des commandes
if commandes_avec_paiement.exists():
    print(f"\n   Détails des commandes:")
    for cmd in commandes_avec_paiement:
        print(f"   • {cmd.numero_commande}")
        print(f"     - Montant total: {cmd.montant_total:,.2f} HTG")
        print(f"     - Montant payé: {cmd.montant_paye:,.2f} HTG ({cmd.get_statut_paiement_display()})")
        print(f"     - Montant restant: {cmd.montant_restant:,.2f} HTG")

# Chiffre d'affaires total
chiffre_affaires = ventes_montant + commandes_paiements

print(f"\n" + "=" * 80)
print(f"💎 CHIFFRE D'AFFAIRES TOTAL: {chiffre_affaires:,.2f} HTG")
print(f"   • Ventes 100%: {ventes_montant:,.2f} HTG ({(ventes_montant/chiffre_affaires*100) if chiffre_affaires > 0 else 0:.1f}%)")
print(f"   • Paiements partiels: {commandes_paiements:,.2f} HTG ({(commandes_paiements/chiffre_affaires*100) if chiffre_affaires > 0 else 0:.1f}%)")
print("=" * 80)
print("✅ Test terminé")

import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.orders.models import Commande
from apps.sales.models import Vente
from django.db.models import Sum

print("💸 Test du Montant Restant Total")
print("=" * 80)

# Montant restant des ventes
ventes = Vente.objects.all()
ventes_restant = ventes.aggregate(total=Sum('montant_restant'))['total'] or 0

print(f"\n📊 VENTES:")
print(f"   Nombre de ventes: {ventes.count()}")
print(f"   Montant restant: {ventes_restant:,.2f} HTG")

# Montant restant des commandes
commandes = Commande.objects.all()
commandes_restant = commandes.aggregate(total=Sum('montant_restant'))['total'] or 0

print(f"\n📦 COMMANDES:")
print(f"   Nombre de commandes: {commandes.count()}")
print(f"   Montant restant: {commandes_restant:,.2f} HTG")

# Détails des commandes avec montant restant
commandes_avec_restant = commandes.filter(montant_restant__gt=0)
if commandes_avec_restant.exists():
    print(f"\n   Commandes avec montant restant:")
    for cmd in commandes_avec_restant:
        print(f"   • {cmd.numero_commande}")
        print(f"     - Montant total: {cmd.montant_total:,.2f} HTG")
        print(f"     - Montant payé: {cmd.montant_paye:,.2f} HTG")
        print(f"     - Montant restant: {cmd.montant_restant:,.2f} HTG")

# Total
montant_restant_total = ventes_restant + commandes_restant

print(f"\n" + "=" * 80)
print(f"💰 MONTANT RESTANT TOTAL: {montant_restant_total:,.2f} HTG")
print(f"   • Ventes: {ventes_restant:,.2f} HTG")
print(f"   • Commandes: {commandes_restant:,.2f} HTG")
print("=" * 80)
print("✅ Test terminé")

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.sales.models import Vente, Commande
from apps.clients.models import Client
from django.db.models import Sum

print("=" * 60)
print("ANALYSE CA VENTES vs CLIENTS")
print("=" * 60)

# CA Module Ventes
ventes_paye = Vente.objects.aggregate(Sum('montant_paye'))['montant_paye__sum'] or 0
cmd_non_conv_paye = Commande.objects.filter(convertie_en_vente=False).aggregate(Sum('montant_paye'))['montant_paye__sum'] or 0
ca_ventes = float(ventes_paye) + float(cmd_non_conv_paye)

print(f"\nMODULE VENTES:")
print(f"  Ventes payées: {ventes_paye:,.2f} HTG")
print(f"  Commandes non converties payées: {cmd_non_conv_paye:,.2f} HTG")
print(f"  ✅ CA VENTES = {ca_ventes:,.2f} HTG")

# CA Module Clients
toutes_cmd_paye = Commande.objects.aggregate(Sum('montant_paye'))['montant_paye__sum'] or 0

print(f"\nMODULE CLIENTS:")
print(f"  Toutes commandes payées: {toutes_cmd_paye:,.2f} HTG")
print(f"  ✅ CA CLIENTS = {toutes_cmd_paye:,.2f} HTG")

# Différence
cmd_conv_paye = Commande.objects.filter(convertie_en_vente=True).aggregate(Sum('montant_paye'))['montant_paye__sum'] or 0
difference = toutes_cmd_paye - ca_ventes

print(f"\nANALYSE:")
print(f"  Différence: {difference:,.2f} HTG")
print(f"  Commandes converties (comptées 2x): {cmd_conv_paye:,.2f} HTG")

if abs(difference - cmd_conv_paye) < 0.01:
    print(f"\n⚠️ PROBLEME: Les commandes converties sont comptées 2 fois!")
    print(f"  - Dans le module Ventes (via Vente.montant_paye)")
    print(f"  - Dans le module Clients (via Commande.montant_paye)")
else:
    print(f"\n✅ CA cohérents!")

print("=" * 60)

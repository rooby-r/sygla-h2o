import os
import sys
import django

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.sales.models import Vente

print("🔍 Vérification des ventes dans la base de données")
print("=" * 60)

ventes = Vente.objects.all()
print(f"\n📊 Total ventes: {ventes.count()}")

if ventes.exists():
    print("\n📋 Liste des ventes:")
    for vente in ventes:
        print(f"\n  • {vente.numero_vente}")
        print(f"    Client: {vente.client.nom_commercial or vente.client.raison_sociale}")
        print(f"    Montant total: {vente.montant_total} HTG")
        print(f"    Montant payé: {vente.montant_paye} HTG")
        print(f"    Statut: {vente.statut_paiement}")
        print(f"    Date: {vente.date_vente}")
        print(f"    Lignes: {vente.lignes.count()}")
else:
    print("\n⚠️  Aucune vente dans la base de données")

print("\n" + "=" * 60)
print("✅ Vérification terminée")

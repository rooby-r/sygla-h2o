import os
import sys
import django

# Configuration Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.sales.models import Vente
from apps.orders.models import Commande

print("=" * 80)
print("VÉRIFICATION VENTES ET LIVRAISONS")
print("=" * 80)

print("\n📊 DERNIÈRES VENTES:")
print("-" * 80)
ventes = Vente.objects.all().order_by('-created_at')[:5]
if not ventes:
    print("❌ Aucune vente trouvée")
else:
    for v in ventes:
        print(f"  ✓ ID: {v.id}")
        print(f"    Numéro: {v.numero_vente}")
        print(f"    Type livraison: {v.type_livraison}")
        print(f"    Statut paiement: {v.statut_paiement}")
        print(f"    Créée le: {v.created_at}")
        print()

print("\n🚚 DERNIÈRES COMMANDES (LIVRAISONS):")
print("-" * 80)
commandes = Commande.objects.all().order_by('-date_creation')[:5]
if not commandes:
    print("❌ Aucune commande trouvée")
else:
    for c in commandes:
        print(f"  ✓ ID: {c.id}")
        print(f"    Numéro: {c.numero_commande}")
        print(f"    Statut: {c.statut}")
        vente_id = c.vente_associee_id if hasattr(c, 'vente_associee') else None
        print(f"    Vente associée: {vente_id}")
        print(f"    Convertie en vente: {c.convertie_en_vente if hasattr(c, 'convertie_en_vente') else 'N/A'}")
        if c.notes:
            print(f"    Notes: {c.notes[:80]}...")
        print(f"    Créée le: {c.date_creation}")
        print()

print("\n🔍 VÉRIFICATION SPÉCIFIQUE:")
print("-" * 80)
ventes_livraison = Vente.objects.filter(type_livraison='livraison_domicile')
print(f"Ventes avec livraison à domicile: {ventes_livraison.count()}")

for v in ventes_livraison[:3]:
    commandes_associees = Commande.objects.filter(vente_associee=v)
    print(f"\n  Vente {v.numero_vente}:")
    print(f"    - Commandes associées: {commandes_associees.count()}")
    if commandes_associees.exists():
        for c in commandes_associees:
            print(f"      → Commande {c.numero_commande} (Statut: {c.statut})")
    else:
        print(f"      ⚠️ AUCUNE COMMANDE TROUVÉE POUR CETTE VENTE!")

print("\n" + "=" * 80)

import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.products.models import Produit
from apps.orders.models import ItemCommande
from apps.sales.models import LigneVente
from django.db import transaction

print("🔧 Correction du Stock - Déduction Rétroactive")
print("=" * 80)

# Pour chaque produit
produits = Produit.objects.all()

for produit in produits:
    print(f"\n📦 Produit: {produit.nom}")
    print(f"   Stock avant correction: {produit.stock_actuel}")
    
    # Calculer le total vendu
    items_commandes = ItemCommande.objects.filter(produit=produit)
    total_commandes = sum(int(item.quantite) for item in items_commandes)
    
    lignes_ventes = LigneVente.objects.filter(produit=produit)
    total_ventes = sum(int(ligne.quantite) for ligne in lignes_ventes)
    
    total_a_deduire = total_commandes + total_ventes
    
    if total_a_deduire > 0:
        print(f"   • Commandes: {total_commandes} unités")
        print(f"   • Ventes: {total_ventes} unités")
        print(f"   • Total à déduire: {total_a_deduire} unités")
        
        # Appliquer la déduction
        nouveau_stock = produit.stock_actuel - total_a_deduire
        
        if nouveau_stock >= 0:
            with transaction.atomic():
                produit.stock_actuel = nouveau_stock
                produit.save(update_fields=['stock_actuel'])
            print(f"   ✅ Stock corrigé: {nouveau_stock}")
        else:
            print(f"   ⚠️ Stock négatif détecté ({nouveau_stock}), correction à 0")
            with transaction.atomic():
                produit.stock_actuel = 0
                produit.save(update_fields=['stock_actuel'])
    else:
        print(f"   ✓ Aucune vente/commande, stock inchangé")

print("\n" + "=" * 80)
print("✅ Correction terminée - Le stock a été mis à jour")
print("🔄 Les nouvelles ventes/commandes déduiront automatiquement le stock")

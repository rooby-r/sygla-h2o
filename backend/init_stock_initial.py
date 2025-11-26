import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.products.models import Produit

print("🔧 Initialisation du Stock Initial")
print("=" * 80)

produits = Produit.objects.all()

for produit in produits:
    if produit.stock_initial == 0:
        # Définir stock_initial = stock_actuel actuel
        produit.stock_initial = produit.stock_actuel
        produit.save(update_fields=['stock_initial'])
        print(f"✅ {produit.nom}: stock_initial = {produit.stock_initial}")
    else:
        print(f"✓ {produit.nom}: stock_initial déjà défini ({produit.stock_initial})")

print("\n" + "=" * 80)
print("✅ Initialisation terminée")

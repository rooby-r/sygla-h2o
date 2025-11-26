import os
import sys
import django

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.orders.models import Commande, ItemCommande
from collections import defaultdict

print("=== TEST TOP PRODUCTS ===\n")

# Vérifier les commandes
commandes = Commande.objects.filter(statut__in=['validee', 'confirmee', 'en_preparation', 'en_livraison', 'livree'])
print(f"Total commandes valides: {commandes.count()}")

# Vérifier les items
total_items = 0
product_sales = defaultdict(lambda: {'quantity': 0, 'revenue': 0})

for order in commandes:
    items = order.items.all()
    total_items += items.count()
    print(f"\nCommande {order.numero_commande}: {items.count()} items")
    
    for item in items:
        product_name = item.produit.nom if item.produit else 'Produit inconnu'
        print(f"  - {product_name}: {item.quantite} x {item.prix_unitaire} HTG = {item.quantite * item.prix_unitaire} HTG")
        
        product_sales[product_name]['quantity'] += item.quantite or 0
        product_sales[product_name]['revenue'] += float((item.quantite or 0) * (item.prix_unitaire or 0))

print(f"\n=== TOTAL ITEMS: {total_items} ===\n")

# Top produits
if product_sales:
    print("=== TOP PRODUITS ===")
    top_products = sorted(
        [{'name': name, **stats} for name, stats in product_sales.items()],
        key=lambda x: x['revenue'],
        reverse=True
    )
    
    for idx, product in enumerate(top_products[:10], 1):
        print(f"{idx}. {product['name']}")
        print(f"   Quantité: {product['quantity']}")
        print(f"   Revenue: {product['revenue']:,.2f} HTG\n")
else:
    print("❌ Aucune vente de produits trouvée!")

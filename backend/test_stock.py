import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.products.models import Produit
from apps.orders.models import Commande, ItemCommande
from apps.sales.models import Vente, LigneVente

print("📦 Test du Système de Gestion de Stock")
print("=" * 80)

# Vérifier le stock actuel
produit = Produit.objects.first()
if produit:
    print(f"\n📊 Produit: {produit.nom}")
    print(f"   Stock actuel: {produit.stock_actuel}")
    print(f"   Code: {produit.code_produit}")
    print(f"   Prix: {produit.prix_unitaire} HTG")
    
    # Compter les items dans les commandes
    items_commandes = ItemCommande.objects.filter(produit=produit)
    total_commandes = sum(int(item.quantite) for item in items_commandes)
    
    # Compter les lignes dans les ventes
    lignes_ventes = LigneVente.objects.filter(produit=produit)
    total_ventes = sum(int(ligne.quantite) for ligne in lignes_ventes)
    
    total_vendu = total_commandes + total_ventes
    
    print(f"\n📈 Historique des ventes:")
    print(f"   • Quantité dans commandes: {total_commandes}")
    print(f"   • Quantité dans ventes: {total_ventes}")
    print(f"   • Total vendu: {total_vendu}")
    print(f"   • Stock restant: {produit.stock_actuel}")
    
    print(f"\n💡 Le stock devrait être : Stock initial - {total_vendu} = {produit.stock_actuel}")
else:
    print("\n⚠️  Aucun produit trouvé")

print("\n" + "=" * 80)
print("✅ Test terminé")
print("\n🔄 Redémarrez le serveur backend pour activer les signaux de stock!")

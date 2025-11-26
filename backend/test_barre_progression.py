import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.products.models import Produit

print("📊 Test de la Barre de Progression du Stock")
print("=" * 80)

produit = Produit.objects.first()
if produit:
    stock_initial = produit.stock_initial
    stock_actuel = produit.stock_actuel
    
    if stock_initial > 0:
        pourcentage = (stock_actuel / stock_initial) * 100
    else:
        pourcentage = 0
    
    print(f"\n📦 Produit: {produit.nom}")
    print(f"   Stock initial: {stock_initial}")
    print(f"   Stock actuel: {stock_actuel}")
    print(f"   Pourcentage: {pourcentage:.1f}%")
    
    # Déterminer la couleur
    if pourcentage < 20:
        couleur = "🔴 Rouge (critique)"
    elif pourcentage < 50:
        couleur = "🟠 Orange (faible)"
    elif pourcentage < 80:
        couleur = "🔵 Bleu (moyen)"
    else:
        couleur = "🟢 Vert (bon)"
    
    print(f"   Couleur de la barre: {couleur}")
    
    print(f"\n📉 Simulation après quelques ventes:")
    for ventes in [1, 2, 5, 10, 20]:
        nouveau_stock = stock_actuel - ventes
        if nouveau_stock >= 0:
            nouveau_pct = (nouveau_stock / stock_initial) * 100
            print(f"   • Après {ventes} ventes: {nouveau_stock}/{stock_initial} = {nouveau_pct:.1f}%")
else:
    print("\n⚠️  Aucun produit trouvé")

print("\n" + "=" * 80)
print("✅ Test terminé")

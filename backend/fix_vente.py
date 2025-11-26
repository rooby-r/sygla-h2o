import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.sales.models import Vente

print("🔧 Correction de la vente existante")
print("=" * 60)

vente = Vente.objects.first()
if vente:
    print(f"\n📝 Vente trouvée: {vente.numero_vente}")
    print(f"   Montant total: {vente.montant_total} HTG")
    print(f"   Montant payé (avant): {vente.montant_paye} HTG")
    print(f"   Statut (avant): {vente.statut_paiement}")
    
    # Marquer comme payé à 100%
    vente.montant_paye = vente.montant_total
    vente.save()
    
    print(f"\n✅ Mise à jour effectuée:")
    print(f"   Montant payé (après): {vente.montant_paye} HTG")
    print(f"   Statut (après): {vente.statut_paiement}")
    print(f"   Montant restant: {vente.montant_restant} HTG")
else:
    print("\n⚠️  Aucune vente trouvée")

print("\n" + "=" * 60)
print("✅ Correction terminée")

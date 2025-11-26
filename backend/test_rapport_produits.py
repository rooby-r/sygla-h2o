import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.reports.views import inventory_report
from rest_framework.test import APIRequestFactory

# Créer une requête de test
factory = APIRequestFactory()
request = factory.get('/api/reports/inventory/')

# Tester l'endpoint
try:
    response = inventory_report(request)
    print("✅ Rapport Produits - Statut:", response.status_code)
    if response.status_code == 200:
        data = response.data
        print("\n📦 Résumé:")
        print(f"  Total produits: {data.get('summary', {}).get('total_products', 0)}")
        print(f"  Stock faible: {data.get('summary', {}).get('low_stock_products', 0)}")
        print(f"  Rupture: {data.get('summary', {}).get('out_of_stock_products', 0)}")
        print(f"\n✅ Rapport généré avec succès!")
    else:
        print(f"❌ Erreur: {response.data}")
except Exception as e:
    print(f"❌ ERREUR: {str(e)}")
    import traceback
    traceback.print_exc()

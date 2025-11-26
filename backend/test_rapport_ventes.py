import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.reports.views import sales_report
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model

# Créer une requête de test
factory = APIRequestFactory()
request = factory.get('/api/reports/sales/')

# Tester l'endpoint
try:
    response = sales_report(request)
    print("✅ Rapport Ventes - Statut:", response.status_code)
    if response.status_code == 200:
        data = response.data
        print("\n📊 Résumé:")
        print(f"  Total Revenue: {data.get('summary', {}).get('total_revenue', 0):,.2f} HTG")
        print(f"  Total Orders: {data.get('summary', {}).get('total_orders', 0)}")
        print(f"  Average Order: {data.get('summary', {}).get('average_order_value', 0):,.2f} HTG")
        print(f"\n✅ Rapport généré avec succès!")
    else:
        print(f"❌ Erreur: {response.data}")
except Exception as e:
    print(f"❌ ERREUR: {str(e)}")
    import traceback
    traceback.print_exc()

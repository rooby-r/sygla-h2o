#!/usr/bin/env python
"""
Script pour créer des logs d'exemple dans le système
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configuration du chemin Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.logs.models import SystemLog
from apps.authentication.models import User

def create_sample_logs():
    """Créer des logs d'exemple"""
    
    print("🔧 Création des logs d'exemple...")
    print("=" * 60)
    
    # Récupérer les utilisateurs
    try:
        admin = User.objects.get(email='admin@sygla-h2o.com')
        vendeur = User.objects.get(email='vendeur@sygla-h2o.com')
        stock_user = User.objects.get(email='stock@sygla-h2o.com')
        livreur = User.objects.get(email='livreur@sygla-h2o.com')
    except User.DoesNotExist:
        print("❌ Utilisateurs non trouvés. Exécutez d'abord create_role_users.py")
        return
    
    # Effacer les logs existants
    SystemLog.objects.all().delete()
    print("🗑️  Logs existants effacés")
    
    # Créer les logs
    logs = [
        {
            'type': 'success',
            'message': 'Nouvelle commande créée #CMD-001',
            'details': 'Commande de 50 bidons d\'eau pour Client A',
            'user': admin,
            'module': 'orders',
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'request_method': 'POST',
            'endpoint': '/api/orders/',
            'status_code': 201,
            'response_time': '145ms',
            'metadata': {
                'orderId': 'CMD-001',
                'clientId': 1,
                'clientName': 'Client A',
                'totalAmount': 2500,
                'itemsCount': 50,
                'productName': 'Eau Potable 20L'
            },
            'timestamp': datetime.now() - timedelta(minutes=5)
        },
        {
            'type': 'info',
            'message': 'Connexion utilisateur réussie',
            'details': 'Connexion depuis 192.168.1.100',
            'user': vendeur,
            'module': 'authentication',
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'request_method': 'POST',
            'endpoint': '/api/auth/login/',
            'status_code': 200,
            'response_time': '89ms',
            'metadata': {
                'sessionId': 'sess_abc123',
                'role': 'vendeur',
                'lastLogin': (datetime.now() - timedelta(hours=24)).isoformat()
            },
            'timestamp': datetime.now() - timedelta(minutes=15)
        },
        {
            'type': 'warning',
            'message': 'Stock faible détecté pour Eau Potable 20L',
            'details': 'Quantité restante: 5 unités',
            'user': None,  # Log système
            'module': 'stock',
            'ip_address': 'system',
            'user_agent': 'System Alert',
            'request_method': 'SYSTEM',
            'endpoint': '/internal/stock/check',
            'status_code': 200,
            'response_time': '12ms',
            'metadata': {
                'productId': 1,
                'productName': 'Eau Potable 20L',
                'currentStock': 5,
                'minimumStock': 10,
                'alertLevel': 'warning'
            },
            'timestamp': datetime.now() - timedelta(minutes=30)
        },
        {
            'type': 'success',
            'message': 'Client modifié: Entreprise ABC',
            'details': 'Mise à jour des informations de contact',
            'user': vendeur,
            'module': 'clients',
            'ip_address': '192.168.1.105',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'request_method': 'PUT',
            'endpoint': '/api/clients/3/',
            'status_code': 200,
            'response_time': '234ms',
            'metadata': {
                'clientId': 3,
                'clientName': 'Entreprise ABC',
                'fieldsUpdated': ['telephone', 'email', 'adresse'],
                'previousPhone': '+509 1234 5678',
                'newPhone': '+509 8765 4321'
            },
            'timestamp': datetime.now() - timedelta(minutes=45)
        },
        {
            'type': 'error',
            'message': 'Échec de validation de commande #CMD-002',
            'details': 'Stock insuffisant pour le produit demandé',
            'user': admin,
            'module': 'orders',
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'request_method': 'POST',
            'endpoint': '/api/orders/2/validate/',
            'status_code': 400,
            'response_time': '98ms',
            'metadata': {
                'orderId': 'CMD-002',
                'productId': 2,
                'productName': 'Glace 10kg',
                'requestedQuantity': 100,
                'availableQuantity': 50,
                'errorCode': 'INSUFFICIENT_STOCK'
            },
            'timestamp': datetime.now() - timedelta(hours=1)
        },
        {
            'type': 'success',
            'message': 'Livraison complétée #LIV-001',
            'details': 'Livraison effectuée à Port-au-Prince',
            'user': livreur,
            'module': 'deliveries',
            'ip_address': '192.168.1.110',
            'user_agent': 'Mozilla/5.0 (Android 11; Mobile) AppleWebKit/537.36',
            'request_method': 'PATCH',
            'endpoint': '/api/deliveries/1/complete/',
            'status_code': 200,
            'response_time': '167ms',
            'metadata': {
                'deliveryId': 'LIV-001',
                'orderId': 'CMD-001',
                'deliveryAddress': '123 Rue de la Paix, Port-au-Prince',
                'deliveryTime': (datetime.now() - timedelta(minutes=90)).isoformat(),
                'signature': 'received',
                'gpsCoordinates': '18.5944, -72.3074'
            },
            'timestamp': datetime.now() - timedelta(minutes=90)
        },
        {
            'type': 'info',
            'message': 'Nouveau produit ajouté: Glace 5kg',
            'details': 'Prix: 150 HTG, Stock initial: 100',
            'user': stock_user,
            'module': 'products',
            'ip_address': '192.168.1.108',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'request_method': 'POST',
            'endpoint': '/api/products/',
            'status_code': 201,
            'response_time': '203ms',
            'metadata': {
                'productId': 10,
                'productName': 'Glace 5kg',
                'category': 'Glace',
                'price': 150,
                'initialStock': 100,
                'unit': 'kg'
            },
            'timestamp': datetime.now() - timedelta(hours=2)
        },
        {
            'type': 'success',
            'message': 'Rapport généré et exporté en PDF',
            'details': 'Rapport mensuel des ventes',
            'user': admin,
            'module': 'reports',
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'request_method': 'GET',
            'endpoint': '/api/reports/export-pdf/',
            'status_code': 200,
            'response_time': '2.3s',
            'metadata': {
                'reportType': 'monthly_sales',
                'period': 'October 2025',
                'totalOrders': 45,
                'totalRevenue': 125000,
                'fileSize': '234 KB',
                'format': 'PDF'
            },
            'timestamp': datetime.now() - timedelta(hours=2, minutes=30)
        }
    ]
    
    created_logs = []
    for log_data in logs:
        log = SystemLog.objects.create(**log_data)
        created_logs.append(log)
        print(f"✅ Log créé: [{log.get_type_display()}] {log.message}")
    
    print("=" * 60)
    print(f"\n✅ {len(created_logs)} logs créés avec succès!")
    print("\n📊 Statistiques:")
    print(f"   - Info: {len([l for l in created_logs if l.type == 'info'])}")
    print(f"   - Succès: {len([l for l in created_logs if l.type == 'success'])}")
    print(f"   - Avertissements: {len([l for l in created_logs if l.type == 'warning'])}")
    print(f"   - Erreurs: {len([l for l in created_logs if l.type == 'error'])}")

if __name__ == '__main__':
    create_sample_logs()

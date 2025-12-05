import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')

# Changer le répertoire de travail
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
""")

print('=' * 50)
print('       TABLES DE LA BASE DE DONNÉES')
print('=' * 50)
print()

for row in cursor.fetchall():
    print(f'  • {row[0]}')

print()
print('=' * 50)

# Afficher aussi la structure des tables principales
print()
print('       STRUCTURE DES TABLES PRINCIPALES')
print('=' * 50)

main_tables = [
    'authentication_user',
    'clients_client', 
    'products_produit',
    'orders_commande',
    'orders_lignecommande',
    'orders_paiementcommande',
    'deliveries_bonlivraison',
    'stock_mouvementstock',
    'sales_vente',
    'sales_lignevente',
    'sales_paiement'
]

for table in main_tables:
    try:
        cursor.execute(f"""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = '{table}'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        if columns:
            print(f'\n📋 {table.upper()}')
            print('-' * 40)
            for col in columns:
                nullable = '(NULL)' if col[2] == 'YES' else ''
                print(f'   {col[0]}: {col[1]} {nullable}')
    except Exception as e:
        pass

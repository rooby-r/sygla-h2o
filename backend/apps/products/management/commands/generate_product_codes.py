from django.core.management.base import BaseCommand
from apps.products.models import Produit
import random

class Command(BaseCommand):
    help = 'Génère des codes produits uniques pour les produits sans code_produit'

    def handle(self, *args, **options):
        products = Produit.objects.filter(code_produit__isnull=True)
        total = products.count()
        self.stdout.write(f'Found {total} products without code')
        for p in products:
            while True:
                code = f'PROD-{random.randint(10000, 99999)}'
                if not Produit.objects.filter(code_produit=code).exists():
                    p.code_produit = code
                    p.save()
                    self.stdout.write(f'Assigned {code} to product {p.id} ({p.nom})')
                    break
        self.stdout.write('Done')

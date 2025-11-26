from django.db import migrations, models
import random

def generate_codes(apps, schema_editor):
    Produit = apps.get_model('products', 'Produit')
    for p in Produit.objects.filter(code_produit__isnull=True):
        while True:
            code = f'PROD-{random.randint(10000, 99999)}'
            if not Produit.objects.filter(code_produit=code).exists():
                p.code_produit = code
                p.save()
                break

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_produit_code_produit'),
    ]

    operations = [
        migrations.RunPython(generate_codes),
        migrations.AlterField(
            model_name='produit',
            name='code_produit',
            field=models.CharField(help_text='Code unique généré automatiquement', max_length=20, unique=True),
        ),
    ]

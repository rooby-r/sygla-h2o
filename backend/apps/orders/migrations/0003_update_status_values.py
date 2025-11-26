# Generated manually to update status values
from django.db import migrations

def update_order_statuses(apps, schema_editor):
    """
    Met à jour les anciens statuts vers les nouveaux
    """
    Commande = apps.get_model('orders', 'Commande')
    
    # Mapping des anciens vers les nouveaux statuts
    status_mapping = {
        'attente': 'en_attente',
        'confirmee': 'validee',  # On fusionne confirmee avec validee
    }
    
    for old_status, new_status in status_mapping.items():
        Commande.objects.filter(statut=old_status).update(statut=new_status)

def reverse_update_order_statuses(apps, schema_editor):
    """
    Fonction de retour en arrière (optionnelle)
    """
    Commande = apps.get_model('orders', 'Commande')
    
    # Retour inverse
    status_mapping = {
        'en_attente': 'attente',
        'validee': 'confirmee',
    }
    
    for new_status, old_status in status_mapping.items():
        Commande.objects.filter(statut=new_status).update(statut=old_status)

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_alter_commande_statut'),
    ]

    operations = [
        migrations.RunPython(
            update_order_statuses,
            reverse_update_order_statuses,
        ),
    ]
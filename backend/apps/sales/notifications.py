"""
Signaux de notifications pour le module Ventes
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.authentication.models import User, Notification
from .models import Vente


def notify_users_by_role(roles, notification_type, title, message, **kwargs):
    """
    Crée des notifications pour tous les utilisateurs ayant les rôles spécifiés
    """
    users = User.objects.filter(role__in=roles, is_active=True)
    
    notifications = []
    for user in users:
        notification = Notification(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            **kwargs
        )
        notifications.append(notification)
    
    if notifications:
        Notification.objects.bulk_create(notifications)


@receiver(post_save, sender=Vente)
def handle_sale_changes(sender, instance, created, **kwargs):
    """
    Notifications lors de la création ou modification de ventes
    """
    if created:
        # Nouvelle vente créée
        client_info = f"Client: {instance.client_details.get('nom_commercial') or instance.client_details.get('raison_sociale')}" if instance.client_details else "Vente directe"
        
        notify_users_by_role(
            roles=['admin', 'vendeur'],
            notification_type='sale_created',
            title='💰 Nouvelle vente créée',
            message=f'Vente {instance.numero_vente} enregistrée avec succès. {client_info}. Montant: {instance.montant_total} HTG (100% payé)',
            related_sale_id=instance.id
        )
        print(f"📬 Notification: Nouvelle vente {instance.numero_vente}")

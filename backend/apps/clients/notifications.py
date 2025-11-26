"""
Signaux de notifications pour le module Clients
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.authentication.models import User, Notification
from .models import Client


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
        print(f"✅ {len(notifications)} notifications créées pour {notification_type}")


@receiver(post_save, sender=Client)
def handle_client_changes(sender, instance, created, **kwargs):
    """
    Notifications lors de la création ou modification de clients
    """
    if created:
        # Nouveau client créé
        notify_users_by_role(
            roles=['admin', 'vendeur'],
            notification_type='client_created',
            title='Nouveau client ajouté',
            message=f'Client {instance.nom_commercial or instance.raison_sociale} créé. Contact: {instance.contact}',
            related_client_id=instance.id
        )
        print(f"📬 Notification: Nouveau client {instance.nom_commercial}")
    else:
        # Client modifié
        notify_users_by_role(
            roles=['admin'],
            notification_type='client_updated',
            title='Client modifié',
            message=f'Les informations du client {instance.nom_commercial or instance.raison_sociale} ont été mises à jour',
            related_client_id=instance.id
        )
        print(f"📬 Notification: Client {instance.nom_commercial} modifié")

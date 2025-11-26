"""
Signaux de notifications pour le module Produits
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.authentication.models import User, Notification
from .models import Produit, MouvementStock


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


@receiver(post_save, sender=Produit)
def handle_product_changes(sender, instance, created, **kwargs):
    """
    Notifications lors de la création ou modification de produits
    """
    if created:
        # Nouveau produit créé
        notify_users_by_role(
            roles=['admin', 'stock'],
            notification_type='product_created',
            title='Nouveau produit ajouté',
            message=f'Produit {instance.nom} créé. Stock initial: {instance.stock_actuel} unités. Prix: {instance.prix_unitaire} HTG',
            related_product_id=instance.id
        )
        print(f"📬 Notification: Nouveau produit {instance.nom}")


@receiver(post_save, sender=MouvementStock)
def handle_stock_movement(sender, instance, created, **kwargs):
    """
    Notifications lors des mouvements de stock
    """
    if created:
        produit = instance.produit
        
        # Notification de mouvement de stock
        if instance.type_mouvement == 'entree':
            notify_users_by_role(
                roles=['admin', 'stock'],
                notification_type='stock_movement',
                title='Entrée de stock',
                message=f'{instance.quantite} unités de {produit.nom} ajoutées. Stock actuel: {produit.stock_actuel}',
                related_product_id=produit.id
            )
        else:
            notify_users_by_role(
                roles=['admin', 'stock'],
                notification_type='stock_movement',
                title='Sortie de stock',
                message=f'{instance.quantite} unités de {produit.nom} retirées. Stock actuel: {produit.stock_actuel}',
                related_product_id=produit.id
            )
        
        # Vérifier si le stock est faible ou en rupture
        if produit.stock_actuel == 0:
            notify_users_by_role(
                roles=['admin', 'stock', 'vendeur'],
                notification_type='stock_out',
                title='⚠️ Rupture de stock',
                message=f'Le produit {produit.nom} est en rupture de stock!',
                related_product_id=produit.id
            )
        elif produit.stock_actuel <= produit.stock_minimal:
            notify_users_by_role(
                roles=['admin', 'stock'],
                notification_type='stock_low',
                title='Stock faible',
                message=f'Le stock de {produit.nom} est faible: {produit.stock_actuel} unités (seuil: {produit.stock_minimal})',
                related_product_id=produit.id
            )

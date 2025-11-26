"""
Système de notifications pour les commandes
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from apps.authentication.models import User, Notification
from .models import Commande, PaiementCommande


def create_notification_for_roles(roles, notification_type, title, message, related_order=None):
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
            related_order_id=related_order.id if related_order else None
        )
        notifications.append(notification)
    
    if notifications:
        Notification.objects.bulk_create(notifications)
        print(f"✅ {len(notifications)} notifications créées pour {notification_type}")


@receiver(pre_save, sender=Commande)
def store_old_status(sender, instance, **kwargs):
    """
    Stocke l'ancien statut pour détecter les changements
    """
    if instance.pk:
        try:
            old_instance = Commande.objects.get(pk=instance.pk)
            instance._old_statut = old_instance.statut
        except Commande.DoesNotExist:
            instance._old_statut = None
    else:
        instance._old_statut = None


@receiver(post_save, sender=Commande)
def handle_order_status_change(sender, instance, created, **kwargs):
    """
    Gère les notifications lors des changements d'état de commande
    """
    print(f"\n🔔 Signal déclenché pour commande {instance.numero_commande}")
    print(f"   Created: {created}, Statut: {instance.statut}")
    
    if created:
        # Nouvelle commande créée
        print(f"   ➡️ Création de notifications pour 'order_created'")
        create_notification_for_roles(
            roles=['admin', 'stock'],
            notification_type='order_created',
            title='📦 Nouvelle commande créée',
            message=f'Commande {instance.numero_commande} créée par {instance.vendeur.username if instance.vendeur else "Système"}. Client: {instance.client.nom_commercial or instance.client.raison_sociale}. En attente de validation.',
            related_order=instance
        )
    else:
        # Vérifier si le statut a changé
        old_status = getattr(instance, '_old_statut', None)
        print(f"   Old status: {old_status}, New status: {instance.statut}")
        
        if old_status and old_status != instance.statut:
            print(f"   ✅ Changement de statut détecté: {old_status} → {instance.statut}")
            # Le statut a changé
            
            if instance.statut == 'validee':
                # Commande validée → Notifier stock et livreurs
                create_notification_for_roles(
                    roles=['stock', 'livreur'],
                    notification_type='order_validated',
                    title='Commande validée',
                    message=f'Commande {instance.numero_commande} validée. Client: {instance.client.nom_commercial or instance.client.raison_sociale}. Montant: {instance.montant_total} HTG',
                    related_order=instance
                )
            
            elif instance.statut == 'en_preparation':
                # En préparation → Notifier livreurs et admin
                create_notification_for_roles(
                    roles=['livreur', 'admin'],
                    notification_type='order_in_preparation',
                    title='Commande en préparation',
                    message=f'Commande {instance.numero_commande} en cours de préparation. Type: {instance.get_type_livraison_display()}',
                    related_order=instance
                )
            
            elif instance.statut == 'en_livraison':
                # En livraison → Notifier admin et vendeur
                create_notification_for_roles(
                    roles=['admin', 'vendeur'],
                    notification_type='order_in_delivery',
                    title='Commande en livraison',
                    message=f'Commande {instance.numero_commande} en cours de livraison par {instance.livreur or "un livreur"}. Client: {instance.client.nom_commercial or instance.client.raison_sociale}',
                    related_order=instance
                )
            
            elif instance.statut == 'livree':
                # Livrée → Notifier tous sauf livreurs
                create_notification_for_roles(
                    roles=['admin', 'vendeur', 'stock'],
                    notification_type='order_delivered',
                    title='Commande livrée',
                    message=f'Commande {instance.numero_commande} livrée avec succès. Client: {instance.client.nom_commercial or instance.client.raison_sociale}',
                    related_order=instance
                )
            
            elif instance.statut == 'annulee':
                # Annulée → Notifier tous
                create_notification_for_roles(
                    roles=['admin', 'vendeur', 'stock', 'livreur'],
                    notification_type='order_cancelled',
                    title='Commande annulée',
                    message=f'Commande {instance.numero_commande} annulée. Client: {instance.client.nom_commercial or instance.client.raison_sociale}',
                    related_order=instance
                )


@receiver(post_save, sender=PaiementCommande)
def handle_payment_received(sender, instance, created, **kwargs):
    """
    Notification lors de la réception d'un paiement
    """
    if created:
        commande = instance.commande
        
        # Notifier admin et vendeurs
        create_notification_for_roles(
            roles=['admin', 'vendeur'],
            notification_type='payment_received',
            title='Paiement reçu',
            message=f'Paiement de {instance.montant} HTG reçu pour la commande {commande.numero_commande}. Méthode: {instance.get_methode_display()}. Reste à payer: {commande.montant_restant} HTG',
            related_order=commande
        )

"""
Service de notifications pour SYGLA-H2O
Gère la création automatique des notifications système
"""

from django.db import transaction
from apps.authentication.models import User, Notification, NotificationPreferences
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service centralisé pour la gestion des notifications"""
    
    @staticmethod
    def get_users_to_notify(notification_type, exclude_user=None):
        """
        Retourne la liste des utilisateurs à notifier selon le type de notification
        et leurs préférences
        """
        # Mapping entre types de notification et préférences
        preference_mapping = {
            'client_created': 'notify_client_created',
            'client_updated': 'notify_client_created',
            'order_created': 'notify_order_created',
            'order_validated': 'notify_order_validated',
            'order_updated': 'notify_order_created',
            'order_cancelled': 'notify_order_created',
            'delivery_assigned': 'notify_delivery_assigned',
            'delivery_completed': 'notify_delivery_completed',
            'stock_low': 'notify_stock_low',
            'stock_out': 'notify_stock_low',
            'stock_movement': 'notify_stock_updated',
            'product_created': 'notify_stock_updated',
            'product_updated': 'notify_stock_updated',
            'sale_created': 'notify_order_created',
            'sale_completed': 'notify_order_created',
            'payment_received': 'notify_order_created',
        }
        
        # Rôles concernés par type de notification
        role_mapping = {
            'client_created': ['admin', 'vendeur'],
            'client_updated': ['admin', 'vendeur'],
            'order_created': ['admin', 'vendeur', 'stock'],
            'order_validated': ['admin', 'vendeur', 'stock', 'livreur'],
            'order_updated': ['admin', 'vendeur'],
            'order_cancelled': ['admin', 'vendeur'],
            'delivery_assigned': ['admin', 'livreur'],
            'delivery_completed': ['admin', 'vendeur', 'livreur'],
            'stock_low': ['admin', 'stock'],
            'stock_out': ['admin', 'stock'],
            'stock_movement': ['admin', 'stock'],
            'product_created': ['admin', 'stock'],
            'product_updated': ['admin', 'stock'],
            'sale_created': ['admin', 'vendeur'],
            'sale_completed': ['admin', 'vendeur'],
            'payment_received': ['admin', 'vendeur'],
        }
        
        preference_field = preference_mapping.get(notification_type)
        allowed_roles = role_mapping.get(notification_type, ['admin'])
        
        # Récupérer les utilisateurs actifs avec les rôles appropriés
        users = User.objects.filter(
            is_active=True,
            role__in=allowed_roles
        )
        
        if exclude_user:
            users = users.exclude(id=exclude_user.id)
        
        # Filtrer par préférences si un champ de préférence existe
        users_to_notify = []
        for user in users:
            try:
                prefs = NotificationPreferences.get_or_create_for_user(user)
                # Vérifier si les notifications navigateur sont activées
                if prefs.enable_browser_notifications:
                    # Vérifier la préférence spécifique si elle existe
                    if preference_field:
                        if getattr(prefs, preference_field, True):
                            users_to_notify.append(user)
                    else:
                        users_to_notify.append(user)
            except Exception as e:
                logger.error(f"Erreur préférences pour {user.email}: {e}")
                # En cas d'erreur, inclure l'utilisateur par défaut
                users_to_notify.append(user)
        
        return users_to_notify
    
    @staticmethod
    def create_notification(
        user,
        notification_type,
        title,
        message,
        related_order_id=None,
        related_product_id=None,
        related_client_id=None,
        related_sale_id=None
    ):
        """Crée une notification pour un utilisateur spécifique"""
        try:
            notification = Notification.objects.create(
                user=user,
                type=notification_type,
                title=title,
                message=message,
                related_order_id=related_order_id,
                related_product_id=related_product_id,
                related_client_id=related_client_id,
                related_sale_id=related_sale_id
            )
            logger.info(f"🔔 Notification créée pour {user.email}: {title}")
            return notification
        except Exception as e:
            logger.error(f"❌ Erreur création notification: {e}")
            return None
    
    @classmethod
    def notify_all(
        cls,
        notification_type,
        title,
        message,
        exclude_user=None,
        related_order_id=None,
        related_product_id=None,
        related_client_id=None,
        related_sale_id=None
    ):
        """Envoie une notification à tous les utilisateurs concernés"""
        users = cls.get_users_to_notify(notification_type, exclude_user)
        notifications = []
        
        with transaction.atomic():
            for user in users:
                notif = cls.create_notification(
                    user=user,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    related_order_id=related_order_id,
                    related_product_id=related_product_id,
                    related_client_id=related_client_id,
                    related_sale_id=related_sale_id
                )
                if notif:
                    notifications.append(notif)
        
        logger.info(f"📬 {len(notifications)} notification(s) envoyée(s) pour: {title}")
        return notifications
    
    # ============== NOTIFICATIONS CLIENTS ==============
    
    @classmethod
    def notify_client_created(cls, client, created_by=None):
        """Notification: nouveau client créé"""
        cls.notify_all(
            notification_type='client_created',
            title='Nouveau client',
            message=f"Le client '{client.nom_commercial or client.raison_sociale}' a été créé.",
            exclude_user=created_by,
            related_client_id=client.id
        )
    
    @classmethod
    def notify_client_updated(cls, client, updated_by=None):
        """Notification: client modifié"""
        cls.notify_all(
            notification_type='client_updated',
            title='Client modifié',
            message=f"Le client '{client.nom_commercial or client.raison_sociale}' a été mis à jour.",
            exclude_user=updated_by,
            related_client_id=client.id
        )
    
    # ============== NOTIFICATIONS COMMANDES ==============
    
    @classmethod
    def notify_order_created(cls, order, created_by=None):
        """Notification: nouvelle commande créée"""
        cls.notify_all(
            notification_type='order_created',
            title='Nouvelle commande',
            message=f"Commande #{order.numero_commande} créée pour {order.client.nom_commercial or order.client.raison_sociale}.",
            exclude_user=created_by,
            related_order_id=order.id,
            related_client_id=order.client_id
        )
    
    @classmethod
    def notify_order_validated(cls, order, validated_by=None):
        """Notification: commande validée"""
        cls.notify_all(
            notification_type='order_validated',
            title='Commande validée',
            message=f"Commande #{order.numero_commande} a été validée et est prête.",
            exclude_user=validated_by,
            related_order_id=order.id
        )
    
    @classmethod
    def notify_order_cancelled(cls, order, cancelled_by=None):
        """Notification: commande annulée"""
        cls.notify_all(
            notification_type='order_cancelled',
            title='Commande annulée',
            message=f"Commande #{order.numero_commande} a été annulée.",
            exclude_user=cancelled_by,
            related_order_id=order.id
        )
    
    # ============== NOTIFICATIONS LIVRAISONS ==============
    
    @classmethod
    def notify_delivery_assigned(cls, delivery, assigned_by=None):
        """Notification: livraison assignée"""
        # Notifier spécifiquement le livreur assigné
        if delivery.livreur:
            cls.create_notification(
                user=delivery.livreur,
                notification_type='delivery_assigned',
                title='Nouvelle livraison assignée',
                message=f"Une livraison vous a été assignée: {delivery.adresse_livraison}.",
                related_order_id=delivery.commande_id if hasattr(delivery, 'commande_id') else None
            )
        
        # Notifier les admins
        cls.notify_all(
            notification_type='delivery_assigned',
            title='Livraison assignée',
            message=f"Livraison assignée à {delivery.livreur.get_full_name() if delivery.livreur else 'N/A'}.",
            exclude_user=assigned_by
        )
    
    @classmethod
    def notify_delivery_completed(cls, delivery, completed_by=None):
        """Notification: livraison terminée"""
        cls.notify_all(
            notification_type='delivery_completed',
            title='Livraison terminée',
            message=f"Livraison terminée par {completed_by.get_full_name() if completed_by else 'N/A'}.",
            exclude_user=completed_by
        )
    
    # ============== NOTIFICATIONS STOCK ==============
    
    @classmethod
    def notify_stock_low(cls, product):
        """Notification: stock faible"""
        cls.notify_all(
            notification_type='stock_low',
            title='⚠️ Stock faible',
            message=f"Le produit '{product.nom}' a un stock faible ({product.stock_actuel} restants, seuil: {product.stock_minimal}).",
            related_product_id=product.id
        )
    
    @classmethod
    def notify_stock_out(cls, product):
        """Notification: rupture de stock"""
        cls.notify_all(
            notification_type='stock_out',
            title='🚨 Rupture de stock',
            message=f"Le produit '{product.nom}' est en rupture de stock!",
            related_product_id=product.id
        )
    
    @classmethod
    def notify_product_created(cls, product, created_by=None):
        """Notification: nouveau produit créé"""
        cls.notify_all(
            notification_type='product_created',
            title='Nouveau produit',
            message=f"Le produit '{product.nom}' a été ajouté au catalogue.",
            exclude_user=created_by,
            related_product_id=product.id
        )
    
    @classmethod
    def notify_stock_movement(cls, product, movement_type, quantity, user=None):
        """Notification: mouvement de stock"""
        action = "entrée" if movement_type == 'entree' else "sortie"
        cls.notify_all(
            notification_type='stock_movement',
            title='Mouvement de stock',
            message=f"{action.capitalize()} de {quantity} unités pour '{product.nom}'. Stock actuel: {product.stock_actuel}.",
            exclude_user=user,
            related_product_id=product.id
        )
    
    # ============== NOTIFICATIONS VENTES ==============
    
    @classmethod
    def notify_sale_created(cls, sale, created_by=None):
        """Notification: nouvelle vente créée"""
        cls.notify_all(
            notification_type='sale_created',
            title='Nouvelle vente',
            message=f"Vente #{sale.numero_vente} de {sale.montant_total:.2f} HTG enregistrée.",
            exclude_user=created_by,
            related_sale_id=sale.id
        )
    
    @classmethod
    def notify_payment_received(cls, order_or_sale, amount, received_by=None):
        """Notification: paiement reçu"""
        cls.notify_all(
            notification_type='payment_received',
            title='Paiement reçu',
            message=f"Paiement de {amount:.2f} HTG reçu.",
            exclude_user=received_by
        )


# Fonction utilitaire pour vérifier et notifier le stock faible
def check_and_notify_low_stock(product):
    """Vérifie le stock d'un produit et envoie une notification si nécessaire"""
    if product.stock_actuel <= 0:
        NotificationService.notify_stock_out(product)
    elif product.stock_actuel <= product.stock_minimal:
        NotificationService.notify_stock_low(product)

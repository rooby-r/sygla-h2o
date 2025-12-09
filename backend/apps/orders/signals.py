from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import ItemCommande
from apps.products.models import Produit, MouvementStock
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ItemCommande)
def deduire_stock_commande(sender, instance, created, **kwargs):
    """
    Déduit automatiquement le stock lors de la création d'un item de commande
    """
    if created:
        try:
            with transaction.atomic():
                produit = Produit.objects.select_for_update().get(id=instance.produit_id)
                quantite_deduite = int(instance.quantite)
                stock_avant = produit.stock_actuel
                
                # Vérifier si le stock est suffisant
                if produit.stock_actuel >= quantite_deduite:
                    produit.stock_actuel -= quantite_deduite
                    produit.save(update_fields=['stock_actuel'])
                    
                    # Récupérer l'utilisateur depuis la commande
                    utilisateur = None
                    if hasattr(instance, 'commande') and instance.commande:
                        utilisateur = instance.commande.createur or instance.commande.vendeur
                    
                    # Créer un mouvement de stock
                    MouvementStock.objects.create(
                        produit=produit,
                        type_mouvement='sortie',
                        quantite=quantite_deduite,
                        stock_avant=stock_avant,
                        stock_apres=produit.stock_actuel,
                        motif=f"Commande {instance.commande.numero_commande}",
                        numero_document=instance.commande.numero_commande,
                        utilisateur=utilisateur
                    )
                    
                    logger.info(f"✅ Stock déduit: {produit.nom} - {quantite_deduite} unités (Nouveau stock: {produit.stock_actuel})")
                else:
                    logger.warning(f"⚠️ Stock insuffisant pour {produit.nom}: demandé {quantite_deduite}, disponible {produit.stock_actuel}")
        except Produit.DoesNotExist:
            logger.error(f"❌ Produit {instance.produit_id} introuvable")
        except Exception as e:
            logger.error(f"❌ Erreur lors de la déduction du stock: {str(e)}")


@receiver(post_delete, sender=ItemCommande)
def restaurer_stock_commande(sender, instance, **kwargs):
    """
    Restaure le stock lors de la suppression d'un item de commande
    """
    try:
        with transaction.atomic():
            produit = Produit.objects.select_for_update().get(id=instance.produit_id)
            quantite_restauree = int(instance.quantite)
            stock_avant = produit.stock_actuel
            produit.stock_actuel += quantite_restauree
            produit.save(update_fields=['stock_actuel'])
            
            # Créer un mouvement de stock
            MouvementStock.objects.create(
                produit=produit,
                type_mouvement='entree',
                quantite=quantite_restauree,
                stock_avant=stock_avant,
                stock_apres=produit.stock_actuel,
                motif=f"Annulation commande {instance.commande.numero_commande if hasattr(instance, 'commande') and instance.commande else 'N/A'}",
                numero_document=instance.commande.numero_commande if hasattr(instance, 'commande') and instance.commande else ''
            )
            
            logger.info(f"♻️ Stock restauré: {produit.nom} + {quantite_restauree} unités (Nouveau stock: {produit.stock_actuel})")
    except Produit.DoesNotExist:
        logger.error(f"❌ Produit {instance.produit_id} introuvable")
    except Exception as e:
        logger.error(f"❌ Erreur lors de la restauration du stock: {str(e)}")

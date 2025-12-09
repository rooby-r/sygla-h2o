from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import LigneVente
from apps.products.models import Produit, MouvementStock
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=LigneVente)
def deduire_stock_vente(sender, instance, created, **kwargs):
    """
    Déduit automatiquement le stock lors de la création d'une ligne de vente
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
                    
                    # Récupérer l'utilisateur depuis la vente
                    utilisateur = None
                    numero_vente = 'N/A'
                    if hasattr(instance, 'vente') and instance.vente:
                        numero_vente = instance.vente.numero_vente
                        utilisateur = instance.vente.vendeur
                    
                    # Créer un mouvement de stock
                    MouvementStock.objects.create(
                        produit=produit,
                        type_mouvement='sortie',
                        quantite=quantite_deduite,
                        stock_avant=stock_avant,
                        stock_apres=produit.stock_actuel,
                        motif=f"Vente {numero_vente}",
                        numero_document=numero_vente,
                        utilisateur=utilisateur
                    )
                    
                    logger.info(f"✅ Stock déduit (vente): {produit.nom} - {quantite_deduite} unités (Nouveau stock: {produit.stock_actuel})")
                else:
                    logger.warning(f"⚠️ Stock insuffisant pour {produit.nom}: demandé {quantite_deduite}, disponible {produit.stock_actuel}")
        except Produit.DoesNotExist:
            logger.error(f"❌ Produit {instance.produit_id} introuvable")
        except Exception as e:
            logger.error(f"❌ Erreur lors de la déduction du stock: {str(e)}")


@receiver(post_delete, sender=LigneVente)
def restaurer_stock_vente(sender, instance, **kwargs):
    """
    Restaure le stock lors de la suppression d'une ligne de vente
    """
    try:
        with transaction.atomic():
            produit = Produit.objects.select_for_update().get(id=instance.produit_id)
            quantite_restauree = int(instance.quantite)
            stock_avant = produit.stock_actuel
            produit.stock_actuel += quantite_restauree
            produit.save(update_fields=['stock_actuel'])
            
            # Créer un mouvement de stock
            numero_vente = instance.vente.numero_vente if hasattr(instance, 'vente') and instance.vente else 'N/A'
            MouvementStock.objects.create(
                produit=produit,
                type_mouvement='entree',
                quantite=quantite_restauree,
                stock_avant=stock_avant,
                stock_apres=produit.stock_actuel,
                motif=f"Annulation vente {numero_vente}",
                numero_document=numero_vente
            )
            
            logger.info(f"♻️ Stock restauré (vente): {produit.nom} + {quantite_restauree} unités (Nouveau stock: {produit.stock_actuel})")
    except Produit.DoesNotExist:
        logger.error(f"❌ Produit {instance.produit_id} introuvable")
    except Exception as e:
        logger.error(f"❌ Erreur lors de la restauration du stock: {str(e)}")

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from apps.orders.models import Commande
from apps.orders.serializers import CommandeSerializer
from apps.logs.utils import create_log, LogTimer


class DeliveryListView(generics.ListAPIView):
    """
    Vue pour lister les livraisons (toutes les commandes liées aux livraisons)
    """
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Retourner toutes les commandes qui ont un rapport avec les livraisons
        # - Commandes validées ou en préparation (planifiées)
        # - Commandes en livraison (en cours)
        # - Commandes livrées (terminées)
        return Commande.objects.filter(
            statut__in=['validee', 'en_preparation', 'en_livraison', 'livree']
        ).select_related('client', 'vendeur').prefetch_related('items__produit').order_by('-date_creation')


class DeliveryDetailView(generics.RetrieveAPIView):
    """
    Vue pour récupérer les détails d'une livraison
    """
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Commande.objects.filter(
            statut__in=['validee', 'en_preparation', 'en_livraison', 'livree']
        ).select_related('client', 'vendeur').prefetch_related('items__produit')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_as_delivered(request, pk):
    """
    Marquer une commande comme livrée
    """
    with LogTimer() as timer:
        try:
            commande = get_object_or_404(Commande, pk=pk, statut='en_livraison')
            
            # Marquer comme livrée
            commande.statut = 'livree'
            from django.utils import timezone
            commande.date_livraison_effective = timezone.now()
            commande.save()
            
            serializer = CommandeSerializer(commande)
            response = Response({
                'message': 'Livraison marquée comme terminée',
                'commande': serializer.data
            }, status=status.HTTP_200_OK)
            
            # Créer un log pour la livraison terminée
            create_log(
                log_type='success',
                message=f"Livraison terminée: {commande.numero_commande}",
                details=f"Commande {commande.numero_commande} livrée à {commande.client.nom}",
                user=request.user,
                module='deliveries',
                request=request,
                metadata={
                    'orderId': commande.id,
                    'orderNumber': commande.numero_commande,
                    'clientName': commande.client.nom,
                    'deliveryAddress': commande.adresse_livraison or 'N/A',
                    'deliveredBy': commande.livreur or request.user.get_full_name()
                },
                status_code=200,
                response_time=timer.elapsed
            )
            
            return response
            
        except Exception as e:
            response = Response(
                {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            # Log de l'erreur
            create_log(
                log_type='error',
                message="Erreur lors de la finalisation d'une livraison",
                details=str(e),
                user=request.user,
                module='deliveries',
                request=request,
                status_code=500,
                response_time=timer.elapsed
            )
            
            return response


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_delivery_status(request, pk):
    """
    Mettre à jour le statut d'une commande/livraison
    """
    with LogTimer() as timer:
        try:
            commande = get_object_or_404(Commande, pk=pk)
            new_status = request.data.get('statut')
            
            if not new_status:
                return Response(
                    {'error': 'Le champ statut est requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider le nouveau statut
            valid_statuses = ['validee', 'en_preparation', 'en_livraison', 'livree', 'annulee']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Statut invalide. Statuts autorisés: {valid_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mettre à jour le statut
            old_status = commande.statut
            commande.statut = new_status
            
            # Mettre à jour les dates et le livreur selon le statut
            from django.utils import timezone
            if new_status == 'en_livraison' and old_status != 'en_livraison':
                # Commencer la livraison - assigner automatiquement le livreur connecté
                if request.user.role == 'livreur':
                    # Si l'utilisateur connecté est un livreur, l'assigner automatiquement
                    commande.livreur = request.user.get_full_name() or request.user.username
                    print(f"🚚 Livreur assigné automatiquement: {commande.livreur}")
                elif hasattr(commande, 'livreur') and not commande.livreur:
                    # Si pas de livreur assigné et l'utilisateur n'est pas livreur, garder vide
                    commande.livreur = "Non assigné"
            elif new_status == 'livree' and old_status != 'livree':
                # Terminer la livraison
                commande.date_livraison_effective = timezone.now()
            
            commande.save()
            
            serializer = CommandeSerializer(commande)
            response = Response({
                'message': f'Statut mis à jour de "{old_status}" vers "{new_status}"',
                'commande': serializer.data
            }, status=status.HTTP_200_OK)
            
            # Créer un log pour le changement de statut
            log_types = {
                'en_livraison': 'info',
                'livree': 'success',
                'annulee': 'warning'
            }
            log_type = log_types.get(new_status, 'info')
            
            create_log(
                log_type=log_type,
                message=f"Statut de livraison modifié: {commande.numero_commande}",
                details=f"Statut changé de '{old_status}' vers '{new_status}'",
                user=request.user,
                module='deliveries',
                request=request,
                metadata={
                    'orderId': commande.id,
                    'orderNumber': commande.numero_commande,
                    'previousStatus': old_status,
                    'newStatus': new_status,
                    'clientName': commande.client.nom,
                    'deliveryType': commande.type_livraison
                },
                status_code=200,
                response_time=timer.elapsed
            )
            
            return response
            
        except Exception as e:
            response = Response(
                {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            # Log de l'erreur
            create_log(
                log_type='error',
                message="Erreur lors du changement de statut de livraison",
                details=str(e),
                user=request.user,
                module='deliveries',
                request=request,
                status_code=500,
                response_time=timer.elapsed
            )
            
            return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def delivery_stats(request):
    """
    Statistiques des livraisons
    """
    try:
        from django.db.models import Count, Q
        from django.utils import timezone
        from datetime import datetime, timedelta
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Date actuelle
        today = timezone.now().date()
        logger.info(f"📅 Date actuelle: {today}")
        
        # Compter toutes les commandes pour debug
        total_commandes = Commande.objects.count()
        logger.info(f"📊 Total commandes dans la DB: {total_commandes}")
        
        # Compter les livraisons par statut
        stats = Commande.objects.filter(
            statut__in=['en_livraison', 'livree']
        ).values('statut').annotate(count=Count('id'))
        
        # Transformer en format plus lisible
        result = {
            'total': 0,
            'en_cours': 0,
            'livrees': 0,
            'planifiees': 0  # Commandes à domicile planifiées pour les jours suivants
        }
        
        for stat in stats:
            if stat['statut'] == 'en_livraison':
                result['en_cours'] = stat['count']
            elif stat['statut'] == 'livree':
                result['livrees'] = stat['count']
        
        # Debug: Afficher toutes les commandes pour diagnostic
        all_commandes = Commande.objects.all()
        logger.info(f"🔍 Debug - Toutes les commandes ({all_commandes.count()}):")
        for cmd in all_commandes:
            logger.info(f"   • {cmd.numero_commande} - Statut: {cmd.statut} - Type: {cmd.type_livraison} - Date livraison: {cmd.date_livraison_prevue}")
        
        # Calculer les livraisons à domicile planifiées pour les jours suivants
        # (commandes validées ou en préparation avec type_livraison = 'livraison_domicile' 
        # et date_livraison_prevue > aujourd'hui)
        planifiees_query = Commande.objects.filter(
            Q(statut__in=['validee', 'en_preparation']) &
            Q(type_livraison='livraison_domicile')
        )
        
        logger.info(f"🚚 Commandes à domicile validées/en préparation: {planifiees_query.count()}")
        
        # Filtrer par date de livraison prévue dans le futur
        planifiees_futures = 0
        for commande in planifiees_query:
            logger.info(f"   • Vérification {commande.numero_commande}:")
            logger.info(f"     - Date livraison prévue: {commande.date_livraison_prevue}")
            logger.info(f"     - Date création: {commande.date_creation}")
            
            # Si date_livraison_prevue existe et est dans le futur
            if commande.date_livraison_prevue:
                date_livraison = commande.date_livraison_prevue.date()
                logger.info(f"     - Date livraison (date): {date_livraison}")
                logger.info(f"     - Aujourd'hui: {today}")
                logger.info(f"     - Est future: {date_livraison > today}")
                if date_livraison > today:
                    planifiees_futures += 1
                    logger.info(f"     ✅ Ajoutée aux planifiées")
                else:
                    logger.info(f"     ❌ Date passée, non ajoutée")
            # Sinon, si la commande a été créée récemment (dans les 7 derniers jours)
            # on la considère comme planifiée
            elif commande.date_creation.date() >= (today - timedelta(days=7)):
                planifiees_futures += 1
                logger.info(f"     ✅ Ajoutée aux planifiées (création récente)")
            else:
                logger.info(f"     ❌ Pas de date de livraison et création ancienne")
        
        result['planifiees'] = planifiees_futures
        result['total'] = result['en_cours'] + result['livrees']
        
        logger.info(f"📈 Résultat final: {result}")
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        logger.error(f"❌ Erreur lors du calcul des statistiques: {str(e)}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return Response(
            {'error': f'Erreur lors du calcul des statistiques: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
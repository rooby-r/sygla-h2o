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
            valid_statuses = ['validee', 'en_preparation', 'en_livraison', 'livree']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Statut invalide. Statuts autorisés: {valid_statuses}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Empêcher l'annulation des commandes validées ou en préparation
            if new_status == 'annulee' and old_status in ['validee', 'en_preparation', 'en_livraison']:
                return Response(
                    {'error': 'Impossible d\'annuler une commande déjà validée ou en préparation'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Le gestionnaire de stock ne peut pas marquer comme livrée
            if new_status == 'livree' and request.user.role == 'stock':
                return Response(
                    {'error': 'Seul un livreur ou un administrateur peut marquer une commande comme livrée'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Mettre à jour le statut
            old_status = commande.statut
            commande.statut = new_status
            
            # Mettre à jour les dates et le livreur selon le statut
            from django.utils import timezone
            if new_status == 'en_livraison' and old_status != 'en_livraison':
                # Commencer la livraison - assigner automatiquement l'utilisateur connecté comme livreur
                if not commande.livreur:
                    commande.livreur = request.user.get_full_name() or request.user.username
                    print(f"🚚 Livreur assigné automatiquement: {commande.livreur}")
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
            'livrees': 0
        }
        
        for stat in stats:
            if stat['statut'] == 'en_livraison':
                result['en_cours'] = stat['count']
            elif stat['statut'] == 'livree':
                result['livrees'] = stat['count']
        
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
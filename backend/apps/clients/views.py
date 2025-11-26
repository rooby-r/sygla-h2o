from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Client
from .serializers import ClientSerializer, ClientListSerializer, ClientDetailSerializer
from apps.logs.utils import create_log, LogTimer


class ClientListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des clients
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['nom_commercial', 'raison_sociale', 'telephone', 'contact']
    ordering_fields = ['nom_commercial', 'date_creation', 'credit_limite']
    ordering = ['nom_commercial']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClientListSerializer
        return ClientSerializer

    def get_queryset(self):
        # Précharger les commandes pour éviter les requêtes N+1
        queryset = Client.objects.prefetch_related('commandes').all()
        
        # Filtrage par statut actif/inactif
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset

    def create(self, request, *args, **kwargs):
        # Vérifier les permissions
        if not request.user.can_manage_orders():
            return Response({
                'error': 'Permission refusée. Seuls les admins et vendeurs peuvent créer des clients.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Mesurer le temps de réponse
        with LogTimer() as timer:
            response = super().create(request, *args, **kwargs)
        
        # Logger la création si succès
        if response.status_code == 201:
            client_data = response.data
            create_log(
                log_type='success',
                message=f"Nouveau client créé: {client_data.get('nom_commercial')}",
                details=f"Client {client_data.get('nom_commercial')} ajouté avec succès",
                user=request.user,
                module='clients',
                request=request,
                status_code=201,
                response_time=timer.elapsed,
                metadata={
                    'clientId': client_data.get('id'),
                    'clientName': client_data.get('nom_commercial'),
                    'telephone': client_data.get('telephone'),
                    'email': client_data.get('email')
                }
            )
        
        return response


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour consulter, modifier et supprimer un client
    """
    queryset = Client.objects.all()
    serializer_class = ClientDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClientDetailSerializer
        return ClientSerializer

    def update(self, request, *args, **kwargs):
        # Vérifier les permissions
        if not request.user.can_manage_orders():
            return Response({
                'error': 'Permission refusée. Seuls les admins et vendeurs peuvent modifier des clients.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Récupérer l'ancien état
        instance = self.get_object()
        old_name = instance.nom_commercial
        
        # Mesurer le temps de réponse
        with LogTimer() as timer:
            response = super().update(request, *args, **kwargs)
        
        # Logger la modification si succès
        if response.status_code == 200:
            client_data = response.data
            create_log(
                log_type='success',
                message=f"Client modifié: {client_data.get('nom_commercial')}",
                details=f"Mise à jour des informations du client {old_name}",
                user=request.user,
                module='clients',
                request=request,
                status_code=200,
                response_time=timer.elapsed,
                metadata={
                    'clientId': client_data.get('id'),
                    'clientName': client_data.get('nom_commercial'),
                    'previousName': old_name
                }
            )
        
        return response

    def destroy(self, request, *args, **kwargs):
        # Vérifier les permissions
        if request.user.role != 'admin':
            return Response({
                'error': 'Permission refusée. Seuls les admins peuvent supprimer des clients.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Récupérer les infos avant suppression
        instance = self.get_object()
        client_name = instance.nom_commercial
        client_id = instance.id
        
        # Mesurer le temps de réponse
        with LogTimer() as timer:
            response = super().destroy(request, *args, **kwargs)
        
        # Logger la suppression si succès
        if response.status_code == 204:
            create_log(
                log_type='warning',
                message=f"Client supprimé: {client_name}",
                details=f"Le client {client_name} a été supprimé du système",
                user=request.user,
                module='clients',
                request=request,
                status_code=204,
                response_time=timer.elapsed,
                metadata={
                    'clientId': client_id,
                    'clientName': client_name
                }
            )
        
        return response
        
        client = self.get_object()
        
        # Compter les commandes qui vont être supprimées
        commandes_count = client.commandes.count()
        if commandes_count > 0:
            # Calculer le montant total qui va être déduit du chiffre d'affaires
            montant_total = sum(float(cmd.montant_total) for cmd in client.commandes.all())
            
            # Log de la suppression pour traçabilité
            print(f"🗑️ Suppression du client '{client.raison_sociale}' avec {commandes_count} commandes")
            print(f"💰 Montant total déduit du chiffre d'affaires: {montant_total:,.2f} HTG")
            
            # Supprimer d'abord les commandes (suppression en cascade)
            client.commandes.all().delete()
        
        # Puis supprimer le client
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_client_status(request, pk):
    """
    Vue pour activer/désactiver un client
    """
    if not request.user.can_manage_orders():
        return Response({
            'error': 'Permission refusée'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        client = Client.objects.get(pk=pk)
        client.is_active = not client.is_active
        client.save()
        
        return Response({
            'message': f'Client {"activé" if client.is_active else "désactivé"} avec succès',
            'is_active': client.is_active
        })
    except Client.DoesNotExist:
        return Response({
            'error': 'Client non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_stats(request):
    """
    Vue pour obtenir des statistiques sur les clients
    """
    if not request.user.can_view_reports():
        return Response({
            'error': 'Permission refusée'
        }, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count, Sum, Avg
    
    stats = {
        'total_clients': Client.objects.count(),
        'clients_actifs': Client.objects.filter(is_active=True).count(),
        'clients_inactifs': Client.objects.filter(is_active=False).count(),
        'credit_total_limite': Client.objects.aggregate(
            total=Sum('credit_limite')
        )['total'] or 0,
        'credit_total_utilise': Client.objects.aggregate(
            total=Sum('credit_utilise')
        )['total'] or 0,
        'credit_moyen_limite': Client.objects.aggregate(
            moyenne=Avg('credit_limite')
        )['moyenne'] or 0,
    }
    
    # Ajouter le crédit disponible total
    stats['credit_total_disponible'] = stats['credit_total_limite'] - stats['credit_total_utilise']
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_clients(request):
    """
    Vue pour rechercher des clients
    """
    query = request.query_params.get('q', '')
    if not query:
        return Response([])
    
    clients = Client.objects.filter(
        Q(nom_commercial__icontains=query) |
        Q(raison_sociale__icontains=query) |
        Q(telephone__icontains=query) |
        Q(contact__icontains=query)
    ).filter(is_active=True)[:10]
    
    serializer = ClientListSerializer(clients, many=True)
    return Response(serializer.data)
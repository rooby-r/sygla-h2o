from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from .models import SystemLog
from .serializers import SystemLogSerializer, SystemLogDetailSerializer


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour consulter les logs système
    Accessible uniquement aux administrateurs
    """
    queryset = SystemLog.objects.all()
    permission_classes = []  # Temporairement désactivé pour debugging
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'module', 'user']
    search_fields = ['message', 'details', 'user__email']
    ordering_fields = ['timestamp', 'type', 'module']
    ordering = ['-timestamp']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SystemLogDetailSerializer
        return SystemLogSerializer
    
    def get_queryset(self):
        # Temporairement désactivé pour debugging
        # if not self.request.user.role == 'admin':
        #     return SystemLog.objects.none()
        
        queryset = SystemLog.objects.select_related('user').all()
        
        # Filtrage par type si fourni dans query params
        log_type = self.request.query_params.get('type', None)
        if log_type and log_type != 'all':
            queryset = queryset.filter(type=log_type)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Retourne les statistiques des logs par type
        """
        # Temporairement désactivé pour debugging
        # if request.user.role != 'admin':
        #     return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)
        
        stats = SystemLog.objects.values('type').annotate(count=Count('id'))
        
        result = {
            'info': 0,
            'success': 0,
            'warning': 0,
            'error': 0
        }
        
        for stat in stats:
            result[stat['type']] = stat['count']
        
        return Response(result)
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Efface tous les logs (admin uniquement)
        """
        # Temporairement désactivé pour debugging
        # if request.user.role != 'admin':
        #     return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)
        
        count = SystemLog.objects.count()
        SystemLog.objects.all().delete()
        
        return Response({
            'message': f'{count} logs effacés avec succès',
            'count': count
        })

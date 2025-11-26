"""
Middleware pour mettre à jour l'activité des sessions utilisateurs
"""
from django.utils import timezone


class UpdateUserActivityMiddleware:
    """
    Middleware qui met à jour la dernière activité de l'utilisateur
    et de sa session à chaque requête authentifiée
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Traiter la requête
        response = self.get_response(request)
        
        # Si l'utilisateur est authentifié
        if hasattr(request, 'user') and request.user and request.user.is_authenticated:
            try:
                # Import ici pour éviter les erreurs de chargement
                from apps.authentication.models import UserSession
                
                now = timezone.now()
                
                # Mettre à jour la dernière activité de l'utilisateur
                if hasattr(request.user, 'last_activity'):
                    request.user.last_activity = now
                    request.user.save(update_fields=['last_activity'])
                
                # Extraire le token depuis l'en-tête Authorization
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:][:100]  # Premières 100 caractères du token
                    
                    # Trouver et mettre à jour la session correspondante
                    sessions = UserSession.objects.filter(
                        user=request.user,
                        token__startswith=token[:50],  # Comparaison partielle
                        is_active=True
                    )
                    
                    if sessions.exists():
                        sessions.update(last_activity=now)
                    
            except Exception as e:
                # Ne pas bloquer la requête en cas d'erreur
                pass  # Silencieux pour ne pas polluer les logs
        
        return response

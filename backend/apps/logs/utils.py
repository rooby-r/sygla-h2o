from .models import SystemLog
import time


def create_log(log_type, message, details='', user=None, module='system', 
               request=None, metadata=None, status_code=None, response_time=None):
    """
    Fonction utilitaire pour créer un log système
    
    Args:
        log_type: 'info', 'success', 'warning', 'error'
        message: Message principal du log
        details: Détails supplémentaires
        user: Instance User ou None
        module: Module concerné
        request: Objet request Django (pour extraire IP, user agent, etc.)
        metadata: Dict avec des données supplémentaires
        status_code: Code de statut HTTP
        response_time: Temps de réponse
    """
    log_data = {
        'type': log_type,
        'message': message,
        'details': details,
        'user': user,
        'module': module,
        'metadata': metadata or {},
        'status_code': status_code,
        'response_time': response_time or '',  # CharField ne peut pas être None
    }
    
    if request:
        # Extraire l'IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        log_data.update({
            'ip_address': ip_address,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'request_method': request.method,
            'endpoint': request.path,
        })
    
    return SystemLog.objects.create(**log_data)


class LogTimer:
    """Context manager pour mesurer le temps d'exécution"""
    def __init__(self):
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, *args):
        self.end_time = time.time()
    
    @property
    def elapsed(self):
        if self.start_time and self.end_time:
            elapsed_ms = (self.end_time - self.start_time) * 1000
            return f"{elapsed_ms:.0f}ms"
        return "0ms"

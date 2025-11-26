"""
Gestion des heures d'accès selon les rôles
"""
from django.utils import timezone
from datetime import time


def get_role_config_from_db(role):
    """
    Récupère la configuration depuis la base de données
    """
    try:
        from .models import BusinessHoursConfig
        config = BusinessHoursConfig.objects.filter(role=role).first()
        
        if config and config.enabled:
            return {
                'enabled': True,
                'start_time': time(config.start_hour, config.start_minute),
                'end_time': time(config.end_hour, config.end_minute),
                'days': config.allowed_days,
                'message': f"Accès autorisé de {config.get_time_range()}"
            }
    except Exception:
        pass
    
    return None


# Configuration par défaut des heures d'accès par rôle
ROLE_BUSINESS_HOURS = {
    'admin': {
        'enabled': False,  # Pas de restriction pour les admins
        'start_time': None,
        'end_time': None,
        'days': [],  # Tous les jours
    },
    'vendeur': {
        'enabled': False,  # Désactivé temporairement pour tests
        'start_time': time(7, 0),   # 7h00 du matin
        'end_time': time(18, 0),    # 18h00 (6h du soir)
        'days': [0, 1, 2, 3, 4, 5], # Lundi à Samedi (0=Lundi, 6=Dimanche)
        'message': 'Les vendeurs peuvent se connecter du lundi au samedi de 7h00 à 18h00'
    },
    'stock': {
        'enabled': True,
        'start_time': time(6, 0),   # 6h00 du matin
        'end_time': time(20, 0),    # 20h00 (8h du soir)
        'days': [0, 1, 2, 3, 4, 5, 6], # Tous les jours
        'message': 'Le personnel de stock peut se connecter tous les jours de 6h00 à 20h00'
    },
    'livreur': {
        'enabled': True,
        'start_time': time(5, 0),   # 5h00 du matin
        'end_time': time(21, 0),    # 21h00 (9h du soir)
        'days': [0, 1, 2, 3, 4, 5, 6], # Tous les jours
        'message': 'Les livreurs peuvent se connecter tous les jours de 5h00 à 21h00'
    }
}


def check_business_hours(user):
    """
    Vérifie si l'utilisateur peut se connecter selon son rôle et l'heure actuelle
    
    Returns:
        tuple: (can_connect: bool, message: str)
    """
    role = user.role
    
    # Essayer de récupérer la config depuis la DB d'abord
    config = get_role_config_from_db(role)
    
    # Sinon, utiliser la config par défaut
    if not config:
        if role not in ROLE_BUSINESS_HOURS:
            return True, None
        config = ROLE_BUSINESS_HOURS[role]
    
    # Si pas de restriction pour ce rôle (comme admin)
    if not config.get('enabled', False):
        return True, None
    
    # Obtenir l'heure actuelle (timezone aware)
    now = timezone.localtime(timezone.now())
    current_time = now.time()
    current_day = now.weekday()  # 0=Lundi, 6=Dimanche
    
    # Vérifier le jour de la semaine
    if current_day not in config['days']:
        return False, "Accès refusé : jour non autorisé"
    
    # Vérifier l'heure
    start_time = config['start_time']
    end_time = config['end_time']
    
    if not (start_time <= current_time <= end_time):
        start_str = start_time.strftime('%H:%M')
        end_str = end_time.strftime('%H:%M')
        return False, f"Accès autorisé de {start_str} à {end_str}"
    
    return True, None


def format_business_hours(role):
    """
    Retourne les heures d'accès formatées pour un rôle
    """
    if role not in ROLE_BUSINESS_HOURS:
        return "Aucune restriction"
    
    config = ROLE_BUSINESS_HOURS[role]
    
    if not config.get('enabled', False):
        return "Accès 24h/24, 7j/7"
    
    days_names = {
        0: 'lundi', 1: 'mardi', 2: 'mercredi', 
        3: 'jeudi', 4: 'vendredi', 5: 'samedi', 6: 'dimanche'
    }
    
    days_str = ', '.join([days_names[d] for d in config['days']])
    time_str = f"{config['start_time'].strftime('%H:%M')} - {config['end_time'].strftime('%H:%M')}"
    
    return f"{days_str.capitalize()}, {time_str}"

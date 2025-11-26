import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import SecuritySettings

def init_security_settings():
    """Initialiser les paramètres de sécurité par défaut"""
    
    settings = SecuritySettings.get_settings()
    
    print("✅ Paramètres de sécurité initialisés:")
    print(f"   - Timeout session: {settings.session_timeout} minutes")
    print(f"   - Tentatives de connexion max: {settings.max_login_attempts}")
    print(f"   - Durée de blocage: {settings.lockout_duration} minutes")
    print(f"   - Longueur minimale mot de passe: {settings.password_min_length} caractères")
    print(f"   - Token d'accès: {settings.jwt_access_token_lifetime} minutes")
    print(f"   - Token de rafraîchissement: {settings.jwt_refresh_token_lifetime} minutes")

if __name__ == '__main__':
    init_security_settings()

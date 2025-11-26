"""
Test du message d'erreur affiché dans le formulaire de connexion
Simulation d'une connexion hors horaires
"""
import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.authentication.views import login_view

User = get_user_model()

def test_login_error_message():
    print("=" * 70)
    print("TEST MESSAGE D'ERREUR FORMULAIRE LOGIN")
    print("=" * 70)
    
    # Créer une requête factice
    factory = RequestFactory()
    
    # Tester avec l'utilisateur vendeur (Phara)
    email = 'noelphara52@gmail.com'
    password = 'admin123'
    
    print(f"\n📧 Test connexion: {email}")
    print("-" * 70)
    
    # Créer la requête POST
    request = factory.post('/api/auth/login/', 
                          data=json.dumps({
                              'email': email,
                              'password': password
                          }),
                          content_type='application/json')
    
    # Simuler les headers
    request.META['REMOTE_ADDR'] = '127.0.0.1'
    request.META['HTTP_USER_AGENT'] = 'Mozilla/5.0 Test'
    
    # Appeler la vue de connexion
    try:
        response = login_view(request)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 403:
            # Erreur horaires d'accès
            data = json.loads(response.content)
            print(f"\n❌ ERREUR AFFICHÉE DANS LE FORMULAIRE:")
            print(f"   \"{data.get('error', 'N/A')}\"")
            print("\n✅ Ce message apparaîtra dans la boîte rouge du formulaire login")
            
        elif response.status_code == 200:
            print(f"\n✅ Connexion autorisée")
            
        else:
            print(f"\n⚠️ Autre erreur: {response.status_code}")
            data = json.loads(response.content)
            print(f"   Message: {data}")
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
    
    print("\n" + "=" * 70)
    print("AFFICHAGE DANS LE FORMULAIRE")
    print("=" * 70)
    print("""
    Le message s'affichera dans cette section du formulaire:
    
    ┌────────────────────────────────────────┐
    │  Email: suze@gmail.com                 │
    │  Mot de passe: ••••••••                │
    │                                         │
    │  ┌──────────────────────────────────┐  │
    │  │ ⚠️  Accès autorisé de 12:00 à   │  │
    │  │     12:45                        │  │
    │  └──────────────────────────────────┘  │
    │                                         │
    │  [ Se connecter ]                      │
    └────────────────────────────────────────┘
    
    Message court, clair et directement visible.
    """)

if __name__ == '__main__':
    test_login_error_message()

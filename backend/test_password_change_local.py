"""
Script de test simplifié sans contrainte d'horaire
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User, BusinessHoursConfig
from django.contrib.auth.hashers import make_password

print("\n" + "="*70)
print("TEST: Changement de mot de passe obligatoire (Test local)")
print("="*70)

# 1. Désactiver temporairement les restrictions horaires pour vendeur
print("\n1. Désactivation temporaire des restrictions horaires...")
try:
    config, created = BusinessHoursConfig.objects.get_or_create(role='vendeur')
    old_enabled = config.enabled
    config.enabled = False
    config.save()
    print("✓ Restrictions horaires désactivées")
except Exception as e:
    print(f"⚠ Erreur: {e}")
    old_enabled = False

# 2. Créer un utilisateur vendeur de test
print("\n2. Création d'un utilisateur vendeur de test...")
try:
    # Supprimer l'ancien s'il existe
    User.objects.filter(email='test.vendeur.new@sygla-h2o.com').delete()
    
    vendeur = User.objects.create(
        username='test_vendeur_new',
        email='test.vendeur.new@sygla-h2o.com',
        password=make_password('TempPassword123'),
        first_name='Test',
        last_name='Vendeur',
        role='vendeur',
        telephone='+50912345678'
    )
    
    print(f"✓ Utilisateur créé (ID: {vendeur.id})")
    print(f"  Email: {vendeur.email}")
    print(f"  must_change_password: {vendeur.must_change_password}")
    
    if vendeur.must_change_password:
        print("  → Le flag must_change_password est activé (CORRECT ✓)")
    else:
        print("  → ATTENTION: Le flag must_change_password n'est PAS activé (ERREUR ✗)")
        
except Exception as e:
    print(f"✗ Erreur création: {e}")
    import traceback
    traceback.print_exc()
    vendeur = None

# 3. Tester avec l'API
if vendeur:
    print("\n3. Test de connexion via l'API...")
    import requests
    
    login_data = {
        "email": "test.vendeur.new@sygla-h2o.com",
        "password": "TempPassword123"
    }
    
    try:
        response = requests.post("http://localhost:8000/api/auth/login/", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            must_change = result.get('must_change_password', False)
            token = result['tokens']['access']
            
            print("✓ Connexion réussie")
            print(f"  must_change_password dans la réponse: {must_change}")
            
            if must_change:
                print("  → L'API indique le changement de mot de passe requis (CORRECT ✓)")
                
                # 4. Test de changement de mot de passe
                print("\n4. Test de changement de mot de passe forcé...")
                headers = {"Authorization": f"Bearer {token}"}
                password_data = {
                    "new_password": "NewSecurePass123!",
                    "confirm_password": "NewSecurePass123!"
                }
                
                response = requests.post(
                    "http://localhost:8000/api/auth/force-change-password/",
                    json=password_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    print("✓ Mot de passe changé avec succès")
                    print(f"  Message: {response.json()['message']}")
                    
                    # 5. Vérifier que le flag est désactivé
                    print("\n5. Vérification du flag après changement...")
                    vendeur.refresh_from_db()
                    print(f"  must_change_password: {vendeur.must_change_password}")
                    
                    if not vendeur.must_change_password:
                        print("  → Le flag a été désactivé (CORRECT ✓)")
                    else:
                        print("  → ATTENTION: Le flag est toujours activé (ERREUR ✗)")
                    
                    # 6. Test de reconnexion
                    print("\n6. Test de reconnexion avec nouveau mot de passe...")
                    new_login_data = {
                        "email": "test.vendeur.new@sygla-h2o.com",
                        "password": "NewSecurePass123!"
                    }
                    
                    response = requests.post("http://localhost:8000/api/auth/login/", json=new_login_data)
                    
                    if response.status_code == 200:
                        result = response.json()
                        must_change = result.get('must_change_password', False)
                        
                        print("✓ Reconnexion réussie")
                        print(f"  must_change_password: {must_change}")
                        
                        if not must_change:
                            print("  → Le système ne demande plus le changement (CORRECT ✓)")
                        else:
                            print("  → ATTENTION: Le système demande encore le changement (ERREUR ✗)")
                    else:
                        print(f"✗ Erreur reconnexion: {response.text}")
                        
                else:
                    print(f"✗ Erreur changement mot de passe: {response.text}")
            else:
                print("  → ATTENTION: L'API n'indique PAS le changement requis (ERREUR ✗)")
        else:
            print(f"✗ Erreur connexion: {response.text}")
            
    except Exception as e:
        print(f"✗ Erreur test API: {e}")
        import traceback
        traceback.print_exc()

# 7. Test avec l'admin
print("\n7. Vérification que l'admin n'a pas le flag...")
admin = User.objects.filter(role='admin').first()
if admin:
    print(f"  Admin: {admin.email}")
    print(f"  must_change_password: {admin.must_change_password}")
    
    if not admin.must_change_password:
        print("  → L'admin n'a pas le flag (CORRECT ✓)")
    else:
        print("  → ATTENTION: L'admin a le flag (ERREUR ✗)")

# 8. Nettoyage
print("\n8. Nettoyage...")
if vendeur:
    vendeur.delete()
    print("✓ Utilisateur de test supprimé")

# Réactiver les restrictions horaires
try:
    config = BusinessHoursConfig.objects.get(role='vendeur')
    config.enabled = old_enabled
    config.save()
    print("✓ Restrictions horaires réactivées")
except Exception:
    pass

print("\n" + "="*70)
print("TEST TERMINÉ")
print("="*70)

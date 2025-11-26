import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

# Chercher l'utilisateur cesar
email = "cesar@gmail.com"
user = User.objects.filter(email=email).first()

if user:
    print(f"Utilisateur trouvé:")
    print(f"  Email: {user.email}")
    print(f"  Username: {user.username}")
    print(f"  Rôle: {user.role}")
    print(f"  Actif: {user.is_active}")
    print(f"  Must change password: {user.must_change_password}")
    
    # Vérifier le mot de passe
    test_passwords = ["cesar123", "Cesar123", "cesar", "password"]
    print(f"\nTest de mots de passe:")
    for pwd in test_passwords:
        if user.check_password(pwd):
            print(f"  ✓ '{pwd}' est le bon mot de passe")
            break
    else:
        print(f"  ✗ Aucun des mots de passe testés ne fonctionne")
        print(f"\n  Pour réinitialiser le mot de passe:")
        print(f"    user.set_password('NouveauMotDePasse')")
        print(f"    user.save()")
else:
    print(f"Aucun utilisateur trouvé avec l'email: {email}")
    print(f"\nUtilisateurs disponibles:")
    for u in User.objects.all():
        print(f"  - {u.email} ({u.role})")

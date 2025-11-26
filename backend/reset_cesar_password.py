import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

# Chercher et réinitialiser le mot de passe de cesar
email = "cesar@gmail.com"
user = User.objects.filter(email=email).first()

if user:
    # Nouveau mot de passe
    new_password = "Cesar@2024"
    
    user.set_password(new_password)
    user.save()
    
    print(f"✅ Mot de passe réinitialisé avec succès!")
    print(f"\nInformations de connexion:")
    print(f"  Email: {user.email}")
    print(f"  Mot de passe: {new_password}")
    print(f"  Rôle: {user.role}")
    print(f"\n⚠️  Important:")
    print(f"  Le flag 'must_change_password' est à {user.must_change_password}")
    if user.must_change_password:
        print(f"  → L'utilisateur sera obligé de changer son mot de passe après connexion")
    
    # Vérifier que le nouveau mot de passe fonctionne
    if user.check_password(new_password):
        print(f"\n✓ Vérification: Le nouveau mot de passe est correct")
    else:
        print(f"\n✗ Erreur: Le nouveau mot de passe ne fonctionne pas")
else:
    print(f"✗ Utilisateur non trouvé: {email}")

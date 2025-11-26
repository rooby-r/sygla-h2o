import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

# Réinitialiser le mot de passe de l'admin
try:
    admin = User.objects.get(email='admin@sygla-h2o.com')
    admin.set_password('admin123')
    admin.save()
    print(f"✅ Mot de passe réinitialisé avec succès pour {admin.email}")
    print(f"   Email: admin@sygla-h2o.com")
    print(f"   Mot de passe: admin123")
    print(f"   Rôle: {admin.role}")
except User.DoesNotExist:
    print("❌ Utilisateur admin@sygla-h2o.com non trouvé")

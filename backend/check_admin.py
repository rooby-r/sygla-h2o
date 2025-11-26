import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

# Trouver l'admin
admin = User.objects.filter(role='admin').first()
if admin:
    print(f"Admin trouvé:")
    print(f"  Email: {admin.email}")
    print(f"  Username: {admin.username}")
else:
    print("Aucun admin trouvé")

# Lister tous les utilisateurs
print("\nTous les utilisateurs:")
for user in User.objects.all():
    print(f"  - {user.email} ({user.role})")

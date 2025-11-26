#!/usr/bin/env python
"""
Script pour créer un utilisateur livreur de test
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def create_delivery_user():
    """Créer un utilisateur livreur de test"""
    
    print("🚚 Création d'un utilisateur livreur...")
    
    # Supprimer l'ancien utilisateur livreur s'il existe
    User.objects.filter(email='livreur@sygla-h2o.com').delete()
    
    # Créer un nouvel utilisateur livreur
    livreur = User.objects.create_user(
        username='livreur_test',
        email='livreur@sygla-h2o.com',
        password='livreur123',
        first_name='Jean',
        last_name='Dubois',
        role='livreur',
        telephone='+509 3456-7890',
        adresse='789 Rue des Livreurs, Port-au-Prince, Haïti'
    )
    
    print(f"✅ UTILISATEUR LIVREUR CRÉÉ!")
    print(f"===========================")
    print(f"📧 Email: {livreur.email}")
    print(f"🔑 Mot de passe: livreur123")
    print(f"👤 Nom complet: {livreur.get_full_name()}")
    print(f"🏷️ Rôle: {livreur.role}")
    print(f"📱 Téléphone: {livreur.telephone}")
    print(f"===========================")
    
    # Afficher tous les utilisateurs
    print(f"\n📊 TOTAL UTILISATEURS: {User.objects.count()}")
    for user in User.objects.all():
        print(f"   - {user.email} ({user.role}) - Actif: {user.is_active}")
    
    return livreur

if __name__ == "__main__":
    create_delivery_user()
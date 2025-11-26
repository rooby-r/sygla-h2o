#!/usr/bin/env python
"""
Script pour créer des utilisateurs de test avec différents rôles
"""
import os
import sys
import django

# Configuration du chemin Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.authentication.models import User

def create_test_users():
    """Créer des utilisateurs pour chaque rôle"""
    
    users_data = [
        {
            'email': 'admin@sygla-h2o.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'Principal',
            'role': 'admin',
            'telephone': '+509 1111 1111',
            'adresse': 'Port-au-Prince'
        },
        {
            'email': 'vendeur@sygla-h2o.com',
            'password': 'vendeur123',
            'first_name': 'Jean',
            'last_name': 'Vendeur',
            'role': 'vendeur',
            'telephone': '+509 2222 2222',
            'adresse': 'Port-au-Prince'
        },
        {
            'email': 'stock@sygla-h2o.com',
            'password': 'stock123',
            'first_name': 'Marie',
            'last_name': 'Stock',
            'role': 'stock',
            'telephone': '+509 3333 3333',
            'adresse': 'Port-au-Prince'
        },
        {
            'email': 'livreur@sygla-h2o.com',
            'password': 'livreur123',
            'first_name': 'Pierre',
            'last_name': 'Livreur',
            'role': 'livreur',
            'telephone': '+509 4444 4444',
            'adresse': 'Port-au-Prince'
        }
    ]
    
    print("🔧 Création des utilisateurs de test avec différents rôles...")
    print("=" * 60)
    
    for user_data in users_data:
        email = user_data['email']
        
        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            # Mettre à jour le rôle et le mot de passe
            user.role = user_data['role']
            user.first_name = user_data['first_name']
            user.last_name = user_data['last_name']
            user.telephone = user_data['telephone']
            user.adresse = user_data['adresse']
            user.set_password(user_data['password'])
            user.save()
            print(f"✅ Utilisateur mis à jour: {email} (rôle: {user_data['role']})")
        else:
            # Créer un nouvel utilisateur
            # Utiliser l'email sans le domaine comme username
            username = email.split('@')[0]
            user = User.objects.create_user(
                username=username,
                email=email,
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                telephone=user_data['telephone'],
                adresse=user_data['adresse']
            )
            print(f"✅ Nouvel utilisateur créé: {email} (rôle: {user_data['role']})")
    
    print("=" * 60)
    print("\n📋 Récapitulatif des comptes de test:")
    print("-" * 60)
    for user_data in users_data:
        print(f"\n🔐 {user_data['role'].upper()}")
        print(f"   Email    : {user_data['email']}")
        print(f"   Mot de passe : {user_data['password']}")
        print(f"   Nom      : {user_data['first_name']} {user_data['last_name']}")
    print("-" * 60)
    print("\n✅ Tous les utilisateurs ont été créés/mis à jour avec succès!")

if __name__ == '__main__':
    create_test_users()

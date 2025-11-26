# SYGLA-H2O - Système de Gestion d'Eau Potable et Glace

## 🌊 Description

SYGLA-H2O est un système de gestion complet pour les entreprises d'eau potable et de glace. Cette application moderne combine un backend Django REST API robuste avec une interface React futuriste pour offrir une solution complète de gestion commerciale.

## ✨ Fonctionnalités Principales

### 🔐 Authentification & Rôles
- **4 rôles utilisateurs** : Admin, Vendeur, Gestionnaire de stock, Livreur
- **JWT Authentication** avec tokens de refresh
- **Permissions granulaires** par rôle
- **Interface admin** pour la gestion des utilisateurs

### 👥 Module Clients
- **CRUD complet** pour les clients (entreprises commerciales)
- **Gestion des crédits** avec limites et suivi
- **Historique des commandes** par client
- **Recherche avancée** et filtres

### 📦 Module Produits & Stock
- **Gestion des produits** : eau potable et glace
- **Suivi des mouvements de stock** en temps réel
- **Alertes de stock faible** automatiques
- **Traçabilité complète** des entrées/sorties

### 🛒 Module Commandes
- **Workflow complet** : création → validation → livraison
- **Calcul automatique** des montants
- **Statuts multiples** : attente, validée, en cours, livrée, annulée
- **Vérification automatique** de la disponibilité

### 🚚 Module Livraisons
- **Génération automatique** des bons de livraison
- **Suivi en temps réel** par les livreurs
- **Validation des livraisons** avec signature
- **Historique complet** des livraisons

### 📊 Rapports & Dashboard
- **Tableaux de bord interactifs** avec graphiques
- **Export PDF/Excel** des rapports
- **Statistiques avancées** de performance
- **Analyses des ventes** et stocks

## 🛠 Stack Technique

### Backend
- **Django 4.2** - Framework web Python
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de données principale
- **JWT** - Authentification sécurisée
- **Celery + Redis** - Tâches asynchrones

### Frontend
- **React 18** - Interface utilisateur moderne
- **Tailwind CSS** - Styling futuriste
- **Framer Motion** - Animations fluides
- **React Query** - Gestion des données
- **React Hook Form** - Gestion des formulaires

### Outils & DevOps
- **Git** - Contrôle de version
- **Docker** - Conteneurisation (optionnel)
- **Gunicorn** - Serveur WSGI pour production
- **WhiteNoise** - Fichiers statiques

## 🚀 Installation & Configuration

### Prérequis
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Git

### Installation Backend (Django)

1. **Cloner le repository**
```bash
git clone <repository-url>
cd SYGLA-H2O
```

2. **Créer un environnement virtuel Python**
```bash
cd backend
python -m venv venv

# Windows
venv\\Scripts\\activate

# Linux/Mac
source venv/bin/activate
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configuration de la base de données**
```bash
# Créer la base de données PostgreSQL
createdb sygla_h2o_db

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos paramètres
```

5. **Migrations et données initiales**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

6. **Lancer le serveur de développement**
```bash
python manage.py runserver
```

### Installation Frontend (React)

1. **Naviguer vers le dossier frontend**
```bash
cd frontend
```

2. **Installer les dépendances Node.js**
```bash
npm install
```

3. **Configuration des variables d'environnement**
```bash
# Créer le fichier .env
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

4. **Lancer le serveur de développement**
```bash
npm start
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **Admin Django** : http://localhost:8000/admin

## 📁 Structure du Projet

```
SYGLA-H2O/
├── backend/                    # API Django
│   ├── sygla_h2o/             # Configuration principale
│   ├── apps/                  # Applications Django
│   │   ├── authentication/    # Gestion utilisateurs
│   │   ├── clients/           # Module clients
│   │   ├── products/          # Produits & stock
│   │   ├── orders/            # Commandes
│   │   ├── deliveries/        # Livraisons
│   │   └── reports/           # Rapports
│   ├── requirements.txt       # Dépendances Python
│   └── manage.py              # Script Django
├── frontend/                  # Interface React
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   ├── pages/             # Pages de l'application
│   │   ├── services/          # Services API
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── context/           # Contextes React
│   │   └── utils/             # Utilitaires
│   ├── package.json           # Dépendances Node.js
│   └── tailwind.config.js     # Configuration Tailwind
└── README.md                  # Documentation
```

## 🔧 Configuration Avancée

### Variables d'Environnement Backend

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_NAME=sygla_h2o_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Variables d'Environnement Frontend

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_APP_NAME="SYGLA-H2O"
REACT_APP_VERSION="1.0.0"
```

## 👥 Utilisation

### Rôles et Permissions

| Rôle | Clients | Produits | Commandes | Livraisons | Stock | Rapports |
|------|---------|----------|-----------|------------|-------|----------|
| **Admin** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ Tous |
| **Vendeur** | ✅ CRUD | 👁 Lecture | ✅ CRUD | 👁 Lecture | ❌ | ✅ Ventes |
| **Stock** | 👁 Lecture | ✅ CRUD | 👁 Lecture | ❌ | ✅ CRUD | ✅ Stock |
| **Livreur** | 👁 Lecture | 👁 Lecture | 👁 Lecture | ✅ Gestion | ❌ | ❌ |

### Workflow Type

1. **Création client** (Admin/Vendeur)
2. **Ajout produits** (Admin/Stock)
3. **Création commande** (Admin/Vendeur)
4. **Validation stock** (automatique)
5. **Génération livraison** (automatique)
6. **Livraison** (Livreur)
7. **Génération rapports** (Admin/Vendeur)

## 🔒 Sécurité

- **JWT Tokens** avec expiration et refresh
- **CORS** configuré pour les domaines autorisés
- **Validation des données** côté frontend et backend
- **Permissions granulaires** par rôle
- **Protection CSRF** activée
- **Logs d'audit** pour toutes les actions

## 📚 API Documentation

### Endpoints Principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/login/` | POST | Connexion utilisateur |
| `/api/auth/logout/` | POST | Déconnexion |
| `/api/clients/` | GET/POST | Liste/Création clients |
| `/api/clients/{id}/` | GET/PUT/DELETE | Détail client |
| `/api/products/` | GET/POST | Liste/Création produits |
| `/api/orders/` | GET/POST | Liste/Création commandes |
| `/api/deliveries/` | GET/POST | Liste/Création livraisons |
| `/api/reports/dashboard/` | GET | Statistiques dashboard |

## 🎨 Interface Utilisateur

L'interface utilise un design **futuriste et moderne** avec :
- **Palette de couleurs** : Bleus cyans avec accents violets
- **Animations fluides** avec Framer Motion
- **Effets de glassmorphisme** et gradients
- **Responsive design** pour tous les écrans
- **Dark theme** par défaut avec effets lumineux

## 🧪 Tests

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm test
```

## 📦 Déploiement

### Production Backend
```bash
# Collecter les fichiers statiques
python manage.py collectstatic

# Avec Gunicorn
gunicorn sygla_h2o.wsgi:application
```

### Production Frontend
```bash
# Build de production
npm run build

# Servir avec un serveur web (nginx, apache)
```

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commit** les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Créer** une Pull Request

## 📝 Changelog

### Version 1.0.0 (2024-10-08)
- ✨ Version initiale
- 🔐 Système d'authentification complet
- 👥 Module de gestion des clients
- 📦 Gestion des produits et stock
- 🛒 Système de commandes
- 🚚 Module de livraisons
- 📊 Tableaux de bord et rapports
- 🎨 Interface utilisateur futuriste

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou support technique :
- **Email** : support@sygla-h2o.com
- **Documentation** : Consultez ce README
- **Issues** : Créez une issue GitHub

---

**SYGLA-H2O** - *Révolutionnez la gestion de votre entreprise d'eau potable et glace* 🌊✨
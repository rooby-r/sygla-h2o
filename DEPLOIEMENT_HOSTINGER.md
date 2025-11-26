# Guide de Déploiement SYGLA-H2O sur Hostinger

## 📋 Prérequis

### Sur Hostinger
- **VPS Hostinger** (recommandé) ou **Cloud Hosting**
- **Accès SSH** activé
- **Domaine** configuré (optionnel)
- Minimum 2GB RAM, 2 CPU cores, 20GB SSD

### Services Nécessaires
- PostgreSQL 13+ (ou utiliser une base de données externe)
- Python 3.9+
- Node.js 16+
- Nginx (serveur web)

## 🚀 Étape 1 : Configuration Initiale du VPS

### 1.1 Connexion SSH au VPS Hostinger

```bash
ssh root@votre-ip-hostinger
```

### 1.2 Mise à jour du système

```bash
apt update && apt upgrade -y
```

### 1.3 Installation des dépendances système

```bash
# Python et outils
apt install -y python3.9 python3-pip python3-venv python3-dev

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx

# Outils supplémentaires
apt install -y git build-essential libpq-dev supervisor
```

## 🗄️ Étape 2 : Configuration PostgreSQL

### 2.1 Créer l'utilisateur et la base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL
CREATE DATABASE sygla_h2o_db;
CREATE USER sygla_user WITH PASSWORD 'VotreMotDePasseSecurise123!';
ALTER ROLE sygla_user SET client_encoding TO 'utf8';
ALTER ROLE sygla_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sygla_user SET timezone TO 'America/Port-au-Prince';
GRANT ALL PRIVILEGES ON DATABASE sygla_h2o_db TO sygla_user;
\q
```

### 2.2 Configurer PostgreSQL pour accepter les connexions locales

```bash
# Éditer pg_hba.conf
nano /etc/postgresql/13/main/pg_hba.conf

# Ajouter cette ligne (si elle n'existe pas)
# local   all             all                                     md5

# Redémarrer PostgreSQL
systemctl restart postgresql
```

## 📦 Étape 3 : Déploiement du Backend Django

### 3.1 Créer un utilisateur système

```bash
# Créer un utilisateur dédié pour l'application
adduser --system --group --home /home/sygla sygla
```

### 3.2 Cloner le repository

```bash
# Se connecter en tant qu'utilisateur sygla
su - sygla

# Cloner le projet
git clone https://github.com/rooby-r/sygla-h2o.git
cd sygla-h2o/backend
```

### 3.3 Configuration de l'environnement Python

```bash
# Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 3.4 Configuration du fichier .env

```bash
nano /home/sygla/sygla-h2o/backend/.env
```

Contenu du fichier `.env` :

```env
# Django Settings
DEBUG=False
SECRET_KEY=votre-secret-key-tres-securisee-generee-aleatoirement
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com,votre-ip-vps

# Database
DATABASE_NAME=sygla_h2o_db
DATABASE_USER=sygla_user
DATABASE_PASSWORD=VotreMotDePasseSecurise123!
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### 3.5 Migrations et fichiers statiques

```bash
# Activer l'environnement virtuel
source /home/sygla/sygla-h2o/backend/venv/bin/activate

# Migrations
python manage.py makemigrations
python manage.py migrate

# Collecter les fichiers statiques
python manage.py collectstatic --noinput

# Créer un superutilisateur
python manage.py createsuperuser
```

### 3.6 Configuration Gunicorn

Créer le fichier de configuration Gunicorn :

```bash
nano /home/sygla/sygla-h2o/backend/gunicorn_config.py
```

Contenu :

```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
errorlog = "/home/sygla/logs/gunicorn-error.log"
accesslog = "/home/sygla/logs/gunicorn-access.log"
loglevel = "info"
```

### 3.7 Configuration Supervisor pour Gunicorn

```bash
# Revenir en root
exit

# Créer le dossier de logs
mkdir -p /home/sygla/logs
chown -R sygla:sygla /home/sygla/logs

# Configurer Supervisor
nano /etc/supervisor/conf.d/sygla-backend.conf
```

Contenu :

```ini
[program:sygla-backend]
command=/home/sygla/sygla-h2o/backend/venv/bin/gunicorn sygla_h2o.wsgi:application -c /home/sygla/sygla-h2o/backend/gunicorn_config.py
directory=/home/sygla/sygla-h2o/backend
user=sygla
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/sygla/logs/supervisor-backend.log
stderr_logfile=/home/sygla/logs/supervisor-backend-error.log
environment=PATH="/home/sygla/sygla-h2o/backend/venv/bin"
```

```bash
# Recharger Supervisor
supervisorctl reread
supervisorctl update
supervisorctl start sygla-backend
supervisorctl status
```

## ⚛️ Étape 4 : Déploiement du Frontend React

### 4.1 Build du frontend

```bash
# Se connecter en tant qu'utilisateur sygla
su - sygla
cd /home/sygla/sygla-h2o/frontend

# Créer le fichier .env
nano .env
```

Contenu du `.env` :

```env
REACT_APP_API_URL=https://votre-domaine.com/api
REACT_APP_APP_NAME="SYGLA-H2O"
REACT_APP_VERSION="1.1.0"
```

```bash
# Installer les dépendances
npm install

# Build de production
npm run build
```

### 4.2 Le dossier `build` contient maintenant l'application React optimisée

## 🌐 Étape 5 : Configuration Nginx

### 5.1 Créer la configuration Nginx

```bash
# Revenir en root
exit

nano /etc/nginx/sites-available/sygla-h2o
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTP vers HTTPS (après configuration SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend React
    location / {
        root /home/sygla/sygla-h2o/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers statiques Django
    location /static/ {
        alias /home/sygla/sygla-h2o/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Fichiers media Django
    location /media/ {
        alias /home/sygla/sygla-h2o/backend/media/;
        expires 30d;
    }

    # Logs
    access_log /var/log/nginx/sygla-access.log;
    error_log /var/log/nginx/sygla-error.log;
}
```

### 5.2 Activer le site

```bash
# Créer un lien symbolique
ln -s /etc/nginx/sites-available/sygla-h2o /etc/nginx/sites-enabled/

# Tester la configuration
nginx -t

# Redémarrer Nginx
systemctl restart nginx
```

## 🔒 Étape 6 : Configuration SSL avec Let's Encrypt

### 6.1 Installer Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtenir un certificat SSL

```bash
# Arrêter temporairement Nginx
systemctl stop nginx

# Obtenir le certificat
certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com

# Redémarrer Nginx
systemctl start nginx
```

### 6.3 Mettre à jour la configuration Nginx pour HTTPS

```bash
nano /etc/nginx/sites-available/sygla-h2o
```

Ajouter la configuration HTTPS :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Paramètres SSL recommandés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Frontend React
    location / {
        root /home/sygla/sygla-h2o/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers statiques Django
    location /static/ {
        alias /home/sygla/sygla-h2o/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Fichiers media Django
    location /media/ {
        alias /home/sygla/sygla-h2o/backend/media/;
        expires 30d;
    }

    # Logs
    access_log /var/log/nginx/sygla-access.log;
    error_log /var/log/nginx/sygla-error.log;
}
```

```bash
# Redémarrer Nginx
nginx -t
systemctl restart nginx
```

### 6.4 Auto-renouvellement SSL

```bash
# Tester le renouvellement
certbot renew --dry-run

# Le cron job est automatiquement configuré par Certbot
```

## 🔧 Étape 7 : Configuration du Pare-feu

```bash
# Installer UFW
apt install -y ufw

# Configurer les règles
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'

# Activer le pare-feu
ufw enable
ufw status
```

## 📊 Étape 8 : Monitoring et Logs

### 8.1 Vérifier les logs

```bash
# Logs Nginx
tail -f /var/log/nginx/sygla-error.log
tail -f /var/log/nginx/sygla-access.log

# Logs Gunicorn
tail -f /home/sygla/logs/gunicorn-error.log

# Logs Supervisor
tail -f /home/sygla/logs/supervisor-backend.log
```

### 8.2 Commandes utiles Supervisor

```bash
# Voir le statut
supervisorctl status

# Redémarrer le backend
supervisorctl restart sygla-backend

# Arrêter/Démarrer
supervisorctl stop sygla-backend
supervisorctl start sygla-backend

# Recharger la configuration
supervisorctl reread
supervisorctl update
```

## 🔄 Étape 9 : Script de Mise à Jour

Créer un script pour faciliter les déploiements futurs :

```bash
nano /home/sygla/deploy.sh
```

Contenu :

```bash
#!/bin/bash

echo "🚀 Déploiement SYGLA-H2O..."

# Aller dans le dossier du projet
cd /home/sygla/sygla-h2o

# Pull des dernières modifications
echo "📥 Récupération des mises à jour..."
git pull origin main

# Backend
echo "🔧 Mise à jour du backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Frontend
echo "⚛️ Mise à jour du frontend..."
cd ../frontend
npm install
npm run build

# Redémarrer les services
echo "🔄 Redémarrage des services..."
sudo supervisorctl restart sygla-backend
sudo systemctl reload nginx

echo "✅ Déploiement terminé!"
```

```bash
# Rendre le script exécutable
chmod +x /home/sygla/deploy.sh
chown sygla:sygla /home/sygla/deploy.sh
```

Pour déployer une mise à jour :

```bash
su - sygla
./deploy.sh
```

## 🎯 Étape 10 : Configuration DNS sur Hostinger

### 10.1 Dans le panneau Hostinger

1. Allez dans **Domaines** → Votre domaine
2. Cliquez sur **DNS / Nameservers**
3. Ajoutez/Modifiez les enregistrements :

```
Type    Nom                 Valeur                  TTL
A       @                   VOTRE-IP-VPS            3600
A       www                 VOTRE-IP-VPS            3600
```

## ✅ Vérification Finale

### 10.1 Tester l'application

```bash
# Vérifier que le backend répond
curl http://127.0.0.1:8000/api/

# Vérifier Nginx
curl http://localhost

# Vérifier les services
systemctl status nginx
supervisorctl status sygla-backend
systemctl status postgresql
```

### 10.2 Accéder à l'application

- **Frontend** : https://votre-domaine.com
- **Admin Django** : https://votre-domaine.com/admin
- **API** : https://votre-domaine.com/api

## 🔐 Sécurité Supplémentaire

### Configuration Fail2Ban

```bash
apt install -y fail2ban

# Configurer Fail2Ban pour SSH et Nginx
nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/sygla-error.log
maxretry = 5
bantime = 3600
```

```bash
systemctl restart fail2ban
```

## 📝 Notes Importantes

### Sauvegarde de la Base de Données

```bash
# Créer une sauvegarde
sudo -u postgres pg_dump sygla_h2o_db > backup_$(date +%Y%m%d).sql

# Restaurer une sauvegarde
sudo -u postgres psql sygla_h2o_db < backup_20241126.sql
```

### Script de Sauvegarde Automatique

```bash
nano /home/sygla/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/sygla/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
sudo -u postgres pg_dump sygla_h2o_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Nettoyer les backups de plus de 7 jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup créé: db_$DATE.sql.gz"
```

```bash
chmod +x /home/sygla/backup.sh

# Ajouter au crontab pour backup quotidien à 2h du matin
crontab -e
# Ajouter: 0 2 * * * /home/sygla/backup.sh
```

## 🆘 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
tail -f /home/sygla/logs/gunicorn-error.log
tail -f /home/sygla/logs/supervisor-backend.log

# Vérifier les permissions
ls -la /home/sygla/sygla-h2o/backend
```

### Erreurs 502 Bad Gateway

```bash
# Vérifier que Gunicorn est actif
supervisorctl status sygla-backend

# Vérifier les logs Nginx
tail -f /var/log/nginx/sygla-error.log
```

### Problèmes de base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql sygla_h2o_db

# Lister les tables
\dt

# Quitter
\q
```

---

**🎉 Votre application SYGLA-H2O est maintenant déployée sur Hostinger !**

Pour toute question : support@sygla-h2o.com

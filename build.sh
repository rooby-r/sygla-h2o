#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies from root requirements.txt
pip install -r requirements.txt

# Change to backend directory for Django commands
cd backend

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate

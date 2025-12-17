"""
WSGI config for Render deployment.
This file allows running gunicorn from the root directory.
"""

import os
import sys

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

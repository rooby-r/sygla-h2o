from django.apps import AppConfig


class SalesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sales'
    
    def ready(self):
        import apps.sales.signals
        import apps.sales.notifications
    verbose_name = 'Ventes'
    
    def ready(self):
        import apps.sales.signals

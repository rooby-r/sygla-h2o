from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Configuration de l'admin pour le modèle Client
    """
    list_display = [
        'nom_commercial', 'contact', 'telephone', 'credit_limite',
        'credit_utilise', 'credit_disponible', 'is_active', 'date_creation'
    ]
    list_filter = ['is_active', 'date_creation', 'credit_limite']
    search_fields = ['nom_commercial', 'raison_sociale', 'telephone', 'contact', 'email']
    ordering = ['nom_commercial']
    readonly_fields = ['credit_disponible', 'date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom_commercial', 'raison_sociale', 'contact', 'telephone', 'email')
        }),
        ('Adresse', {
            'fields': ('adresse',)
        }),
        ('Informations commerciales', {
            'fields': ('credit_limite', 'credit_utilise', 'credit_disponible', 'is_active')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def credit_disponible(self, obj):
        return f"{obj.credit_disponible:,.2f} FCFA"
    credit_disponible.short_description = 'Crédit disponible'
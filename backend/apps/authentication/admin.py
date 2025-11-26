from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Configuration de l'admin pour le modèle User personnalisé
    """
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_creation']
    list_filter = ['role', 'is_active', 'date_creation']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_creation']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations SYGLA-H2O', {
            'fields': ('role', 'telephone', 'adresse')
        }),
        ('Dates importantes', {
            'fields': ('date_creation', 'date_modification')
        }),
    )
    
    readonly_fields = ['date_creation', 'date_modification']
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations SYGLA-H2O', {
            'fields': ('role', 'telephone', 'adresse')
        }),
    )
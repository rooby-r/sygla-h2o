from django.contrib import admin
from .models import Vente, LigneVente, Paiement


class LigneVenteInline(admin.TabularInline):
    model = LigneVente
    extra = 1


class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0
    readonly_fields = ['date_paiement']


@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display = [
        'numero_vente', 'client', 'vendeur', 'montant_total',
        'montant_paye', 'statut_paiement', 'date_vente'
    ]
    list_filter = ['statut_paiement', 'date_vente']
    search_fields = ['numero_vente', 'client__nom']
    readonly_fields = ['numero_vente', 'montant_restant', 'statut_paiement', 'created_at', 'updated_at']
    inlines = [LigneVenteInline, PaiementInline]


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['vente', 'montant', 'methode', 'date_paiement', 'recu_par']
    list_filter = ['methode', 'date_paiement']
    search_fields = ['vente__numero_vente', 'reference']
    readonly_fields = ['date_paiement']

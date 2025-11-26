from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'ventes', views.VenteViewSet, basename='vente')
router.register(r'paiements', views.PaiementViewSet, basename='paiement')

urlpatterns = [
    path('', include(router.urls)),
]

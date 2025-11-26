from django.urls import path
from . import views

urlpatterns = [
    # Liste des livraisons
    path('', views.DeliveryListView.as_view(), name='delivery_list'),
    
    # Détails d'une livraison
    path('<int:pk>/', views.DeliveryDetailView.as_view(), name='delivery_detail'),
    
    # Marquer une livraison comme terminée
    path('<int:pk>/delivered/', views.mark_as_delivered, name='mark_as_delivered'),
    
    # Mettre à jour le statut d'une livraison
    path('<int:pk>/status/', views.update_delivery_status, name='update_delivery_status'),
    
    # Statistiques des livraisons
    path('stats/', views.delivery_stats, name='delivery_stats'),
]
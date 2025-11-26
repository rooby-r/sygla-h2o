from django.urls import path
from . import views

urlpatterns = [
    path('', views.CommandeListCreateView.as_view(), name='commande-list-create'),
    path('<int:pk>/', views.CommandeRetrieveUpdateDeleteView.as_view(), name='commande-detail'),
    path('<int:pk>/validate/', views.valider_commande, name='commande-valider'),
    path('<int:pk>/valider/', views.valider_commande, name='commande-valider-fr'),
    path('<int:commande_id>/paiement/', views.ajouter_paiement_commande, name='commande-ajouter-paiement'),
    path('client/<int:client_id>/historique/', views.ClientCommandeHistoriqueView.as_view(), name='client-commande-historique'),
]
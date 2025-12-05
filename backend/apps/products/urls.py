from django.urls import path
from . import views

urlpatterns = [
    # Produits
    path('', views.ProduitListCreateView.as_view(), name='produit-list-create'),
    path('<int:pk>/', views.ProduitDetailView.as_view(), name='produit-detail'),
    path('<int:pk>/ajuster-stock/', views.StockAjustementView.as_view(), name='produit-ajuster-stock'),
    
    # Mouvements de stock
    path('mouvements/', views.MouvementStockListView.as_view(), name='mouvement-stock-list'),
    path('mouvements/create/', views.MouvementStockCreateView.as_view(), name='mouvement-stock-create'),
    path('<int:produit_id>/mouvements/', views.MouvementStockByProductView.as_view(), name='mouvement-stock-by-product'),
]
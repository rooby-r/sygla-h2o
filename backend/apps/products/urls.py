from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProduitListCreateView.as_view(), name='produit-list-create'),
    path('<int:pk>/', views.ProduitDetailView.as_view(), name='produit-detail'),
]
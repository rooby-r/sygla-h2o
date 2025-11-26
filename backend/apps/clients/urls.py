from django.urls import path
from . import views

urlpatterns = [
    path('', views.ClientListCreateView.as_view(), name='client-list-create'),
    path('<int:pk>/', views.ClientDetailView.as_view(), name='client-detail'),
    path('<int:pk>/toggle-status/', views.toggle_client_status, name='client-toggle-status'),
    path('stats/', views.client_stats, name='client-stats'),
    path('search/', views.search_clients, name='client-search'),
]
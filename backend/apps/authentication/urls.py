from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_database import get_database_stats, create_backup, list_backups, restore_backup, download_backup

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'sessions', views.UserSessionViewSet, basename='user-session')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentification
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password_view, name='change-password'),
    path('force-change-password/', views.force_change_password_view, name='force-change-password'),
    path('check-access/', views.check_access_allowed, name='check-access'),  # Vérification horaires d'accès
    
    # Gestion utilisateurs
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/create/', views.create_user, name='user-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Paramètres
    path('business-hours/', views.get_business_hours, name='business-hours'),
    path('business-hours/<str:role>/', views.update_business_hours, name='update-business-hours'),
    path('my-business-hours/', views.get_my_business_hours, name='my-business-hours'),
    path('security-settings/', views.get_security_settings, name='security-settings'),
    path('security-settings/update/', views.update_security_settings, name='update-security-settings'),
    path('notification-preferences/', views.get_notification_preferences, name='notification-preferences'),
    path('notification-preferences/update/', views.update_notification_preferences, name='update-notification-preferences'),
    
    # Database management
    path('database/stats/', get_database_stats, name='database-stats'),
    path('database/backup/', create_backup, name='database-backup'),
    path('database/backups/', list_backups, name='database-backups-list'),
    path('database/restore/', restore_backup, name='database-restore'),
    path('database/download/<str:filename>/', download_backup, name='database-download'),
]
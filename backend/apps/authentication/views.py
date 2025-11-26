from rest_framework import status, generics, permissions, viewsets, parsers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .models import User, Notification, UserSession
from .serializers import (
    UserSerializer, LoginSerializer, UserProfileSerializer,
    ChangePasswordSerializer, NotificationSerializer, UserSessionSerializer,
    ActiveUserSerializer
)
from apps.logs.utils import create_log, LogTimer


class RegisterView(generics.CreateAPIView):
    """
    Vue pour l'inscription d'un nouvel utilisateur
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Utilisateur créé avec succès'
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Vue pour l'authentification
    """
    from django.utils import timezone
    from .business_hours import check_business_hours
    
    with LogTimer() as timer:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Vérifier les heures d'accès selon le rôle
        can_connect, error_message = check_business_hours(user)
        
        if not can_connect:
            # Log de tentative de connexion hors horaires
            try:
                login_time = timezone.now()
                create_log(
                    log_type='warning',
                    message=f"Tentative de connexion hors horaires: {user.get_full_name() or user.email}",
                    details=error_message,
                    user=user,
                    module='authentication',
                    request=request,
                    metadata={
                        'userId': user.id,
                        'email': user.email,
                        'role': user.role,
                        'attemptTime': login_time.isoformat(),
                        'attemptTimeFormatted': login_time.strftime('%d/%m/%Y à %H:%M:%S'),
                        'reason': 'outside_business_hours'
                    },
                    status_code=403,
                    response_time=timer.elapsed
                )
            except Exception:
                pass
            
            return Response({
                'error': error_message
            }, status=status.HTTP_403_FORBIDDEN)
        
        refresh = RefreshToken.for_user(user)
        
        # Capturer l'heure de connexion
        login_time = timezone.now()
        
        # Créer une session utilisateur
        try:
            # Extraire les infos de la requête
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Extraire le type d'appareil depuis le user agent
            device_info = 'Navigateur Web'
            if 'Mobile' in user_agent:
                device_info = 'Mobile'
            elif 'Tablet' in user_agent:
                device_info = 'Tablette'
            
            # Créer la session
            UserSession.objects.create(
                user=user,
                token=str(refresh.access_token)[:500],  # Limiter à 500 caractères
                ip_address=ip_address,
                user_agent=user_agent,
                device_info=device_info
            )
            
            # Mettre à jour la dernière activité de l'utilisateur
            user.last_activity = login_time
            user.save(update_fields=['last_activity'])
            
        except Exception as e:
            print(f"Erreur lors de la création de la session: {e}")
        
        # Vérifier si l'utilisateur doit changer son mot de passe
        must_change_password = user.must_change_password and user.role != 'admin'
        
        response = Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'must_change_password': must_change_password,
            'message': 'Connexion réussie'
        })

        # Log de connexion
        try:
            create_log(
                log_type='success',
                message=f"Connexion réussie: {user.get_full_name() or user.email}",
                details=f"Utilisateur connecté le {login_time.strftime('%d/%m/%Y à %H:%M:%S')}",
                user=user,
                module='authentication',
                request=request,
                metadata={
                    'userId': user.id,
                    'email': user.email,
                    'role': user.role,
                    'loginTime': login_time.isoformat(),
                    'loginTimeFormatted': login_time.strftime('%d/%m/%Y à %H:%M:%S')
                },
                status_code=response.status_code,
                response_time=timer.elapsed
            )
        except Exception:
            # Ne pas empêcher la connexion si le logging échoue
            pass

        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Vue pour la déconnexion
    """
    from django.utils import timezone
    
    # Capturer l'heure de déconnexion
    logout_time = timezone.now()
    
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                # Le token est peut-être déjà blacklisté ou invalide, on continue quand même
                print(f"Erreur lors du blacklist du token: {e}")
        
        # Marquer la session comme déconnectée
        try:
            # Récupérer le token d'accès depuis l'en-tête
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                access_token = auth_header[7:][:500]
                # Trouver et fermer la session
                sessions = UserSession.objects.filter(
                    user=request.user,
                    token__startswith=access_token[:100],  # Comparaison partielle
                    is_active=True
                )
                for session in sessions:
                    session.logout()
        except Exception as e:
            print(f"Erreur lors de la fermeture de la session: {e}")
        
        response = Response({
            'message': 'Déconnexion réussie'
        })

        # Log de déconnexion
        try:
            create_log(
                log_type='info',
                message=f"Déconnexion: {request.user.get_full_name() or request.user.email}",
                details=f"Utilisateur déconnecté le {logout_time.strftime('%d/%m/%Y à %H:%M:%S')}",
                user=request.user,
                module='authentication',
                request=request,
                metadata={
                    'userId': request.user.id,
                    'email': request.user.email,
                    'role': request.user.role,
                    'logoutTime': logout_time.isoformat(),
                    'logoutTimeFormatted': logout_time.strftime('%d/%m/%Y à %H:%M:%S')
                },
                status_code=response.status_code
            )
        except Exception as e:
            print(f"Erreur lors de la création du log de déconnexion: {e}")

        return response
    except Exception as e:
        print(f"Erreur générale lors de la déconnexion: {e}")
        
        # Même en cas d'erreur, on crée un log
        try:
            create_log(
                log_type='warning',
                message=f"Déconnexion avec erreur: {request.user.get_full_name() or request.user.email}",
                details=f"Erreur: {str(e)}",
                user=request.user,
                module='authentication',
                request=request,
                metadata={
                    'userId': request.user.id,
                    'email': request.user.email,
                    'role': request.user.role,
                    'error': str(e),
                    'logoutTime': logout_time.isoformat(),
                    'logoutTimeFormatted': logout_time.strftime('%d/%m/%Y à %H:%M:%S')
                },
                status_code=400
            )
        except Exception:
            pass
        
        return Response({
            'error': 'Erreur lors de la déconnexion'
        }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Vue pour consulter et modifier le profil utilisateur
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Gérer la suppression de photo en premier
        if request.data.get('remove_photo') == 'true' or request.data.get('remove_photo') is True:
            if instance.photo:
                instance.photo.delete(save=False)
                instance.photo = None
                instance.save()
            # Retourner immédiatement après suppression
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        # Gérer l'upload de photo
        if 'photo' in request.FILES:
            # Supprimer l'ancienne photo si elle existe
            if instance.photo:
                instance.photo.delete(save=False)
            instance.photo = request.FILES['photo']
            instance.save()
            # Retourner immédiatement après upload
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        # Mettre à jour les autres champs (sans photo)
        data = request.data.copy()
        data.pop('photo', None)  # Retirer photo des données si présent
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Vue pour changer le mot de passe
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    
    user = request.user
    user.set_password(serializer.validated_data['new_password'])
    
    # Réinitialiser le flag must_change_password après changement
    if user.must_change_password:
        user.must_change_password = False
    
    user.save()
    
    return Response({
        'message': 'Mot de passe modifié avec succès'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_change_password_view(request):
    """
    Vue pour forcer le changement de mot de passe à la première connexion
    Seulement pour les utilisateurs non-admin avec le flag must_change_password
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    # Retirer la validation du current_password pour ce cas spécial
    data = request.data.copy()
    if not data.get('current_password'):
        # Utiliser un mot de passe fictif juste pour la validation
        data['current_password'] = 'dummy_password_for_validation'
    
    serializer = ChangePasswordSerializer(data=data, context={'request': request})
    
    # Valider seulement les nouveaux mots de passe
    if data.get('new_password') != data.get('confirm_password'):
        return Response({
            'error': 'Les nouveaux mots de passe ne correspondent pas.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(data.get('new_password', '')) < 8:
        return Response({
            'error': 'Le mot de passe doit contenir au moins 8 caractères.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    
    # Vérifier que l'utilisateur doit changer son mot de passe
    if not user.must_change_password:
        return Response({
            'error': 'Vous n\'êtes pas obligé de changer votre mot de passe.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Empêcher l'admin d'utiliser cette fonctionnalité
    if user.role == 'admin':
        return Response({
            'error': 'Cette fonctionnalité n\'est pas disponible pour les administrateurs.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Changer le mot de passe
    user.set_password(data['new_password'])
    user.must_change_password = False
    user.save()
    
    # Créer un log
    try:
        from apps.logs.utils import create_log
        from django.utils import timezone
        
        create_log(
            log_type='success',
            message=f"Changement de mot de passe forcé: {user.get_full_name() or user.email}",
            details=f"L'utilisateur a changé son mot de passe suite à la première connexion",
            user=user,
            module='authentication',
            request=request,
            metadata={
                'userId': user.id,
                'email': user.email,
                'role': user.role,
                'timestamp': timezone.now().isoformat()
            },
            status_code=200
        )
    except Exception:
        pass
    
    return Response({
        'message': 'Mot de passe modifié avec succès. Vous pouvez maintenant utiliser le système.'
    })


class UserListView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des utilisateurs (admin uniquement)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Seuls les admins peuvent voir tous les utilisateurs
        if self.request.user.role == 'admin':
            return User.objects.all()
        else:
            return User.objects.filter(id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        # Seuls les admins peuvent créer des utilisateurs
        if request.user.role != 'admin':
            return Response({
                'error': 'Permission refusée'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour consulter, modifier et supprimer un utilisateur (admin uniquement)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Seuls les admins peuvent gérer les autres utilisateurs
        if self.request.user.role == 'admin':
            return User.objects.all()
        else:
            return User.objects.filter(id=self.request.user.id)

    def destroy(self, request, *args, **kwargs):
        # Empêcher la suppression de son propre compte
        if self.get_object() == request.user:
            return Response({
                'error': 'Vous ne pouvez pas supprimer votre propre compte'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_access_allowed(request):
    """
    Vérifier si l'utilisateur connecté peut encore accéder au système
    selon les horaires d'accès. Utilisé pour déconnexion automatique.
    """
    from .business_hours import check_business_hours
    
    user = request.user
    can_connect, error_message = check_business_hours(user)
    
    return Response({
        'allowed': can_connect,
        'message': error_message if not can_connect else 'Accès autorisé',
        'role': user.role,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_business_hours(request):
    """
    Récupérer les horaires d'accès de tous les rôles (admin uniquement)
    """
    from .models import BusinessHoursConfig
    from .serializers_business_hours import BusinessHoursConfigSerializer
    
    # Seuls les admins peuvent voir cette configuration
    if request.user.role != 'admin':
        return Response({
            'error': 'Permission refusée'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Récupérer toutes les configurations
    configs = BusinessHoursConfig.objects.all()
    serializer = BusinessHoursConfigSerializer(configs, many=True)
    
    return Response(serializer.data)


@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
def update_business_hours(request, role):
    """
    Mettre à jour les horaires d'accès d'un rôle (admin uniquement)
    """
    from .models import BusinessHoursConfig
    from .serializers_business_hours import BusinessHoursConfigSerializer
    
    # Seuls les admins peuvent modifier
    if request.user.role != 'admin':
        return Response({
            'error': 'Permission refusée'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Vérifier que le rôle est valide
    if role not in ['vendeur', 'stock', 'livreur']:
        return Response({
            'error': 'Rôle invalide'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Récupérer ou créer la configuration
    config, created = BusinessHoursConfig.objects.get_or_create(role=role)
    
    # Mettre à jour
    serializer = BusinessHoursConfigSerializer(config, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        # Créer un log
        try:
            from apps.logs.utils import create_log
            create_log(
                log_type='info',
                message=f"Configuration horaire modifiée: {role}",
                details=f"Horaires d'accès mis à jour pour le rôle {role}",
                user=request.user,
                module='authentication',
                request=request,
                metadata={
                    'role': role,
                    'enabled': serializer.data['enabled'],
                    'time_range': serializer.data['time_range'],
                    'allowed_days': serializer.data['allowed_days']
                },
                status_code=200
            )
        except Exception:
            pass
        
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_business_hours(request):
    """
    Récupérer les horaires d'accès de l'utilisateur connecté
    """
    from .business_hours import format_business_hours
    
    formatted = format_business_hours(request.user.role)
    
    return Response({
        'role': request.user.role,
        'business_hours': formatted
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_security_settings(request):
    """
    Récupérer les paramètres de sécurité (admin uniquement)
    """
    from .models import SecuritySettings
    from .serializers_security import SecuritySettingsSerializer
    
    # Seuls les admins peuvent voir
    if request.user.role != 'admin':
        return Response({
            'error': 'Permission refusée'
        }, status=status.HTTP_403_FORBIDDEN)
    
    settings = SecuritySettings.get_settings()
    serializer = SecuritySettingsSerializer(settings)
    
    return Response(serializer.data)


@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
def update_security_settings(request):
    """
    Mettre à jour les paramètres de sécurité (admin uniquement)
    """
    from .models import SecuritySettings
    from .serializers_security import SecuritySettingsSerializer
    from apps.logs.utils import create_log, LogTimer
    
    # Seuls les admins peuvent modifier
    if request.user.role != 'admin':
        return Response({
            'error': 'Permission refusée'
        }, status=status.HTTP_403_FORBIDDEN)
    
    with LogTimer() as timer:
        settings = SecuritySettings.get_settings()
        
        # Sauvegarder l'ancien état pour le log
        old_settings = {
            'session_timeout': settings.session_timeout,
            'max_login_attempts': settings.max_login_attempts,
            'password_min_length': settings.password_min_length,
        }
        
        serializer = SecuritySettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            # Mettre à jour updated_by
            settings.updated_by = request.user
            serializer.save()
            
            # Créer un log
            try:
                changes = []
                if 'session_timeout' in request.data:
                    changes.append(f"Timeout session: {old_settings['session_timeout']} → {settings.session_timeout} min")
                if 'max_login_attempts' in request.data:
                    changes.append(f"Tentatives max: {old_settings['max_login_attempts']} → {settings.max_login_attempts}")
                if 'password_min_length' in request.data:
                    changes.append(f"Longueur mot de passe: {old_settings['password_min_length']} → {settings.password_min_length}")
                
                create_log(
                    log_type='success',
                    message="Paramètres de sécurité modifiés",
                    details=", ".join(changes) if changes else "Paramètres de sécurité mis à jour",
                    user=request.user,
                    module='authentication',
                    request=request,
                    metadata={
                        'changes': changes,
                        'updated_fields': list(request.data.keys())
                    },
                    status_code=200,
                    response_time=timer.elapsed
                )
            except Exception:
                pass
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notification_preferences(request):
    """
    Récupérer les préférences de notifications de l'utilisateur connecté
    """
    from .models import NotificationPreferences
    from .serializers_notifications import NotificationPreferencesSerializer
    
    preferences = NotificationPreferences.get_or_create_for_user(request.user)
    serializer = NotificationPreferencesSerializer(preferences)
    
    return Response(serializer.data)


@api_view(['POST', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_notification_preferences(request):
    """
    Mettre à jour les préférences de notifications de l'utilisateur connecté
    """
    from .models import NotificationPreferences
    from .serializers_notifications import NotificationPreferencesSerializer
    from apps.logs.utils import create_log, LogTimer
    
    with LogTimer() as timer:
        preferences = NotificationPreferences.get_or_create_for_user(request.user)
        
        serializer = NotificationPreferencesSerializer(preferences, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Créer un log
            try:
                create_log(
                    log_type='info',
                    message="Préférences de notifications modifiées",
                    details=f"L'utilisateur {request.user.email} a mis à jour ses préférences de notifications",
                    user=request.user,
                    module='authentication',
                    request=request,
                    metadata={
                        'userId': request.user.id,
                        'updated_fields': list(request.data.keys())
                    },
                    status_code=200,
                    response_time=timer.elapsed
                )
            except Exception:
                pass
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour gérer les notifications utilisateur
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourne uniquement les notifications de l'utilisateur connecté"""
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marque une notification comme lue"""
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'status': 'success',
            'message': 'Notification marquée comme lue',
            'data': self.get_serializer(notification).data
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marque toutes les notifications comme lues"""
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'status': 'success',
            'message': f'{updated} notification(s) marquée(s) comme lue(s)',
            'count': updated
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Retourne le nombre de notifications non lues"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        
        return Response({
            'count': count
        })


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour consulter les sessions utilisateurs
    Accessible uniquement aux administrateurs
    """
    serializer_class = UserSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Seuls les admins peuvent voir toutes les sessions
        if self.request.user.role == 'admin':
            return UserSession.objects.select_related('user').all()
        # Les autres utilisateurs ne voient que leurs propres sessions
        return UserSession.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Retourne uniquement les sessions actives"""
        sessions = UserSession.get_active_sessions()
        
        # Filtrer selon le rôle
        if request.user.role != 'admin':
            sessions = sessions.filter(user=request.user)
        
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def connected_users(self, request):
        """Retourne la liste des utilisateurs actuellement connectés"""
        # Accessible uniquement aux admins
        if request.user.role != 'admin':
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer les sessions actives
        active_sessions = UserSession.get_active_sessions()
        
        # Grouper par utilisateur
        users_dict = {}
        for session in active_sessions:
            user_id = session.user.id
            if user_id not in users_dict:
                users_dict[user_id] = {
                    'user': session.user,
                    'sessions': []
                }
            users_dict[user_id]['sessions'].append(session)
        
        # Sérialiser les utilisateurs
        connected_users = []
        for user_data in users_dict.values():
            user = user_data['user']
            sessions = user_data['sessions']
            
            # Prendre la session la plus récente
            latest_session = max(sessions, key=lambda s: s.last_activity)
            
            connected_users.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'role_display': user.get_role_display(),
                'last_activity': user.last_activity,
                'session': {
                    'id': latest_session.id,
                    'ip_address': latest_session.ip_address,
                    'device_info': latest_session.device_info,
                    'login_time': latest_session.login_time,
                    'last_activity': latest_session.last_activity,
                    'is_online': latest_session.is_online
                },
                'total_active_sessions': len(sessions)
            })
        
        # Trier par dernière activité
        connected_users.sort(key=lambda u: u['last_activity'], reverse=True)
        
        return Response({
            'count': len(connected_users),
            'users': connected_users
        })
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Nettoyer les sessions inactives (admin seulement)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        count = UserSession.cleanup_old_sessions()
        
        return Response({
            'message': f'{count} session(s) inactives nettoyées'
        })

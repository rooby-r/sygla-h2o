from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from .models import Commande, PaiementCommande
from apps.clients.models import Client
from .serializers import CommandeSerializer, PaiementCommandeSerializer
from apps.logs.utils import create_log, LogTimer


class CommandeHistoriqueSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'historique des commandes d'un client
    """
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Commande
        fields = [
            'id', 
            'numero_commande', 
            'date_creation', 
            'date_livraison_effective',
            'statut', 
            'statut_display',
            'montant_total'
        ]


class CommandeSimpleSerializer(serializers.ModelSerializer):
    """
    Sérialiseur simple pour les commandes
    """
    client_name = serializers.CharField(source='client.raison_sociale', read_only=True)
    
    class Meta:
        model = Commande
        fields = ['id', 'numero_commande', 'client_name', 'date_creation', 'statut', 'montant_total', 'notes']


class CommandeListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des commandes
    """
    queryset = Commande.objects.all().select_related('client').prefetch_related('items__produit').order_by('-date_creation')
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        Créer une commande avec gestion d'erreur détaillée
        """
        import logging
        logger = logging.getLogger(__name__)
        
        with LogTimer() as timer:
            try:
                logger.info(f"Creating order with data: {request.data}")
                
                # Validation des données
                serializer = self.get_serializer(data=request.data)
                if not serializer.is_valid():
                    logger.error(f"Validation errors: {serializer.errors}")
                    return Response(
                        {"error": "Données invalides", "details": serializer.errors}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Sauvegarde avec le vendeur (utilisateur connecté)
                instance = serializer.save(vendeur=request.user)
                logger.info(f"Order created successfully with ID: {instance.id}")
                
                # Retourner les données complètes
                return_serializer = self.get_serializer(instance)
                response = Response(return_serializer.data, status=status.HTTP_201_CREATED)
                
                # Créer un log pour la création de commande
                if response.status_code == 201:
                    create_log(
                        log_type='success',
                        message=f"Nouvelle commande créée: {instance.numero_commande}",
                        details=f"Commande {instance.numero_commande} pour {instance.client.nom_commercial or instance.client.raison_sociale}",
                        user=request.user,
                        module='orders',
                        request=request,
                        metadata={
                            'orderId': instance.id,
                            'orderNumber': instance.numero_commande,
                            'clientName': instance.client.nom_commercial or instance.client.raison_sociale,
                            'itemsCount': instance.items.count(),
                            'totalAmount': float(instance.montant_total),
                            'deliveryType': instance.type_livraison,
                            'status': instance.statut
                        },
                        status_code=201,
                        response_time=timer.elapsed
                    )
                
                return response
                
            except Exception as e:
                logger.error(f"Error creating order: {str(e)}", exc_info=True)
                response = Response(
                    {"error": f"Erreur lors de la création: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
                # Log de l'erreur
                create_log(
                    log_type='error',
                    message="Erreur lors de la création d'une commande",
                    details=str(e),
                    user=request.user,
                    module='orders',
                    request=request,
                    status_code=500,
                    response_time=timer.elapsed
                )
                
                return response


class CommandeRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, mettre à jour et supprimer une commande
    """
    queryset = Commande.objects.all().select_related('client').prefetch_related('items__produit')
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):
        """
        Suppression d'une commande - Interdit si validée ou au-delà
        """
        instance = self.get_object()
        
        # Vérifier si la commande peut être supprimée
        # Une fois validée, la commande ne peut plus être supprimée
        if instance.statut in ['validee', 'en_preparation', 'en_livraison', 'livree', 'annulee']:
            return Response(
                {"error": f"Impossible de supprimer une commande {instance.get_statut_display().lower()}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer un log avant suppression
        create_log(
            log_type='warning',
            message=f"Commande supprimée: {instance.numero_commande}",
            details=f"Commande {instance.numero_commande} supprimée par {request.user.username}",
            user=request.user,
            module='orders',
            request=request,
            metadata={
                'orderId': instance.id,
                'orderNumber': instance.numero_commande,
                'clientName': instance.client.nom_commercial or instance.client.raison_sociale,
                'totalAmount': float(instance.montant_total),
                'status': instance.statut
            },
            status_code=204
        )
        
        return super().destroy(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Mise à jour avec logs de débogage et recalcul des totaux
        Interdit la modification des données si la commande est validée ou au-delà
        MAIS autorise le changement de statut (workflow)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔄 Tentative de mise à jour commande {kwargs.get('pk')}")
        logger.info(f"📝 Données reçues: {request.data}")
        
        with LogTimer() as timer:
            try:
                instance = self.get_object()
                
                # Vérifier si c'est uniquement un changement de statut
                is_status_change_only = (
                    len(request.data) == 1 and 
                    'statut' in request.data
                )
                
                # Si la commande est validée ou au-delà
                if instance.statut in ['validee', 'en_preparation', 'en_livraison', 'livree', 'annulee']:
                    # Permettre UNIQUEMENT les changements de statut (workflow)
                    if not is_status_change_only:
                        logger.warning(f"⛔ Tentative de modification des données d'une commande {instance.statut}: {instance.numero_commande}")
                        return Response(
                            {"error": f"Impossible de modifier les données d'une commande {instance.get_statut_display().lower()}. Seul le changement de statut est autorisé."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Vérifier le workflow de statut
                    new_status = request.data.get('statut')
                    valid_transitions = {
                        'en_attente': ['validee', 'annulee'],
                        'validee': ['en_preparation', 'en_livraison'],
                        'en_preparation': ['en_livraison'],
                        'en_livraison': ['livree'],
                        'livree': [],  # Pas de transition depuis livree
                        'annulee': []  # Pas de transition depuis annulee
                    }
                    
                    allowed = valid_transitions.get(instance.statut, [])
                    if new_status not in allowed:
                        logger.warning(f"⛔ Transition de statut invalide: {instance.statut} → {new_status}")
                        return Response(
                            {"error": f"Impossible de passer du statut '{instance.get_statut_display()}' vers '{new_status}'"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Le gestionnaire de stock ne peut pas marquer comme livrée
                    if new_status == 'livree' and request.user.role == 'stock':
                        logger.warning(f"⛔ Le gestionnaire de stock ne peut pas marquer comme livrée")
                        return Response(
                            {"error": "Seul un livreur ou un administrateur peut marquer une commande comme livrée"},
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    # BLOCAGE TRANSITION EN_LIVRAISON: Vérifier si l'échéance est passée et paiement non complet
                    if new_status == 'en_livraison':
                        peut_livrer, message_livraison = instance.peut_passer_en_livraison()
                        if not peut_livrer:
                            logger.warning(f"⛔ Transition vers en_livraison bloquée: {message_livraison}")
                            # Calculer les détails pour le frontend
                            penalite = float(instance.calculer_penalite())
                            return Response(
                                {
                                    "error": message_livraison,
                                    "montant_restant": float(instance.montant_restant),
                                    "penalite": penalite,
                                    "montant_total_a_payer": float(instance.montant_restant) + penalite,
                                    "date_echeance": str(instance.date_echeance) if instance.date_echeance else None,
                                    "blocage_echeance": True
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    
                    # Le vendeur ne peut pas changer les statuts (sauf annuler une commande en attente)
                    if request.user.role == 'vendeur':
                        if not (instance.statut == 'en_attente' and new_status == 'annulee'):
                            logger.warning(f"⛔ Le vendeur ne peut pas changer le statut de {instance.statut} vers {new_status}")
                            return Response(
                                {"error": "Les vendeurs ne peuvent qu'annuler les commandes en attente"},
                                status=status.HTTP_403_FORBIDDEN
                            )
                    
                    logger.info(f"✅ Changement de statut autorisé: {instance.statut} → {new_status}")
                
                partial = kwargs.pop('partial', False)
                old_status = instance.statut
                old_total = instance.montant_total
                
                logger.info(f"🔍 Commande trouvée: {instance.numero_commande}, statut: {instance.statut}")
                logger.info(f"💰 Montant actuel avant mise à jour: {instance.montant_total} HTG")
                
                serializer = self.get_serializer(instance, data=request.data, partial=partial)
                if not serializer.is_valid():
                    logger.error(f"❌ Erreurs de validation: {serializer.errors}")
                    return Response(
                        {"error": "Données invalides", "details": serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                self.perform_update(serializer)
                
                # IMPORTANT: Recalculer les totaux après la mise à jour
                instance.refresh_from_db()
                
                # Mettre à jour les dates selon le changement de statut
                from django.utils import timezone
                new_status = instance.statut
                
                if new_status != old_status:
                    logger.info(f"📅 Changement de statut détecté: {old_status} → {new_status}")
                    
                    if new_status == 'validee' and not instance.date_validation:
                        instance.date_validation = timezone.now()
                        logger.info(f"📅 Date de validation mise à jour: {instance.date_validation}")
                    
                    if new_status == 'livree' and not instance.date_livraison_effective:
                        instance.date_livraison_effective = timezone.now()
                        logger.info(f"📅 Date de livraison effective mise à jour: {instance.date_livraison_effective}")
                    
                    # Assigner le livreur si en livraison et utilisateur est livreur
                    if new_status == 'en_livraison' and request.user.role == 'livreur':
                        if not instance.livreur:
                            instance.livreur = request.user.get_full_name() or request.user.username
                            logger.info(f"🚚 Livreur assigné: {instance.livreur}")
                
                logger.info(f"🔄 Recalcul des totaux en cours...")
                # IMPORTANT: Ne pas recalculer les frais de livraison (ils ont été définis manuellement)
                instance.calculer_montant_total(recalculer_frais_livraison=False)
                instance.save()
                
                logger.info(f"💰 Nouveau montant après recalcul: {instance.montant_total} HTG")
                logger.info(f"📊 Items dans la commande: {instance.items.count()}")
                for item in instance.items.all():
                    logger.info(f"  - {item.produit.nom}: {item.quantite} x {item.prix_unitaire} = {item.sous_total} HTG")
                
                logger.info(f"✅ Commande mise à jour avec succès")
                
                # Retourner les données mises à jour
                updated_serializer = self.get_serializer(instance)
                response = Response(updated_serializer.data)
                
                # Créer un log pour la modification
                if response.status_code == 200:
                    create_log(
                        log_type='success',
                        message=f"Commande modifiée: {instance.numero_commande}",
                        details=f"Commande {instance.numero_commande} mise à jour",
                        user=request.user,
                        module='orders',
                        request=request,
                        metadata={
                            'orderId': instance.id,
                            'orderNumber': instance.numero_commande,
                            'previousStatus': old_status,
                            'newStatus': instance.statut,
                            'previousTotal': float(old_total),
                            'newTotal': float(instance.montant_total),
                            'itemsCount': instance.items.count()
                        },
                        status_code=200,
                        response_time=timer.elapsed
                    )
                
                return response
                
            except Exception as e:
                logger.error(f"❌ Erreur lors de la mise à jour: {str(e)}", exc_info=True)
                response = Response(
                    {"error": f"Erreur lors de la mise à jour: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
                # Log de l'erreur
                create_log(
                    log_type='error',
                    message="Erreur lors de la modification d'une commande",
                    details=str(e),
                    user=request.user,
                    module='orders',
                    request=request,
                    status_code=500,
                    response_time=timer.elapsed
                )
                
                return response


class ClientCommandeHistoriqueView(generics.ListAPIView):
    """
    Vue pour récupérer l'historique des commandes d'un client
    """
    serializer_class = CommandeHistoriqueSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        client_id = self.kwargs['client_id']
        # Vérifier que le client existe
        get_object_or_404(Client, id=client_id)
        
        return Commande.objects.filter(
            client_id=client_id
        ).order_by('-date_creation')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def valider_commande(request, pk):
    """
    Endpoint pour valider une commande
    """
    with LogTimer() as timer:
        try:
            commande = get_object_or_404(Commande, pk=pk)
            
            # Log pour debug
            print(f"🔍 Tentative de validation commande {commande.id}")
            print(f"🔍 Status actuel: {commande.statut}")
            print(f"🔍 Type livraison: {commande.type_livraison}")
            print(f"🔍 Date livraison: {commande.date_livraison_prevue}")
            print(f"🔍 Nombre d'items: {commande.items.count()}")
            
            # Vérifier que la commande peut être validée
            peut_valider, message = commande.peut_etre_validee()
            if not peut_valider:
                print(f"❌ Validation impossible: {message}")
                response = Response(
                    {'error': message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
                # Log de l'échec de validation
                create_log(
                    log_type='warning',
                    message=f"Validation refusée: {commande.numero_commande}",
                    details=message,
                    user=request.user,
                    module='orders',
                    request=request,
                    metadata={
                        'orderId': commande.id,
                        'orderNumber': commande.numero_commande,
                        'reason': message
                    },
                    status_code=400,
                    response_time=timer.elapsed
                )
                
                return response
            
            # Valider la commande
            print("🔄 Début de la validation...")
            commande.valider(utilisateur=request.user)
            print("✅ Validation terminée")
            
            # Retourner la commande mise à jour
            serializer = CommandeSerializer(commande)
            response = Response({
                'message': 'Commande validée avec succès',
                'commande': serializer.data
            }, status=status.HTTP_200_OK)
            
            # Créer un log pour la validation
            create_log(
                log_type='success',
                message=f"Commande validée: {commande.numero_commande}",
                details=f"Commande {commande.numero_commande} validée par {request.user.get_full_name() or request.user.email}",
                user=request.user,
                module='orders',
                request=request,
                metadata={
                    'orderId': commande.id,
                    'orderNumber': commande.numero_commande,
                    'clientName': commande.client.nom_commercial or commande.client.raison_sociale,
                    'totalAmount': float(commande.montant_total),
                    'deliveryType': commande.type_livraison
                },
                status_code=200,
                response_time=timer.elapsed
            )
            
            return response
            
        except ValueError as e:
            print(f"❌ ValueError: {str(e)}")
            response = Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
            # Log de l'erreur
            create_log(
                log_type='error',
                message="Erreur de validation de commande",
                details=str(e),
                user=request.user,
                module='orders',
                request=request,
                status_code=400,
                response_time=timer.elapsed
            )
            
            return response
            
        except Exception as e:
            print(f"❌ Exception générale: {str(e)}")
            import traceback
            traceback.print_exc()
            response = Response(
                {'error': f'Erreur lors de la validation: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            # Log de l'erreur
            create_log(
                log_type='error',
                message="Erreur lors de la validation d'une commande",
                details=str(e),
                user=request.user,
                module='orders',
                request=request,
                status_code=500,
                response_time=timer.elapsed
            )
            
            return response


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ajouter_paiement_commande(request, commande_id):
    """
    Ajouter un paiement à une commande
    Règles:
    - Minimum 60% du montant total au premier paiement
    - Date d'échéance = 1 jour avant livraison
    - Si paiement après échéance: pénalité de 1.5% du montant restant
    """
    timer = LogTimer()
    
    try:
        commande = get_object_or_404(Commande, id=commande_id)
        
        # Vérifier que la commande n'est pas annulée
        if commande.statut == 'annulee':
            return Response(
                {'error': 'Impossible d\'ajouter un paiement à une commande annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que la commande n'est pas déjà payée totalement
        if commande.statut_paiement == 'paye':
            return Response(
                {'error': 'La commande est déjà payée totalement'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que la commande n'est pas convertie en vente
        if commande.convertie_en_vente:
            return Response(
                {'error': 'La commande a déjà été convertie en vente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Valider le montant
        montant = float(request.data.get('montant', 0))
        if montant <= 0:
            return Response(
                {'error': 'Le montant doit être supérieur à 0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculer la pénalité si applicable (après échéance)
        penalite = float(commande.calculer_penalite())
        montant_total_restant = float(commande.montant_restant) + penalite
        
        # RÈGLE 1: Minimum 60% au premier paiement
        montant_minimum = float(commande.montant_total) * 0.60
        montant_deja_paye = float(commande.montant_paye)
        
        if montant_deja_paye == 0:
            # C'est le premier paiement - vérifier le minimum 60%
            if montant < montant_minimum:
                return Response(
                    {
                        'error': f'Le premier paiement doit être d\'au moins 60% du montant total ({montant_minimum:.2f} HTG). Montant proposé: {montant:.2f} HTG',
                        'montant_minimum': montant_minimum,
                        'pourcentage_requis': 60
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # RÈGLE 2: Vérifier si paiement après échéance - inclure la pénalité
        include_penalite = request.data.get('include_penalite', False)
        
        if commande.est_apres_echeance() and commande.montant_restant > 0:
            if not include_penalite:
                return Response(
                    {
                        'error': 'La date d\'échéance est passée. Une pénalité de 1.5% s\'applique.',
                        'montant_restant': float(commande.montant_restant),
                        'penalite': penalite,
                        'montant_total_a_payer': montant_total_restant,
                        'date_echeance': str(commande.date_echeance) if commande.date_echeance else None,
                        'require_penalite': True
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Si l'utilisateur a accepté la pénalité, vérifier que le montant couvre tout
            if montant < montant_total_restant:
                return Response(
                    {
                        'error': f'Le montant doit couvrir le solde restant plus la pénalité ({montant_total_restant:.2f} HTG)',
                        'montant_restant': float(commande.montant_restant),
                        'penalite': penalite,
                        'montant_total_a_payer': montant_total_restant
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Pas de pénalité - vérification normale
            if montant > float(commande.montant_restant):
                return Response(
                    {'error': f'Le montant dépasse le montant restant ({commande.montant_restant} HTG)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Créer le paiement (montant principal seulement, la pénalité est séparée)
        montant_paiement = min(montant, float(commande.montant_restant))
        montant_penalite_paye = montant - montant_paiement if include_penalite and penalite > 0 else 0
        
        notes_paiement = request.data.get('notes', '')
        if include_penalite and penalite > 0:
            notes_paiement = f"Inclut pénalité de retard: {montant_penalite_paye:.2f} HTG. {notes_paiement}"
        
        paiement_data = {
            'commande': commande.id,
            'montant': montant_paiement,
            'methode': request.data.get('methode', 'especes'),
            'reference': request.data.get('reference', ''),
            'notes': notes_paiement,
            'recu_par': request.user.id
        }
        
        serializer = PaiementCommandeSerializer(data=paiement_data)
        if serializer.is_valid():
            paiement = serializer.save()
            
            # Enregistrer la pénalité payée
            if include_penalite and montant_penalite_paye > 0:
                from decimal import Decimal
                commande.montant_penalite = Decimal(str(montant_penalite_paye))
                commande.save()
            
            # Recharger la commande pour avoir les montants à jour
            commande.refresh_from_db()
            
            # Log de succès
            create_log(
                log_type='info',
                message=f"Paiement de {montant} HTG ajouté à la commande {commande.numero_commande}",
                details=f"Méthode: {paiement.methode}, Nouveau statut: {commande.statut_paiement}" + (f", Pénalité: {montant_penalite_paye:.2f} HTG" if montant_penalite_paye > 0 else ""),
                user=request.user,
                module='orders',
                request=request,
                status_code=201,
                response_time=timer.elapsed
            )
            
            # Retourner les informations de la commande mise à jour
            commande_serializer = CommandeSerializer(commande)
            return Response({
                'message': 'Paiement ajouté avec succès',
                'paiement': serializer.data,
                'commande': commande_serializer.data,
                'convertie_en_vente': commande.convertie_en_vente,
                'penalite_payee': montant_penalite_paye if include_penalite else 0
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        # Log de l'erreur
        create_log(
            log_type='error',
            message=f"Erreur lors de l'ajout d'un paiement à la commande {commande_id}",
            details=str(e),
            user=request.user,
            module='orders',
            request=request,
            status_code=500,
            response_time=timer.elapsed
        )
        
        return Response(
            {'error': f'Erreur lors de l\'ajout du paiement: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
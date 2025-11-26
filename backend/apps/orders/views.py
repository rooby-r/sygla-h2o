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
    
    def update(self, request, *args, **kwargs):
        """
        Mise à jour avec logs de débogage et recalcul des totaux
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔄 Tentative de mise à jour commande {kwargs.get('pk')}")
        logger.info(f"📝 Données reçues: {request.data}")
        
        with LogTimer() as timer:
            try:
                partial = kwargs.pop('partial', False)
                instance = self.get_object()
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
                logger.info(f"🔄 Recalcul des totaux en cours...")
                instance.calculer_montant_total()
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
    """
    timer = LogTimer()
    
    try:
        commande = get_object_or_404(Commande, id=commande_id)
        
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
        
        if montant > float(commande.montant_restant):
            return Response(
                {'error': f'Le montant dépasse le montant restant ({commande.montant_restant} HTG)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le paiement
        paiement_data = {
            'commande': commande.id,
            'montant': montant,
            'methode': request.data.get('methode', 'especes'),
            'reference': request.data.get('reference', ''),
            'notes': request.data.get('notes', ''),
            'recu_par': request.user.id
        }
        
        serializer = PaiementCommandeSerializer(data=paiement_data)
        if serializer.is_valid():
            paiement = serializer.save()
            
            # Recharger la commande pour avoir les montants à jour
            commande.refresh_from_db()
            
            # Log de succès
            create_log(
                log_type='info',
                message=f"Paiement de {montant} HTG ajouté à la commande {commande.numero_commande}",
                details=f"Méthode: {paiement.methode}, Nouveau statut: {commande.statut_paiement}",
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
                'convertie_en_vente': commande.convertie_en_vente
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
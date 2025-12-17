from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Produit, MouvementStock
from .serializers import ProduitSerializer, MouvementStockSerializer, MouvementStockCreateSerializer
from apps.logs.utils import create_log, LogTimer
from apps.authentication.notification_service import NotificationService, check_and_notify_low_stock


class ProduitListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des produits
    """
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        Créer un produit avec logging
        """
        with LogTimer() as timer:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            response = Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
            # Créer un log pour la création de produit
            if response.status_code == 201:
                produit = serializer.instance
                create_log(
                    log_type='success',
                    message=f"Nouveau produit créé: {produit.nom}",
                    details=f"Produit {produit.nom} ajouté au catalogue",
                    user=request.user,
                    module='products',
                    request=request,
                    metadata={
                        'productId': produit.id,
                        'productName': produit.nom,
                        'price': float(produit.prix_unitaire),
                        'stockQuantity': produit.stock_actuel,
                        'type': produit.type_produit
                    },
                    status_code=201,
                    response_time=timer.elapsed
                )
                
                # Envoyer notification aux autres utilisateurs
                try:
                    NotificationService.notify_product_created(produit, created_by=request.user)
                except Exception as e:
                    print(f"Erreur notification produit: {e}")
            
            return response


class ProduitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier et supprimer un produit
    """
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """
        Mettre à jour un produit avec logging et création de mouvement de stock si changement
        """
        with LogTimer() as timer:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            old_name = instance.nom
            old_price = instance.prix_unitaire
            old_stock = instance.stock_actuel
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # Recharger l'instance pour avoir les nouvelles valeurs
            instance.refresh_from_db()
            new_stock = instance.stock_actuel
            
            # Créer un mouvement de stock si le stock a changé
            if old_stock != new_stock:
                difference = new_stock - old_stock
                type_mouvement = 'entree' if difference > 0 else 'sortie'
                
                MouvementStock.objects.create(
                    produit=instance,
                    type_mouvement=type_mouvement,
                    quantite=abs(difference),
                    stock_avant=old_stock,
                    stock_apres=new_stock,
                    motif='Modification du produit',
                    utilisateur=request.user
                )
            
            response = Response(serializer.data)
            
            # Créer un log pour la modification
            if response.status_code == 200:
                create_log(
                    log_type='success',
                    message=f"Produit modifié: {instance.nom}",
                    details=f"Produit {instance.nom} mis à jour",
                    user=request.user,
                    module='products',
                    request=request,
                    metadata={
                        'productId': instance.id,
                        'productName': instance.nom,
                        'previousName': old_name,
                        'previousPrice': float(old_price),
                        'newPrice': float(instance.prix_unitaire),
                        'previousStock': old_stock,
                        'newStock': new_stock
                    },
                    status_code=200,
                    response_time=timer.elapsed
                )
            
            return response
    
    def destroy(self, request, *args, **kwargs):
        """
        Supprimer un produit avec logging
        """
        with LogTimer() as timer:
            instance = self.get_object()
            product_name = instance.nom
            product_id = instance.id
            product_price = instance.prix_unitaire
            
            # Vérifier si le produit est utilisé dans des commandes
            from apps.orders.models import ItemCommande
            items_count = ItemCommande.objects.filter(produit=instance).count()
            if items_count > 0:
                return Response(
                    {'error': f'Impossible de supprimer ce produit. Il est utilisé dans {items_count} commande(s).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                self.perform_destroy(instance)
            except Exception as e:
                return Response(
                    {'error': f'Impossible de supprimer ce produit: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            response = Response(status=status.HTTP_204_NO_CONTENT)
            
            # Créer un log pour la suppression
            if response.status_code == 204:
                create_log(
                    log_type='warning',
                    message=f"Produit supprimé: {product_name}",
                    details=f"Le produit {product_name} a été supprimé du catalogue",
                    user=request.user,
                    module='products',
                    request=request,
                    metadata={
                        'productId': product_id,
                        'productName': product_name,
                        'price': float(product_price)
                    },
                    status_code=204,
                    response_time=timer.elapsed
                )
            
            return response


class MouvementStockListView(generics.ListAPIView):
    """
    Vue pour lister les mouvements de stock
    """
    queryset = MouvementStock.objects.all().select_related('produit', 'utilisateur')
    serializer_class = MouvementStockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['produit', 'type_mouvement']
    search_fields = ['produit__nom', 'motif', 'numero_document']
    ordering_fields = ['date_creation', 'quantite']
    ordering = ['-date_creation']


class MouvementStockCreateView(generics.CreateAPIView):
    """
    Vue pour créer un mouvement de stock
    """
    queryset = MouvementStock.objects.all()
    serializer_class = MouvementStockCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        with LogTimer() as timer:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            mouvement = serializer.save()
            
            # Créer un log pour le mouvement de stock
            create_log(
                log_type='success' if mouvement.type_mouvement == 'entree' else 'info',
                message=f"Mouvement de stock: {mouvement.get_type_mouvement_display()}",
                details=f"{mouvement.produit.nom} - {mouvement.quantite} unités - {mouvement.motif}",
                user=request.user,
                module='products',
                request=request,
                metadata={
                    'mouvementId': mouvement.id,
                    'productId': mouvement.produit.id,
                    'productName': mouvement.produit.nom,
                    'movementType': mouvement.type_mouvement,
                    'quantity': mouvement.quantite,
                    'stockBefore': mouvement.stock_avant,
                    'stockAfter': mouvement.stock_apres,
                    'reason': mouvement.motif
                },
                status_code=201,
                response_time=timer.elapsed
            )
            
            # Retourner avec le serializer de lecture
            response_serializer = MouvementStockSerializer(mouvement)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MouvementStockByProductView(generics.ListAPIView):
    """
    Vue pour lister les mouvements de stock d'un produit spécifique
    """
    serializer_class = MouvementStockSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Désactiver la pagination pour afficher tous les mouvements
    
    def get_queryset(self):
        produit_id = self.kwargs.get('produit_id')
        return MouvementStock.objects.filter(produit_id=produit_id).select_related('produit', 'utilisateur').order_by('-date_creation')


class StockAjustementView(APIView):
    """
    Vue pour ajuster le stock d'un produit
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            produit = Produit.objects.get(pk=pk)
        except Produit.DoesNotExist:
            return Response(
                {'error': 'Produit non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        nouveau_stock = request.data.get('nouveau_stock')
        motif = request.data.get('motif', 'Ajustement de stock')
        
        if nouveau_stock is None:
            return Response(
                {'error': 'nouveau_stock est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            nouveau_stock = int(nouveau_stock)
            if nouveau_stock < 0:
                raise ValueError("Le stock ne peut pas être négatif")
        except (ValueError, TypeError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stock_avant = produit.stock_actuel
        difference = nouveau_stock - stock_avant
        
        # Créer le mouvement
        mouvement = MouvementStock.objects.create(
            produit=produit,
            type_mouvement='ajustement',
            quantite=abs(difference),
            stock_avant=stock_avant,
            stock_apres=nouveau_stock,
            motif=motif,
            utilisateur=request.user
        )
        
        # Mettre à jour le stock
        produit.stock_actuel = nouveau_stock
        produit.save()
        
        # Log
        create_log(
            log_type='info',
            message=f"Ajustement de stock: {produit.nom}",
            details=f"Stock ajusté de {stock_avant} à {nouveau_stock} - {motif}",
            user=request.user,
            module='products',
            request=request,
            metadata={
                'productId': produit.id,
                'productName': produit.nom,
                'previousStock': stock_avant,
                'newStock': nouveau_stock,
                'difference': difference,
                'reason': motif
            }
        )
        
        return Response({
            'message': 'Stock ajusté avec succès',
            'produit': ProduitSerializer(produit).data,
            'mouvement': MouvementStockSerializer(mouvement).data
        })
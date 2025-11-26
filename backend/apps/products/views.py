from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Produit
from .serializers import ProduitSerializer
from apps.logs.utils import create_log, LogTimer


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
        Mettre à jour un produit avec logging
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
                        'newStock': instance.stock_actuel
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
            
            self.perform_destroy(instance)
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
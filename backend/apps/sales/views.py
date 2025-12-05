from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q
from decimal import Decimal
from .models import Vente, LigneVente, Paiement
from .serializers import (
    VenteSerializer, VenteListSerializer,
    LigneVenteSerializer, PaiementSerializer
)
from apps.logs.utils import create_log


class VenteViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les ventes (uniquement les transactions payées)
    Les ventes sont prioritaires car elles sont totalement payées
    """
    queryset = Vente.objects.filter(
        statut_paiement='paye'
    ).select_related(
        'client', 'vendeur'
    ).prefetch_related('lignes', 'paiements')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'vendeur', 'statut_paiement']
    search_fields = ['numero_vente', 'client__nom', 'notes']
    ordering_fields = ['date_vente', 'montant_total', 'created_at']
    # Ventes prioritaires: les plus récentes en premier (statut payé garanti)
    ordering = ['-created_at', '-date_vente']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VenteListSerializer
        return VenteSerializer
    
    def perform_create(self, serializer):
        vente = serializer.save(vendeur=self.request.user)
        
        # Log pour debug
        print(f"\n🔍 DEBUG: Vente créée - Numéro: {vente.numero_vente}")
        print(f"🔍 DEBUG: Type livraison: {vente.type_livraison}")
        print(f"🔍 DEBUG: Statut paiement: {vente.statut_paiement}")
        
        # Créer automatiquement une livraison pour TOUTES les ventes (domicile ET magasin)
        from apps.orders.models import Commande, ItemCommande
        from apps.authentication.models import User, Notification
        from django.utils import timezone
        
        try:
            # Déterminer le statut selon le type de livraison
            # Toutes les ventes payées commencent en préparation
            if vente.type_livraison == 'livraison_domicile':
                statut = 'en_preparation'  # EN PREPARATION - Livraison à domicile (sera passée en livraison après)
                notes_prefix = "🎯 LIVRAISON PRIORITAIRE (À DOMICILE)"
                print(f"🚚 DEBUG: Création livraison À DOMICILE pour vente {vente.numero_vente}")
            else:  # retrait_magasin
                statut = 'en_preparation'  # EN PREPARATION - Retrait en magasin
                notes_prefix = "📦 RETRAIT EN MAGASIN"
                print(f"🏪 DEBUG: Création retrait EN MAGASIN pour vente {vente.numero_vente}")
            
            # Créer une commande pour la livraison/retrait
            commande = Commande.objects.create(
                client=vente.client,
                vendeur=vente.vendeur,
                montant_total=vente.montant_total,
                montant_paye=vente.montant_paye,
                montant_restant=Decimal('0.00'),
                statut_paiement='paye',
                statut=statut,
                type_livraison=vente.type_livraison,
                frais_livraison=vente.frais_livraison or Decimal('0.00'),
                date_livraison_prevue=vente.date_livraison_prevue or timezone.now().date(),
                notes=f"{notes_prefix} - Vente {vente.numero_vente} - 100% payée",
                vente_associee=vente,
                convertie_en_vente=True
            )
            print(f"✅ DEBUG: Commande créée - ID: {commande.id}, Numéro: {commande.numero_commande}, Statut: {statut.upper()}")
            
            # Copier les lignes de la vente vers la commande
            for ligne_vente in vente.lignes.all():
                ItemCommande.objects.create(
                    commande=commande,
                    produit=ligne_vente.produit,
                    quantite=ligne_vente.quantite,
                    prix_unitaire=ligne_vente.prix_unitaire
                )
            print(f"✅ DEBUG: {vente.lignes.count()} lignes copiées vers la commande")
            
            # Notifier les livreurs SEULEMENT pour livraison à domicile
            if vente.type_livraison == 'livraison_domicile':
                from apps.authentication.models import Notification as NotificationModel
                livreurs = User.objects.filter(role='livreur', is_active=True)
                print(f"✅ DEBUG: {livreurs.count()} livreurs trouvés")
                for livreur in livreurs:
                    NotificationModel.objects.create(
                        utilisateur=livreur,
                        titre="🚚 Nouvelle livraison à préparer",
                        message=f"Vente {vente.numero_vente} avec livraison à domicile. Client: {vente.client.nom_commercial}. Montant: {vente.montant_total} HTG.",
                        type='livraison',
                        lien=f'/deliveries/{commande.id}'
                    )
                print(f"✅ DEBUG: Notifications envoyées à {livreurs.count()} livreurs")
            
            print(f"✅ DEBUG: Livraison/Retrait créé avec succès dans le module Livraisons!\n")
            
        except Exception as e:
            print(f"❌ DEBUG: Erreur création livraison: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # Créer un log
        try:
            create_log(
                log_type='success',
                message=f"Nouvelle vente créée: {vente.numero_vente}",
                details=f"Vente pour {vente.client.nom_commercial} - Montant: {vente.montant_total} HTG" + 
                       (f" - Livraison prioritaire créée" if vente.type_livraison == 'livraison_domicile' else ""),
                user=self.request.user,
                module='sales',
                request=self.request,
                metadata={
                    'vente_id': vente.id,
                    'numero_vente': vente.numero_vente,
                    'client_id': vente.client.id,
                    'montant': float(vente.montant_total),
                    'livraison_prioritaire': vente.type_livraison == 'livraison_domicile'
                }
            )
        except Exception:
            pass
    
    def perform_update(self, serializer):
        vente = serializer.save()
        
        # Créer un log
        try:
            create_log(
                log_type='info',
                message=f"Vente modifiée: {vente.numero_vente}",
                details=f"Vente pour {vente.client.nom_commercial} mise à jour",
                user=self.request.user,
                module='sales',
                request=self.request,
                metadata={
                    'vente_id': vente.id,
                    'numero_vente': vente.numero_vente
                }
            )
        except Exception:
            pass
    
    def perform_destroy(self, instance):
        numero = instance.numero_vente
        instance.delete()
        
        # Créer un log
        try:
            create_log(
                log_type='warning',
                message=f"Vente supprimée: {numero}",
                details=f"La vente {numero} a été supprimée",
                user=self.request.user,
                module='sales',
                request=self.request,
                metadata={'numero_vente': numero}
            )
        except Exception:
            pass
    
    @action(detail=True, methods=['post'])
    def ajouter_paiement(self, request, pk=None):
        """Ajouter un paiement à une vente"""
        vente = self.get_object()
        
        # Vérifier que le montant ne dépasse pas le montant restant
        montant = Decimal(str(request.data.get('montant', 0)))
        if montant > vente.montant_restant:
            return Response(
                {
                    'error': 'Montant invalide',
                    'detail': f'Le montant du paiement ({montant} HTG) dépasse le montant restant ({vente.montant_restant} HTG)'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PaiementSerializer(data=request.data)
        if serializer.is_valid():
            paiement = serializer.save(
                vente=vente,
                recu_par=request.user
            )
            
            # Créer un log
            try:
                create_log(
                    log_type='success',
                    message=f"Paiement enregistré pour vente {vente.numero_vente}",
                    details=f"Montant: {paiement.montant} HTG - Méthode: {paiement.get_methode_display()}",
                    user=request.user,
                    module='sales',
                    request=request,
                    metadata={
                        'vente_id': vente.id,
                        'paiement_id': paiement.id,
                        'montant': float(paiement.montant)
                    }
                )
            except Exception:
                pass
            
            return Response(
                VenteSerializer(vente).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """
        Obtenir des statistiques sur les ventes
        CHIFFRE D'AFFAIRES = Montant réellement encaissé (ventes + paiements partiels commandes non converties)
        """
        from apps.orders.models import Commande
        
        ventes = self.filter_queryset(self.get_queryset())
        
        # Statistiques des ventes (100% payées)
        ventes_stats = {
            'total_ventes': ventes.count(),
            'montant_total_ventes': ventes.aggregate(Sum('montant_total'))['montant_total__sum'] or 0,
            'montant_paye_ventes': ventes.aggregate(Sum('montant_paye'))['montant_paye__sum'] or 0,
        }
        
        # Commandes NON CONVERTIES EN VENTES et NON ANNULÉES (pour éviter double comptage)
        commandes_actives = Commande.objects.filter(convertie_en_vente=False).exclude(statut='annulee')
        
        # Total des commandes (pour CA total potentiel)
        commandes_total = commandes_actives.aggregate(Sum('montant_total'))['montant_total__sum'] or 0
        
        # Paiements déjà encaissés sur les commandes (CA réalisé)
        commandes_paye = commandes_actives.aggregate(Sum('montant_paye'))['montant_paye__sum'] or 0
        
        # Montant restant à encaisser sur les commandes
        commandes_restant = commandes_actives.aggregate(Sum('montant_restant'))['montant_restant__sum'] or 0
        
        # CHIFFRE D'AFFAIRES = Argent réellement encaissé (ventes + paiements partiels commandes)
        chiffre_affaires = float(ventes_stats['montant_paye_ventes']) + float(commandes_paye)
        
        # CA TOTAL POTENTIEL = Ventes + Commandes (incluant ce qui reste à payer)
        ca_total_potentiel = float(ventes_stats['montant_total_ventes']) + float(commandes_total)
        
        stats = {
            'total_ventes': ventes_stats['total_ventes'],
            'chiffre_affaires_encaisse': chiffre_affaires,  # Argent réellement encaissé
            'chiffre_affaires_total_potentiel': ca_total_potentiel,  # Incluant montants restants
            'montant_paye_ventes': float(ventes_stats['montant_paye_ventes']),
            'montant_paye_commandes': float(commandes_paye),
            'montant_restant_commandes': float(commandes_restant),
            'montant_total_commandes': float(commandes_total),
            'nombre_commandes_actives': commandes_actives.count(),
        }
        
        return Response(stats)


class PaiementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les paiements
    """
    queryset = Paiement.objects.all().select_related('vente', 'recu_par')
    serializer_class = PaiementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vente', 'methode']
    search_fields = ['reference', 'vente__numero_vente']
    ordering_fields = ['date_paiement', 'montant']
    ordering = ['-date_paiement']
    
    def perform_create(self, serializer):
        serializer.save(recu_par=self.request.user)

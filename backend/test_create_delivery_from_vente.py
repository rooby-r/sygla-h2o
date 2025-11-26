import os
import sys
import django

# Configuration Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sygla_h2o.settings')
django.setup()

from apps.sales.models import Vente
from apps.orders.models import Commande, ItemCommande
from apps.authentication.models import User
from django.utils import timezone
from decimal import Decimal

print("=" * 80)
print("TEST CRÉATION LIVRAISON DEPUIS VENTE")
print("=" * 80)

# Prendre la dernière vente créée
derniere_vente = Vente.objects.filter(statut_paiement='paye').order_by('-created_at').first()

if not derniere_vente:
    print("❌ Aucune vente trouvée")
    sys.exit(1)

print(f"\n📊 Vente sélectionnée:")
print(f"  - ID: {derniere_vente.id}")
print(f"  - Numéro: {derniere_vente.numero_vente}")
print(f"  - Client: {derniere_vente.client.nom}")
print(f"  - Type livraison: {derniere_vente.type_livraison}")
print(f"  - Montant: {derniere_vente.montant_total} HTG")

# Vérifier si une commande existe déjà
commande_existante = Commande.objects.filter(vente_associee=derniere_vente).first()
if commande_existante:
    print(f"\n✅ Une commande existe déjà:")
    print(f"  - ID: {commande_existante.id}")
    print(f"  - Numéro: {commande_existante.numero_commande}")
    print(f"  - Statut: {commande_existante.statut}")
    print(f"  - Notes: {commande_existante.notes}")
else:
    print(f"\n⚠️ AUCUNE COMMANDE TROUVÉE pour cette vente!")
    print(f"\n🔨 Création manuelle d'une commande de test...")
    
    try:
        # Déterminer le statut selon le type de livraison
        if derniere_vente.type_livraison == 'livraison_domicile':
            statut = 'en_livraison'
            notes_prefix = "🎯 LIVRAISON PRIORITAIRE (À DOMICILE)"
        else:
            statut = 'en_preparation'
            notes_prefix = "📦 RETRAIT EN MAGASIN"
        
        # Créer la commande
        nouvelle_commande = Commande.objects.create(
            client=derniere_vente.client,
            vendeur=derniere_vente.vendeur,
            montant_total=derniere_vente.montant_total,
            montant_paye=derniere_vente.montant_paye,
            montant_restant=Decimal('0.00'),
            statut_paiement='paye',
            statut=statut,
            type_livraison=derniere_vente.type_livraison,
            frais_livraison=derniere_vente.frais_livraison or Decimal('0.00'),
            date_livraison_prevue=derniere_vente.date_livraison_prevue or timezone.now().date(),
            notes=f"{notes_prefix} - Vente {derniere_vente.numero_vente} - 100% payée - TEST MANUEL",
            vente_associee=derniere_vente,
            convertie_en_vente=True
        )
        
        print(f"\n✅ Commande créée avec succès!")
        print(f"  - ID: {nouvelle_commande.id}")
        print(f"  - Numéro: {nouvelle_commande.numero_commande}")
        print(f"  - Statut: {nouvelle_commande.statut}")
        print(f"  - Notes: {nouvelle_commande.notes}")
        
        # Copier les lignes
        for ligne_vente in derniere_vente.lignes.all():
            ItemCommande.objects.create(
                commande=nouvelle_commande,
                produit=ligne_vente.produit,
                quantite=ligne_vente.quantite,
                prix_unitaire=ligne_vente.prix_unitaire
            )
        print(f"  - {derniere_vente.lignes.count()} lignes copiées")
        
        # Notifier les livreurs si livraison à domicile
        if derniere_vente.type_livraison == 'livraison_domicile':
            from apps.authentication.models import Notification
            livreurs = User.objects.filter(role='livreur', is_active=True)
            for livreur in livreurs:
                Notification.objects.create(
                    utilisateur=livreur,
                    titre="🎯 Nouvelle livraison À DOMICILE (TEST)",
                    message=f"Vente {derniere_vente.numero_vente} - Client: {derniere_vente.client.nom}",
                    type='livraison',
                    lien=f'/deliveries/{nouvelle_commande.id}'
                )
            print(f"  - Notifications envoyées à {livreurs.count()} livreurs")
            
    except Exception as e:
        print(f"\n❌ Erreur lors de la création: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 80)
print("VÉRIFICATION MODULE LIVRAISONS")
print("=" * 80)

# Compter les livraisons
livraisons = Commande.objects.filter(statut__in=['validee', 'en_preparation', 'en_livraison', 'livree'])
print(f"\nTotal livraisons: {livraisons.count()}")
print(f"  - En cours (en_livraison): {livraisons.filter(statut='en_livraison').count()}")
print(f"  - Planifiées (en_preparation/validee): {livraisons.filter(statut__in=['en_preparation', 'validee']).count()}")
print(f"  - Livrées (livree): {livraisons.filter(statut='livree').count()}")

print("\n" + "=" * 80)

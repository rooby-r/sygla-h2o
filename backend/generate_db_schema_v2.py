"""
Script pour générer le schéma de la base de données SYGLA-H2O
Version améliorée avec symboles textuels au lieu d'émojis
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

def create_table_box(ax, x, y, table_name, fields, header_color, bg_color, width=2.9, field_height=0.28):
    """Crée une boîte représentant une table de la base de données"""
    
    num_fields = len(fields)
    total_height = (num_fields + 1) * field_height + 0.1
    
    # Boîte principale
    main_box = FancyBboxPatch(
        (x, y - total_height), width, total_height,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        facecolor=bg_color, edgecolor='#333333', linewidth=1.5
    )
    ax.add_patch(main_box)
    
    # En-tête
    header_box = FancyBboxPatch(
        (x, y - field_height - 0.02), width, field_height + 0.02,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        facecolor=header_color, edgecolor='#333333', linewidth=1.5
    )
    ax.add_patch(header_box)
    
    # Nom de la table
    ax.text(x + width/2, y - field_height/2, table_name, fontsize=10, fontweight='bold',
            ha='center', va='center', color='white')
    
    # Champs
    for i, (field_name, field_type, is_pk, is_fk) in enumerate(fields):
        field_y = y - (i + 2) * field_height + field_height/2
        
        # Préfixe pour PK/FK
        prefix = ""
        prefix_color = '#333333'
        if is_pk:
            prefix = "[PK] "
            prefix_color = '#dc2626'
        elif is_fk:
            prefix = "[FK] "
            prefix_color = '#2563eb'
        
        # Nom du champ avec préfixe
        ax.text(x + 0.08, field_y, prefix + field_name, fontsize=7, ha='left', va='center', 
                fontfamily='monospace', color=prefix_color if (is_pk or is_fk) else '#333333',
                fontweight='bold' if (is_pk or is_fk) else 'normal')
        ax.text(x + width - 0.08, field_y, field_type, fontsize=6.5, ha='right', va='center',
                color='#555555', fontfamily='monospace')
    
    return (x + width/2, y - total_height)  # Retourne le point de connexion en bas

def generate_database_schema():
    """Génère le schéma de la base de données"""
    
    fig, ax = plt.subplots(1, 1, figsize=(22, 16))
    ax.set_xlim(-1, 21)
    ax.set_ylim(-19, 2)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Titre
    ax.text(10, 1, 'SCHÉMA DE LA BASE DE DONNÉES - SYGLA-H2O', fontsize=18, fontweight='bold',
            ha='center', va='center', color='#1a1a2e')
    ax.text(10, 0.2, "Système de Gestion d'Eau Potable et Glace", fontsize=12,
            ha='center', va='center', color='#555555', style='italic')
    
    # =====================
    # DÉFINITION DES TABLES
    # Format: (nom_champ, type, is_primary_key, is_foreign_key)
    # =====================
    
    # TABLE USER
    user_fields = [
        ('id', 'INTEGER', True, False),
        ('email', 'VARCHAR(255) UNIQUE', False, False),
        ('username', 'VARCHAR(150)', False, False),
        ('password', 'VARCHAR(128)', False, False),
        ('first_name', 'VARCHAR(150)', False, False),
        ('last_name', 'VARCHAR(150)', False, False),
        ('role', 'VARCHAR(20)', False, False),
        ('telephone', 'VARCHAR(17)', False, False),
        ('adresse', 'TEXT', False, False),
        ('photo', 'VARCHAR(100)', False, False),
        ('is_active', 'BOOLEAN', False, False),
        ('must_change_password', 'BOOLEAN', False, False),
        ('last_activity', 'DATETIME', False, False),
        ('date_creation', 'DATETIME', False, False)
    ]
    create_table_box(ax, 0, -1, 'USER', user_fields, '#1e3a8a', '#dbeafe')
    
    # TABLE CLIENT
    client_fields = [
        ('id', 'INTEGER', True, False),
        ('type_client', 'VARCHAR(20)', False, False),
        ('nom_commercial', 'VARCHAR(200)', False, False),
        ('raison_sociale', 'VARCHAR(200)', False, False),
        ('telephone', 'VARCHAR(17)', False, False),
        ('adresse', 'TEXT', False, False),
        ('contact', 'VARCHAR(200)', False, False),
        ('email', 'VARCHAR(254)', False, False),
        ('credit_limite', 'DECIMAL(12,2)', False, False),
        ('credit_utilise', 'DECIMAL(12,2)', False, False),
        ('is_active', 'BOOLEAN', False, False),
        ('notes', 'TEXT', False, False),
        ('date_creation', 'DATETIME', False, False)
    ]
    create_table_box(ax, 3.5, -1, 'CLIENT', client_fields, '#166534', '#dcfce7')
    
    # TABLE PRODUIT
    produit_fields = [
        ('id', 'INTEGER', True, False),
        ('nom', 'VARCHAR(200)', False, False),
        ('code_produit', 'VARCHAR(20) UNIQUE', False, False),
        ('description', 'TEXT', False, False),
        ('type_produit', 'VARCHAR(50)', False, False),
        ('unite_mesure', 'VARCHAR(50)', False, False),
        ('prix_unitaire', 'DECIMAL(10,2)', False, False),
        ('stock_actuel', 'INTEGER', False, False),
        ('stock_initial', 'INTEGER', False, False),
        ('stock_minimal', 'INTEGER', False, False),
        ('is_active', 'BOOLEAN', False, False),
        ('date_creation', 'DATETIME', False, False)
    ]
    create_table_box(ax, 7, -1, 'PRODUIT', produit_fields, '#ca8a04', '#fef9c3')
    
    # TABLE MOUVEMENT_STOCK
    mouvement_fields = [
        ('id', 'INTEGER', True, False),
        ('produit_id', 'INTEGER', False, True),
        ('utilisateur_id', 'INTEGER', False, True),
        ('type_mouvement', 'VARCHAR(20)', False, False),
        ('quantite', 'INTEGER', False, False),
        ('stock_avant', 'INTEGER', False, False),
        ('stock_apres', 'INTEGER', False, False),
        ('motif', 'VARCHAR(200)', False, False),
        ('numero_document', 'VARCHAR(100)', False, False),
        ('date_creation', 'DATETIME', False, False)
    ]
    create_table_box(ax, 10.5, -1, 'MOUVEMENT_STOCK', mouvement_fields, '#b45309', '#fed7aa')
    
    # TABLE COMMANDE
    commande_fields = [
        ('id', 'INTEGER', True, False),
        ('numero_commande', 'VARCHAR(20) UNIQUE', False, False),
        ('client_id', 'INTEGER', False, True),
        ('vendeur_id', 'INTEGER', False, True),
        ('vente_associee_id', 'INTEGER', False, True),
        ('statut', 'VARCHAR(20)', False, False),
        ('type_livraison', 'VARCHAR(20)', False, False),
        ('montant_produits', 'DECIMAL(12,2)', False, False),
        ('frais_livraison', 'DECIMAL(12,2)', False, False),
        ('montant_total', 'DECIMAL(12,2)', False, False),
        ('montant_paye', 'DECIMAL(12,2)', False, False),
        ('montant_restant', 'DECIMAL(12,2)', False, False),
        ('statut_paiement', 'VARCHAR(20)', False, False),
        ('date_creation', 'DATETIME', False, False),
        ('date_livraison_prevue', 'DATETIME', False, False),
        ('date_echeance', 'DATE', False, False)
    ]
    create_table_box(ax, 0, -7, 'COMMANDE', commande_fields, '#dc2626', '#fecaca')
    
    # TABLE ITEM_COMMANDE
    item_commande_fields = [
        ('id', 'INTEGER', True, False),
        ('commande_id', 'INTEGER', False, True),
        ('produit_id', 'INTEGER', False, True),
        ('quantite', 'INTEGER', False, False),
        ('prix_unitaire', 'DECIMAL(10,2)', False, False),
        ('sous_total', 'DECIMAL(12,2)', False, False)
    ]
    create_table_box(ax, 3.5, -7, 'ITEM_COMMANDE', item_commande_fields, '#be123c', '#ffe4e6')
    
    # TABLE PAIEMENT_COMMANDE
    paiement_commande_fields = [
        ('id', 'INTEGER', True, False),
        ('commande_id', 'INTEGER', False, True),
        ('recu_par_id', 'INTEGER', False, True),
        ('montant', 'DECIMAL(12,2)', False, False),
        ('methode', 'VARCHAR(20)', False, False),
        ('reference', 'VARCHAR(100)', False, False),
        ('date_paiement', 'DATETIME', False, False)
    ]
    create_table_box(ax, 7, -7, 'PAIEMENT_COMMANDE', paiement_commande_fields, '#9f1239', '#fce7f3')
    
    # TABLE VENTE
    vente_fields = [
        ('id', 'INTEGER', True, False),
        ('numero_vente', 'VARCHAR(50) UNIQUE', False, False),
        ('client_id', 'INTEGER', False, True),
        ('vendeur_id', 'INTEGER', False, True),
        ('montant_total', 'DECIMAL(12,2)', False, False),
        ('montant_paye', 'DECIMAL(12,2)', False, False),
        ('montant_restant', 'DECIMAL(12,2)', False, False),
        ('statut_paiement', 'VARCHAR(20)', False, False),
        ('methode_paiement', 'VARCHAR(20)', False, False),
        ('type_livraison', 'VARCHAR(50)', False, False),
        ('frais_livraison', 'DECIMAL(12,2)', False, False),
        ('date_vente', 'DATETIME', False, False)
    ]
    create_table_box(ax, 10.5, -7, 'VENTE', vente_fields, '#7c3aed', '#ede9fe')
    
    # TABLE LIGNE_VENTE
    ligne_vente_fields = [
        ('id', 'INTEGER', True, False),
        ('vente_id', 'INTEGER', False, True),
        ('produit_id', 'INTEGER', False, True),
        ('quantite', 'DECIMAL(10,2)', False, False),
        ('prix_unitaire', 'DECIMAL(12,2)', False, False),
        ('montant', 'DECIMAL(12,2)', False, False)
    ]
    create_table_box(ax, 14, -7, 'LIGNE_VENTE', ligne_vente_fields, '#6d28d9', '#e9d5ff')
    
    # TABLE PAIEMENT
    paiement_fields = [
        ('id', 'INTEGER', True, False),
        ('vente_id', 'INTEGER', False, True),
        ('recu_par_id', 'INTEGER', False, True),
        ('montant', 'DECIMAL(12,2)', False, False),
        ('methode', 'VARCHAR(20)', False, False),
        ('reference', 'VARCHAR(100)', False, False),
        ('date_paiement', 'DATETIME', False, False)
    ]
    create_table_box(ax, 14, -1, 'PAIEMENT', paiement_fields, '#4c1d95', '#ddd6fe')
    
    # =====================
    # DESSINER LES RELATIONS
    # =====================
    
    # Style de flèche
    arrow_style = dict(arrowstyle='-|>', mutation_scale=15)
    
    # === Relations vers CLIENT (vert) ===
    # Commande.client_id -> Client
    ax.annotate('', xy=(4.95, -4.9), xytext=(1.45, -8.8),
                arrowprops=dict(arrowstyle='-|>', color='#16a34a', lw=2.5, 
                               connectionstyle="arc3,rad=-0.2", mutation_scale=15))
    ax.text(2.5, -6.5, 'client_id', fontsize=7, color='#16a34a', rotation=45)
    
    # Vente.client_id -> Client
    ax.annotate('', xy=(4.95, -4.9), xytext=(11.95, -10.2),
                arrowprops=dict(arrowstyle='-|>', color='#16a34a', lw=2.5, 
                               connectionstyle="arc3,rad=0.35", mutation_scale=15))
    ax.text(8.5, -8.5, 'client_id', fontsize=7, color='#16a34a')
    
    # === Relations vers USER (bleu) ===
    # Commande.vendeur_id -> User
    ax.annotate('', xy=(1.45, -5.2), xytext=(1.45, -7.9),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2.5, 
                               connectionstyle="arc3,rad=-0.4", mutation_scale=15))
    ax.text(-0.3, -6.5, 'vendeur_id', fontsize=7, color='#2563eb', rotation=90)
    
    # Vente.vendeur_id -> User
    ax.annotate('', xy=(1.45, -5.2), xytext=(11.95, -9.9),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2.5, 
                               connectionstyle="arc3,rad=0.35", mutation_scale=15))
    
    # MouvementStock.utilisateur_id -> User
    ax.annotate('', xy=(1.45, -5.2), xytext=(11.95, -3.8),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2, 
                               connectionstyle="arc3,rad=0.15", mutation_scale=12))
    ax.text(6.5, -3.8, 'utilisateur_id', fontsize=7, color='#2563eb')
    
    # PaiementCommande.recu_par_id -> User
    ax.annotate('', xy=(1.45, -5.2), xytext=(8.45, -9.3),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.5, 
                               connectionstyle="arc3,rad=0.2", mutation_scale=12))
    
    # Paiement.recu_par_id -> User
    ax.annotate('', xy=(1.45, -5.2), xytext=(15.45, -3.5),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=1.5, 
                               connectionstyle="arc3,rad=-0.15", mutation_scale=12))
    
    # === Relations vers PRODUIT (orange) ===
    # ItemCommande.produit_id -> Produit
    ax.annotate('', xy=(8.45, -4.9), xytext=(4.95, -8.6),
                arrowprops=dict(arrowstyle='-|>', color='#ea580c', lw=2.5, 
                               connectionstyle="arc3,rad=0.25", mutation_scale=15))
    ax.text(6, -7, 'produit_id', fontsize=7, color='#ea580c', rotation=30)
    
    # MouvementStock.produit_id -> Produit
    ax.annotate('', xy=(8.45, -4.9), xytext=(11.95, -4),
                arrowprops=dict(arrowstyle='-|>', color='#ea580c', lw=2.5, 
                               connectionstyle="arc3,rad=-0.15", mutation_scale=15))
    ax.text(9.8, -4.2, 'produit_id', fontsize=7, color='#ea580c')
    
    # LigneVente.produit_id -> Produit
    ax.annotate('', xy=(8.45, -4.9), xytext=(15.45, -8.6),
                arrowprops=dict(arrowstyle='-|>', color='#ea580c', lw=2.5, 
                               connectionstyle="arc3,rad=0.35", mutation_scale=15))
    ax.text(12.5, -7, 'produit_id', fontsize=7, color='#ea580c', rotation=-30)
    
    # === Relations vers COMMANDE (rouge) ===
    # ItemCommande.commande_id -> Commande
    ax.annotate('', xy=(1.45, -12.5), xytext=(4.95, -8.8),
                arrowprops=dict(arrowstyle='-|>', color='#dc2626', lw=2.5, 
                               connectionstyle="arc3,rad=-0.2", mutation_scale=15))
    ax.text(2.8, -10.5, 'commande_id', fontsize=7, color='#dc2626', rotation=-30)
    
    # PaiementCommande.commande_id -> Commande
    ax.annotate('', xy=(1.45, -12.5), xytext=(8.45, -9.5),
                arrowprops=dict(arrowstyle='-|>', color='#dc2626', lw=2.5, 
                               connectionstyle="arc3,rad=-0.2", mutation_scale=15))
    ax.text(5, -11.5, 'commande_id', fontsize=7, color='#dc2626', rotation=-15)
    
    # === Relations vers VENTE (violet) ===
    # LigneVente.vente_id -> Vente
    ax.annotate('', xy=(11.95, -10.5), xytext=(15.45, -8.8),
                arrowprops=dict(arrowstyle='-|>', color='#7c3aed', lw=2.5, 
                               connectionstyle="arc3,rad=-0.2", mutation_scale=15))
    ax.text(14, -9.2, 'vente_id', fontsize=7, color='#7c3aed')
    
    # Paiement.vente_id -> Vente
    ax.annotate('', xy=(11.95, -10.5), xytext=(15.45, -3.8),
                arrowprops=dict(arrowstyle='-|>', color='#7c3aed', lw=2.5, 
                               connectionstyle="arc3,rad=-0.35", mutation_scale=15))
    ax.text(14.5, -7, 'vente_id', fontsize=7, color='#7c3aed', rotation=90)
    
    # Commande.vente_associee_id -> Vente (relation optionnelle, pointillée)
    ax.annotate('', xy=(11.95, -9.8), xytext=(2.9, -9),
                arrowprops=dict(arrowstyle='-|>', color='#9333ea', lw=2, 
                               connectionstyle="arc3,rad=0.15", linestyle='dashed', mutation_scale=12))
    ax.text(7, -8.8, 'vente_associee_id', fontsize=7, color='#9333ea', style='italic')
    
    # =====================
    # LÉGENDE
    # =====================
    legend_y = -15.8
    ax.text(0, legend_y, 'LÉGENDE:', fontsize=11, fontweight='bold')
    
    # Couleurs des entités
    ax.add_patch(FancyBboxPatch((0, legend_y - 1), 0.5, 0.5, facecolor='#dbeafe', edgecolor='#1e3a8a', lw=2))
    ax.text(0.7, legend_y - 0.75, 'User (Authentification)', fontsize=9)
    
    ax.add_patch(FancyBboxPatch((5, legend_y - 1), 0.5, 0.5, facecolor='#dcfce7', edgecolor='#166534', lw=2))
    ax.text(5.7, legend_y - 0.75, 'Client', fontsize=9)
    
    ax.add_patch(FancyBboxPatch((8.5, legend_y - 1), 0.5, 0.5, facecolor='#fef9c3', edgecolor='#ca8a04', lw=2))
    ax.text(9.2, legend_y - 0.75, 'Produit / Stock', fontsize=9)
    
    ax.add_patch(FancyBboxPatch((13, legend_y - 1), 0.5, 0.5, facecolor='#fecaca', edgecolor='#dc2626', lw=2))
    ax.text(13.7, legend_y - 0.75, 'Commande', fontsize=9)
    
    ax.add_patch(FancyBboxPatch((17, legend_y - 1), 0.5, 0.5, facecolor='#ede9fe', edgecolor='#7c3aed', lw=2))
    ax.text(17.7, legend_y - 0.75, 'Vente', fontsize=9)
    
    # Symboles
    ax.text(0, legend_y - 2.2, '[PK] = Clé Primaire (Primary Key)', fontsize=9, color='#dc2626', fontweight='bold')
    ax.text(8, legend_y - 2.2, '[FK] = Clé Étrangère (Foreign Key)', fontsize=9, color='#2563eb', fontweight='bold')
    ax.text(0, legend_y - 2.9, '─────► Relation obligatoire (1:N)', fontsize=9)
    ax.text(8, legend_y - 2.9, '- - - -► Relation optionnelle', fontsize=9)
    
    # Footer
    ax.text(10, -18.5, '© SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', fontsize=9,
            ha='center', color='#666666', style='italic')
    
    # Chemin de sortie
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Sauvegarder en PNG (haute qualité)
    png_path = os.path.join(output_dir, 'schema_base_donnees.png')
    plt.savefig(png_path, dpi=250, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"✅ Image PNG générée: {png_path}")
    
    # Sauvegarder en JPEG (haute qualité)
    jpeg_path = os.path.join(output_dir, 'schema_base_donnees.jpg')
    plt.savefig(jpeg_path, dpi=250, bbox_inches='tight', facecolor='white', format='jpeg')
    print(f"✅ Image JPEG générée: {jpeg_path}")
    
    # Sauvegarder en PDF (vectoriel)
    pdf_path = os.path.join(output_dir, 'schema_base_donnees.pdf')
    plt.savefig(pdf_path, bbox_inches='tight', facecolor='white', format='pdf')
    print(f"✅ Fichier PDF généré: {pdf_path}")
    
    plt.close()
    
    return output_dir

if __name__ == '__main__':
    print("=" * 60)
    print("Génération du schéma de base de données SYGLA-H2O")
    print("=" * 60)
    
    try:
        output = generate_database_schema()
        print("\n✅ Schéma généré avec succès!")
        print(f"📁 Fichiers créés dans: {output}")
        print("\nFichiers générés:")
        print("  - schema_base_donnees.png (PNG haute qualité)")
        print("  - schema_base_donnees.jpg (JPEG)")
        print("  - schema_base_donnees.pdf (PDF vectoriel)")
    except ImportError as e:
        print(f"\n❌ Erreur d'import: {e}")
        print("Installez matplotlib avec: pip install matplotlib")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

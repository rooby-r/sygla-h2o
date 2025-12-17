"""
Script pour générer le schéma de la base de données SYGLA-H2O
Utilise matplotlib pour générer des fichiers PNG, JPEG et PDF
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

def create_table_box(ax, x, y, table_name, fields, header_color, bg_color, width=2.8, field_height=0.25):
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
        (x, y - field_height), width, field_height,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        facecolor=header_color, edgecolor='#333333', linewidth=1.5
    )
    ax.add_patch(header_box)
    
    # Nom de la table
    ax.text(x + width/2, y - field_height/2, table_name, fontsize=9, fontweight='bold',
            ha='center', va='center', color='white')
    
    # Champs
    for i, (field_name, field_type) in enumerate(fields):
        field_y = y - (i + 2) * field_height + field_height/2
        ax.text(x + 0.08, field_y, field_name, fontsize=6.5, ha='left', va='center', 
                fontfamily='monospace')
        ax.text(x + width - 0.08, field_y, field_type, fontsize=6, ha='right', va='center',
                color='#555555', fontfamily='monospace')
    
    return (x + width/2, y - total_height)  # Retourne le point de connexion en bas

def draw_relation(ax, start, end, color='#666666', style='->'):
    """Dessine une relation entre deux tables"""
    mid_y = (start[1] + end[1]) / 2
    
    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle=style, color=color, lw=1.5,
                               connectionstyle=f"arc3,rad=0.1"))

def generate_database_schema():
    """Génère le schéma de la base de données"""
    
    fig, ax = plt.subplots(1, 1, figsize=(20, 15))
    ax.set_xlim(-1, 19)
    ax.set_ylim(-18, 2)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Titre
    ax.text(9, 1, 'SCHÉMA DE LA BASE DE DONNÉES - SYGLA-H2O', fontsize=16, fontweight='bold',
            ha='center', va='center', color='#1a1a2e')
    ax.text(9, 0.3, 'Système de Gestion d\'Eau Potable et Glace', fontsize=11,
            ha='center', va='center', color='#555555', style='italic')
    
    # =====================
    # DÉFINITION DES TABLES
    # =====================
    
    # TABLE USER
    user_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('email', 'VARCHAR(255) UNIQUE'),
        ('username', 'VARCHAR(150)'),
        ('password', 'VARCHAR(128)'),
        ('first_name', 'VARCHAR(150)'),
        ('last_name', 'VARCHAR(150)'),
        ('role', 'VARCHAR(20)'),
        ('telephone', 'VARCHAR(17)'),
        ('adresse', 'TEXT'),
        ('photo', 'VARCHAR(100)'),
        ('is_active', 'BOOLEAN'),
        ('must_change_password', 'BOOLEAN'),
        ('last_activity', 'DATETIME'),
        ('date_creation', 'DATETIME')
    ]
    user_bottom = create_table_box(ax, 0, -1, 'USER', user_fields, '#1e3a8a', '#dbeafe')
    
    # TABLE CLIENT
    client_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('type_client', 'VARCHAR(20)'),
        ('nom_commercial', 'VARCHAR(200)'),
        ('raison_sociale', 'VARCHAR(200)'),
        ('telephone', 'VARCHAR(17)'),
        ('adresse', 'TEXT'),
        ('contact', 'VARCHAR(200)'),
        ('email', 'VARCHAR(254)'),
        ('credit_limite', 'DECIMAL(12,2)'),
        ('credit_utilise', 'DECIMAL(12,2)'),
        ('is_active', 'BOOLEAN'),
        ('notes', 'TEXT'),
        ('date_creation', 'DATETIME')
    ]
    client_bottom = create_table_box(ax, 3.5, -1, 'CLIENT', client_fields, '#166534', '#dcfce7')
    
    # TABLE PRODUIT
    produit_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('nom', 'VARCHAR(200)'),
        ('code_produit', 'VARCHAR(20) UNIQUE'),
        ('description', 'TEXT'),
        ('type_produit', 'VARCHAR(50)'),
        ('unite_mesure', 'VARCHAR(50)'),
        ('prix_unitaire', 'DECIMAL(10,2)'),
        ('stock_actuel', 'INTEGER'),
        ('stock_initial', 'INTEGER'),
        ('stock_minimal', 'INTEGER'),
        ('is_active', 'BOOLEAN'),
        ('date_creation', 'DATETIME')
    ]
    produit_bottom = create_table_box(ax, 7, -1, 'PRODUIT', produit_fields, '#ca8a04', '#fef9c3')
    
    # TABLE MOUVEMENT_STOCK
    mouvement_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('🔗 produit_id', 'INTEGER (FK)'),
        ('🔗 utilisateur_id', 'INTEGER (FK)'),
        ('type_mouvement', 'VARCHAR(20)'),
        ('quantite', 'INTEGER'),
        ('stock_avant', 'INTEGER'),
        ('stock_apres', 'INTEGER'),
        ('motif', 'VARCHAR(200)'),
        ('numero_document', 'VARCHAR(100)'),
        ('date_creation', 'DATETIME')
    ]
    mouvement_bottom = create_table_box(ax, 10.5, -1, 'MOUVEMENT_STOCK', mouvement_fields, '#b45309', '#fed7aa')
    
    # TABLE COMMANDE
    commande_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('numero_commande', 'VARCHAR(20) UNIQUE'),
        ('🔗 client_id', 'INTEGER (FK)'),
        ('🔗 vendeur_id', 'INTEGER (FK)'),
        ('🔗 vente_associee_id', 'INTEGER (FK)'),
        ('statut', 'VARCHAR(20)'),
        ('type_livraison', 'VARCHAR(20)'),
        ('montant_produits', 'DECIMAL(12,2)'),
        ('frais_livraison', 'DECIMAL(12,2)'),
        ('montant_total', 'DECIMAL(12,2)'),
        ('montant_paye', 'DECIMAL(12,2)'),
        ('montant_restant', 'DECIMAL(12,2)'),
        ('statut_paiement', 'VARCHAR(20)'),
        ('date_creation', 'DATETIME'),
        ('date_livraison_prevue', 'DATETIME'),
        ('date_echeance', 'DATE')
    ]
    commande_bottom = create_table_box(ax, 0, -7, 'COMMANDE', commande_fields, '#dc2626', '#fecaca')
    
    # TABLE ITEM_COMMANDE
    item_commande_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('🔗 commande_id', 'INTEGER (FK)'),
        ('🔗 produit_id', 'INTEGER (FK)'),
        ('quantite', 'INTEGER'),
        ('prix_unitaire', 'DECIMAL(10,2)'),
        ('sous_total', 'DECIMAL(12,2)')
    ]
    item_commande_bottom = create_table_box(ax, 3.5, -7, 'ITEM_COMMANDE', item_commande_fields, '#be123c', '#ffe4e6')
    
    # TABLE PAIEMENT_COMMANDE
    paiement_commande_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('🔗 commande_id', 'INTEGER (FK)'),
        ('🔗 recu_par_id', 'INTEGER (FK)'),
        ('montant', 'DECIMAL(12,2)'),
        ('methode', 'VARCHAR(20)'),
        ('reference', 'VARCHAR(100)'),
        ('date_paiement', 'DATETIME')
    ]
    paiement_commande_bottom = create_table_box(ax, 7, -7, 'PAIEMENT_COMMANDE', paiement_commande_fields, '#9f1239', '#fce7f3')
    
    # TABLE VENTE
    vente_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('numero_vente', 'VARCHAR(50) UNIQUE'),
        ('🔗 client_id', 'INTEGER (FK)'),
        ('🔗 vendeur_id', 'INTEGER (FK)'),
        ('montant_total', 'DECIMAL(12,2)'),
        ('montant_paye', 'DECIMAL(12,2)'),
        ('montant_restant', 'DECIMAL(12,2)'),
        ('statut_paiement', 'VARCHAR(20)'),
        ('methode_paiement', 'VARCHAR(20)'),
        ('type_livraison', 'VARCHAR(50)'),
        ('frais_livraison', 'DECIMAL(12,2)'),
        ('date_vente', 'DATETIME')
    ]
    vente_bottom = create_table_box(ax, 10.5, -7, 'VENTE', vente_fields, '#7c3aed', '#ede9fe')
    
    # TABLE LIGNE_VENTE
    ligne_vente_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('🔗 vente_id', 'INTEGER (FK)'),
        ('🔗 produit_id', 'INTEGER (FK)'),
        ('quantite', 'DECIMAL(10,2)'),
        ('prix_unitaire', 'DECIMAL(12,2)'),
        ('montant', 'DECIMAL(12,2)')
    ]
    ligne_vente_bottom = create_table_box(ax, 14, -7, 'LIGNE_VENTE', ligne_vente_fields, '#6d28d9', '#e9d5ff')
    
    # TABLE PAIEMENT
    paiement_fields = [
        ('🔑 id', 'INTEGER (PK)'),
        ('🔗 vente_id', 'INTEGER (FK)'),
        ('🔗 recu_par_id', 'INTEGER (FK)'),
        ('montant', 'DECIMAL(12,2)'),
        ('methode', 'VARCHAR(20)'),
        ('reference', 'VARCHAR(100)'),
        ('date_paiement', 'DATETIME')
    ]
    paiement_bottom = create_table_box(ax, 14, -1, 'PAIEMENT', paiement_fields, '#4c1d95', '#ddd6fe')
    
    # =====================
    # DESSINER LES RELATIONS
    # =====================
    
    # Relations vers Client
    ax.annotate('', xy=(4.85, -4.5), xytext=(1.4, -8.2),
                arrowprops=dict(arrowstyle='->', color='#16a34a', lw=2, connectionstyle="arc3,rad=-0.2"))
    ax.annotate('', xy=(4.85, -4.5), xytext=(11.9, -10.5),
                arrowprops=dict(arrowstyle='->', color='#16a34a', lw=2, connectionstyle="arc3,rad=0.3"))
    
    # Relations vers User (vendeur)
    ax.annotate('', xy=(1.4, -4.8), xytext=(1.4, -7.2),
                arrowprops=dict(arrowstyle='->', color='#2563eb', lw=2, connectionstyle="arc3,rad=-0.3"))
    ax.annotate('', xy=(1.4, -4.8), xytext=(11.9, -10.2),
                arrowprops=dict(arrowstyle='->', color='#2563eb', lw=2, connectionstyle="arc3,rad=0.3"))
    ax.annotate('', xy=(1.4, -4.8), xytext=(11.9, -3.2),
                arrowprops=dict(arrowstyle='->', color='#2563eb', lw=1.5, connectionstyle="arc3,rad=0.2"))
    
    # Relations vers Produit
    ax.annotate('', xy=(8.35, -4.5), xytext=(4.85, -8.3),
                arrowprops=dict(arrowstyle='->', color='#ea580c', lw=2, connectionstyle="arc3,rad=0.2"))
    ax.annotate('', xy=(8.35, -4.5), xytext=(11.9, -3.5),
                arrowprops=dict(arrowstyle='->', color='#ea580c', lw=2, connectionstyle="arc3,rad=-0.2"))
    ax.annotate('', xy=(8.35, -4.5), xytext=(15.35, -8.3),
                arrowprops=dict(arrowstyle='->', color='#ea580c', lw=2, connectionstyle="arc3,rad=0.3"))
    
    # Relations vers Commande
    ax.annotate('', xy=(1.4, -12), xytext=(4.85, -8.7),
                arrowprops=dict(arrowstyle='->', color='#dc2626', lw=2, connectionstyle="arc3,rad=-0.2"))
    ax.annotate('', xy=(1.4, -12), xytext=(8.35, -9),
                arrowprops=dict(arrowstyle='->', color='#dc2626', lw=2, connectionstyle="arc3,rad=-0.2"))
    
    # Relations vers Vente
    ax.annotate('', xy=(11.9, -10.5), xytext=(15.35, -8.5),
                arrowprops=dict(arrowstyle='->', color='#7c3aed', lw=2, connectionstyle="arc3,rad=-0.2"))
    ax.annotate('', xy=(11.9, -10.5), xytext=(15.35, -3.2),
                arrowprops=dict(arrowstyle='->', color='#7c3aed', lw=2, connectionstyle="arc3,rad=-0.3"))
    
    # Commande -> Vente (relation vente_associee)
    ax.annotate('', xy=(11.9, -9.5), xytext=(2.8, -8.5),
                arrowprops=dict(arrowstyle='->', color='#9333ea', lw=1.5, 
                               connectionstyle="arc3,rad=0.2", linestyle='dashed'))
    
    # =====================
    # LÉGENDE
    # =====================
    legend_y = -15.5
    ax.text(0, legend_y, 'LÉGENDE:', fontsize=10, fontweight='bold')
    
    # Couleurs des entités
    ax.add_patch(FancyBboxPatch((0, legend_y - 0.8), 0.4, 0.4, facecolor='#dbeafe', edgecolor='#1e3a8a'))
    ax.text(0.6, legend_y - 0.6, 'User (Authentification)', fontsize=8)
    
    ax.add_patch(FancyBboxPatch((4, legend_y - 0.8), 0.4, 0.4, facecolor='#dcfce7', edgecolor='#166534'))
    ax.text(4.6, legend_y - 0.6, 'Client', fontsize=8)
    
    ax.add_patch(FancyBboxPatch((7, legend_y - 0.8), 0.4, 0.4, facecolor='#fef9c3', edgecolor='#ca8a04'))
    ax.text(7.6, legend_y - 0.6, 'Produit / Stock', fontsize=8)
    
    ax.add_patch(FancyBboxPatch((10.5, legend_y - 0.8), 0.4, 0.4, facecolor='#fecaca', edgecolor='#dc2626'))
    ax.text(11.1, legend_y - 0.6, 'Commande', fontsize=8)
    
    ax.add_patch(FancyBboxPatch((14, legend_y - 0.8), 0.4, 0.4, facecolor='#ede9fe', edgecolor='#7c3aed'))
    ax.text(14.6, legend_y - 0.6, 'Vente', fontsize=8)
    
    # Symboles
    ax.text(0, legend_y - 1.8, '🔑 = Clé Primaire (PK)    🔗 = Clé Étrangère (FK)', fontsize=8)
    ax.text(0, legend_y - 2.4, '→ Relation (Foreign Key)    - - → Relation optionnelle', fontsize=8)
    
    # Footer
    ax.text(9, -17.5, '© SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', fontsize=8,
            ha='center', color='#666666', style='italic')
    
    # Chemin de sortie
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Sauvegarder en PNG
    png_path = os.path.join(output_dir, 'schema_base_donnees.png')
    plt.savefig(png_path, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    print(f"✅ Image PNG générée: {png_path}")
    
    # Sauvegarder en JPEG
    jpeg_path = os.path.join(output_dir, 'schema_base_donnees.jpg')
    plt.savefig(jpeg_path, dpi=200, bbox_inches='tight', facecolor='white', format='jpeg')
    print(f"✅ Image JPEG générée: {jpeg_path}")
    
    # Sauvegarder en PDF
    pdf_path = os.path.join(output_dir, 'schema_base_donnees.pdf')
    plt.savefig(pdf_path, bbox_inches='tight', facecolor='white')
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
        print("  - schema_base_donnees.png")
        print("  - schema_base_donnees.jpg (JPEG)")
        print("  - schema_base_donnees.pdf (PDF)")
    except ImportError as e:
        print(f"\n❌ Erreur d'import: {e}")
        print("Installez matplotlib avec: pip install matplotlib")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

"""
Script pour générer le schéma de la base de données SYGLA-H2O
Version avec relations explicites et bien étiquetées
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

def draw_table(ax, x, y, table_name, fields, header_color, width=3.4, row_height=0.38):
    """Dessine une table avec un style professionnel"""
    
    num_fields = len(fields)
    total_height = (num_fields + 1) * row_height
    
    # Ombre
    shadow = FancyBboxPatch(
        (x + 0.1, y - total_height - 0.1), width, total_height,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor='#999999', edgecolor='none', alpha=0.4
    )
    ax.add_patch(shadow)
    
    # Fond de la table
    table_bg = FancyBboxPatch(
        (x, y - total_height), width, total_height,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor='white', edgecolor='#2d3748', linewidth=2.5
    )
    ax.add_patch(table_bg)
    
    # En-tête
    header = FancyBboxPatch(
        (x, y - row_height), width, row_height,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor=header_color, edgecolor='#2d3748', linewidth=2.5
    )
    ax.add_patch(header)
    
    # Nom de la table
    ax.text(x + width/2, y - row_height/2, table_name, 
            fontsize=12, fontweight='bold', ha='center', va='center', color='white')
    
    # Champs
    for i, (field_name, field_type, key_type) in enumerate(fields):
        row_y = y - (i + 1.5) * row_height
        
        # Fond alterné
        if i % 2 == 0:
            row_bg = patches.Rectangle((x + 0.03, row_y - row_height/2 + 0.03), 
                                        width - 0.06, row_height - 0.06,
                                        facecolor='#f7fafc', edgecolor='none')
            ax.add_patch(row_bg)
        
        # Icône pour les clés
        icon_x = x + 0.2
        if key_type == 'PK':
            ax.plot(icon_x, row_y, 'o', color='#f6e05e', markersize=10, 
                   markeredgecolor='#d69e2e', markeredgewidth=2)
            ax.text(icon_x, row_y, 'P', fontsize=7, ha='center', va='center', 
                   fontweight='bold', color='#744210')
        elif key_type == 'FK':
            ax.plot(icon_x, row_y, 's', color='#63b3ed', markersize=10, 
                   markeredgecolor='#3182ce', markeredgewidth=2)
            ax.text(icon_x, row_y, 'F', fontsize=7, ha='center', va='center', 
                   fontweight='bold', color='#1a365d')
        
        # Nom du champ
        name_color = '#b7791f' if key_type == 'PK' else '#2b6cb0' if key_type == 'FK' else '#2d3748'
        ax.text(x + 0.45, row_y, field_name, fontsize=9, ha='left', va='center', 
                color=name_color, fontweight='bold' if key_type else 'normal')
        
        # Type du champ
        ax.text(x + width - 0.15, row_y, field_type, fontsize=8, ha='right', va='center',
                color='#718096')
    
    # Retourner les coordonnées pour les connexions
    return {
        'top': (x + width/2, y),
        'bottom': (x + width/2, y - total_height),
        'left': (x, y - total_height/2),
        'right': (x + width, y - total_height/2),
        'top_left': (x, y),
        'top_right': (x + width, y),
        'bottom_left': (x, y - total_height),
        'bottom_right': (x + width, y - total_height),
    }

def draw_relation_arrow(ax, start, end, label, color, offset=(0, 0.4), curved=0, style='-'):
    """Dessine une flèche de relation avec étiquette"""
    
    # Dessiner la flèche
    arrow = FancyArrowPatch(
        start, end,
        arrowstyle='-|>',
        mutation_scale=20,
        color=color,
        linewidth=2.5,
        linestyle=style,
        connectionstyle=f"arc3,rad={curved}"
    )
    ax.add_patch(arrow)
    
    # Calculer le milieu pour le label
    mid_x = (start[0] + end[0]) / 2 + offset[0]
    mid_y = (start[1] + end[1]) / 2 + offset[1]
    
    # Boîte pour le label
    ax.text(mid_x, mid_y, label, fontsize=8, ha='center', va='center',
            color='white', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.3', facecolor=color, edgecolor='white', 
                     linewidth=1.5, alpha=0.95))

def generate_schema():
    """Génère le schéma de base de données avec relations explicites"""
    
    fig, ax = plt.subplots(figsize=(26, 20))
    ax.set_xlim(-2, 28)
    ax.set_ylim(-22, 3)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_facecolor('#edf2f7')
    fig.patch.set_facecolor('#edf2f7')
    
    # ==================
    # TITRE
    # ==================
    title_box = FancyBboxPatch(
        (4, 1), 20, 1.8,
        boxstyle="round,pad=0.1,rounding_size=0.2",
        facecolor='#1a365d', edgecolor='#2c5282', linewidth=4
    )
    ax.add_patch(title_box)
    
    ax.text(14, 2.2, 'SCHÉMA DE LA BASE DE DONNÉES', 
            fontsize=22, fontweight='bold', ha='center', va='center', color='white')
    ax.text(14, 1.5, 'SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', 
            fontsize=13, ha='center', va='center', color='#90cdf4', style='italic')
    
    # ==================
    # TABLES - NIVEAU 1 (Entités principales)
    # ==================
    
    # USER
    user_fields = [
        ('id', 'INTEGER', 'PK'),
        ('email', 'VARCHAR(255)', ''),
        ('username', 'VARCHAR(150)', ''),
        ('password', 'VARCHAR(128)', ''),
        ('first_name', 'VARCHAR(150)', ''),
        ('last_name', 'VARCHAR(150)', ''),
        ('role', 'VARCHAR(20)', ''),
        ('telephone', 'VARCHAR(17)', ''),
        ('is_active', 'BOOLEAN', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    user_pos = draw_table(ax, 0, 0, 'USER', user_fields, '#2b6cb0')
    
    # CLIENT
    client_fields = [
        ('id', 'INTEGER', 'PK'),
        ('type_client', 'VARCHAR(20)', ''),
        ('nom_commercial', 'VARCHAR(200)', ''),
        ('raison_sociale', 'VARCHAR(200)', ''),
        ('telephone', 'VARCHAR(17)', ''),
        ('adresse', 'TEXT', ''),
        ('email', 'VARCHAR(254)', ''),
        ('credit_limite', 'DECIMAL(12,2)', ''),
        ('is_active', 'BOOLEAN', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    client_pos = draw_table(ax, 9, 0, 'CLIENT', client_fields, '#276749')
    
    # PRODUIT
    produit_fields = [
        ('id', 'INTEGER', 'PK'),
        ('nom', 'VARCHAR(200)', ''),
        ('code_produit', 'VARCHAR(20)', ''),
        ('type_produit', 'VARCHAR(50)', ''),
        ('prix_unitaire', 'DECIMAL(10,2)', ''),
        ('stock_actuel', 'INTEGER', ''),
        ('stock_initial', 'INTEGER', ''),
        ('stock_minimal', 'INTEGER', ''),
        ('is_active', 'BOOLEAN', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    produit_pos = draw_table(ax, 18, 0, 'PRODUIT', produit_fields, '#c05621')
    
    # ==================
    # TABLES - NIVEAU 2 (Transactions)
    # ==================
    
    # COMMANDE
    commande_fields = [
        ('id', 'INTEGER', 'PK'),
        ('numero_commande', 'VARCHAR(20)', ''),
        ('client_id', 'INTEGER', 'FK'),
        ('vendeur_id', 'INTEGER', 'FK'),
        ('statut', 'VARCHAR(20)', ''),
        ('montant_total', 'DECIMAL(12,2)', ''),
        ('montant_paye', 'DECIMAL(12,2)', ''),
        ('statut_paiement', 'VARCHAR(20)', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    commande_pos = draw_table(ax, 0, -6.5, 'COMMANDE', commande_fields, '#c53030')
    
    # VENTE
    vente_fields = [
        ('id', 'INTEGER', 'PK'),
        ('numero_vente', 'VARCHAR(50)', ''),
        ('client_id', 'INTEGER', 'FK'),
        ('vendeur_id', 'INTEGER', 'FK'),
        ('montant_total', 'DECIMAL(12,2)', ''),
        ('montant_paye', 'DECIMAL(12,2)', ''),
        ('statut_paiement', 'VARCHAR(20)', ''),
        ('type_livraison', 'VARCHAR(50)', ''),
        ('date_vente', 'DATETIME', ''),
    ]
    vente_pos = draw_table(ax, 9, -6.5, 'VENTE', vente_fields, '#6b46c1')
    
    # MOUVEMENT_STOCK
    mouvement_fields = [
        ('id', 'INTEGER', 'PK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('utilisateur_id', 'INTEGER', 'FK'),
        ('type_mouvement', 'VARCHAR(20)', ''),
        ('quantite', 'INTEGER', ''),
        ('stock_avant', 'INTEGER', ''),
        ('stock_apres', 'INTEGER', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    mouvement_pos = draw_table(ax, 18, -6.5, 'MOUVEMENT_STOCK', mouvement_fields, '#0987a0')
    
    # ==================
    # TABLES - NIVEAU 3 (Détails)
    # ==================
    
    # ITEM_COMMANDE
    item_commande_fields = [
        ('id', 'INTEGER', 'PK'),
        ('commande_id', 'INTEGER', 'FK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('quantite', 'INTEGER', ''),
        ('prix_unitaire', 'DECIMAL(10,2)', ''),
        ('sous_total', 'DECIMAL(12,2)', ''),
    ]
    item_commande_pos = draw_table(ax, 0, -13, 'ITEM_COMMANDE', item_commande_fields, '#97266d')
    
    # PAIEMENT_COMMANDE
    paiement_cmd_fields = [
        ('id', 'INTEGER', 'PK'),
        ('commande_id', 'INTEGER', 'FK'),
        ('recu_par_id', 'INTEGER', 'FK'),
        ('montant', 'DECIMAL(12,2)', ''),
        ('methode', 'VARCHAR(20)', ''),
        ('date_paiement', 'DATETIME', ''),
    ]
    paiement_cmd_pos = draw_table(ax, 6, -13, 'PAIEMENT_COMMANDE', paiement_cmd_fields, '#b83280')
    
    # LIGNE_VENTE
    ligne_vente_fields = [
        ('id', 'INTEGER', 'PK'),
        ('vente_id', 'INTEGER', 'FK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('quantite', 'DECIMAL(10,2)', ''),
        ('prix_unitaire', 'DECIMAL(12,2)', ''),
        ('montant', 'DECIMAL(12,2)', ''),
    ]
    ligne_vente_pos = draw_table(ax, 12, -13, 'LIGNE_VENTE', ligne_vente_fields, '#553c9a')
    
    # PAIEMENT
    paiement_fields = [
        ('id', 'INTEGER', 'PK'),
        ('vente_id', 'INTEGER', 'FK'),
        ('recu_par_id', 'INTEGER', 'FK'),
        ('montant', 'DECIMAL(12,2)', ''),
        ('methode', 'VARCHAR(20)', ''),
        ('date_paiement', 'DATETIME', ''),
    ]
    paiement_pos = draw_table(ax, 18, -13, 'PAIEMENT', paiement_fields, '#44337a')
    
    # ==================
    # RELATIONS AVEC ÉTIQUETTES EXPLICITES
    # ==================
    
    # ===== RELATIONS VERS CLIENT (Vert) =====
    # Commande.client_id → Client.id
    draw_relation_arrow(ax, 
        (3.4, -7.6), (9, -4.2),
        'client_id', '#276749', offset=(0.5, 0.3), curved=-0.2)
    
    # Vente.client_id → Client.id
    draw_relation_arrow(ax, 
        (10.7, -7.6), (10.7, -4.2),
        'client_id', '#276749', offset=(0.8, 0), curved=0)
    
    # ===== RELATIONS VERS USER (Bleu) =====
    # Commande.vendeur_id → User.id
    draw_relation_arrow(ax, 
        (1.7, -6.9), (1.7, -4.2),
        'vendeur_id', '#2b6cb0', offset=(-1.2, 0), curved=0)
    
    # Vente.vendeur_id → User.id
    draw_relation_arrow(ax, 
        (9, -8), (3.4, -4.2),
        'vendeur_id', '#2b6cb0', offset=(-0.3, 0.5), curved=-0.15)
    
    # MouvementStock.utilisateur_id → User.id
    draw_relation_arrow(ax, 
        (18, -8), (3.4, -2),
        'utilisateur_id', '#2b6cb0', offset=(0, 0.5), curved=0.25)
    
    # PaiementCommande.recu_par_id → User.id
    draw_relation_arrow(ax, 
        (6, -14), (0, -4.2),
        'recu_par_id', '#2b6cb0', offset=(-1, 0), curved=-0.3)
    
    # Paiement.recu_par_id → User.id
    draw_relation_arrow(ax, 
        (18, -14.5), (3.4, -4.2),
        'recu_par_id', '#2b6cb0', offset=(0, -1), curved=0.35)
    
    # ===== RELATIONS VERS PRODUIT (Orange) =====
    # MouvementStock.produit_id → Produit.id
    draw_relation_arrow(ax, 
        (19.7, -6.9), (19.7, -4.2),
        'produit_id', '#c05621', offset=(1.2, 0), curved=0)
    
    # ItemCommande.produit_id → Produit.id
    draw_relation_arrow(ax, 
        (3.4, -13.5), (18, -4.2),
        'produit_id', '#c05621', offset=(1, 0.5), curved=0.25)
    
    # LigneVente.produit_id → Produit.id
    draw_relation_arrow(ax, 
        (15.4, -13.5), (19.7, -4.2),
        'produit_id', '#c05621', offset=(1.5, 0), curved=0.2)
    
    # ===== RELATIONS VERS COMMANDE (Rouge) =====
    # ItemCommande.commande_id → Commande.id
    draw_relation_arrow(ax, 
        (1.7, -13.4), (1.7, -10.5),
        'commande_id', '#c53030', offset=(-1.3, 0), curved=0)
    
    # PaiementCommande.commande_id → Commande.id
    draw_relation_arrow(ax, 
        (7.7, -13.4), (3.4, -10.5),
        'commande_id', '#c53030', offset=(0.3, 0.3), curved=-0.15)
    
    # ===== RELATIONS VERS VENTE (Violet) =====
    # LigneVente.vente_id → Vente.id
    draw_relation_arrow(ax, 
        (13.7, -13.4), (10.7, -10.2),
        'vente_id', '#6b46c1', offset=(-0.3, 0.3), curved=-0.15)
    
    # Paiement.vente_id → Vente.id
    draw_relation_arrow(ax, 
        (19.7, -13.4), (12.4, -10.2),
        'vente_id', '#6b46c1', offset=(0.5, 0.3), curved=0.2)
    
    # ==================
    # LÉGENDE DÉTAILLÉE
    # ==================
    legend_y = -18
    
    # Boîte de légende
    legend_box = FancyBboxPatch(
        (0, legend_y - 3.5), 26, 3.3,
        boxstyle="round,pad=0.1,rounding_size=0.15",
        facecolor='white', edgecolor='#2d3748', linewidth=2.5
    )
    ax.add_patch(legend_box)
    
    ax.text(0.5, legend_y - 0.5, 'LÉGENDE', fontsize=14, fontweight='bold', color='#1a202c')
    
    # Ligne 1 - Clés
    ax.plot(0.7, legend_y - 1.4, 'o', color='#f6e05e', markersize=14, 
           markeredgecolor='#d69e2e', markeredgewidth=2)
    ax.text(0.7, legend_y - 1.4, 'P', fontsize=9, ha='center', va='center', 
           fontweight='bold', color='#744210')
    ax.text(1.3, legend_y - 1.4, '= Clé Primaire (Primary Key)', fontsize=11, va='center')
    
    ax.plot(7.5, legend_y - 1.4, 's', color='#63b3ed', markersize=14, 
           markeredgecolor='#3182ce', markeredgewidth=2)
    ax.text(7.5, legend_y - 1.4, 'F', fontsize=9, ha='center', va='center', 
           fontweight='bold', color='#1a365d')
    ax.text(8.1, legend_y - 1.4, '= Clé Étrangère (Foreign Key)', fontsize=11, va='center')
    
    # Ligne 2 - Relations
    # Relation vers CLIENT
    ax.annotate('', xy=(1.5, legend_y - 2.3), xytext=(0.5, legend_y - 2.3),
                arrowprops=dict(arrowstyle='-|>', color='#276749', lw=3, mutation_scale=15))
    ax.text(2, legend_y - 2.3, '= Vers CLIENT', fontsize=10, va='center', color='#276749', fontweight='bold')
    
    # Relation vers USER
    ax.annotate('', xy=(6.5, legend_y - 2.3), xytext=(5.5, legend_y - 2.3),
                arrowprops=dict(arrowstyle='-|>', color='#2b6cb0', lw=3, mutation_scale=15))
    ax.text(7, legend_y - 2.3, '= Vers USER', fontsize=10, va='center', color='#2b6cb0', fontweight='bold')
    
    # Relation vers PRODUIT
    ax.annotate('', xy=(11.5, legend_y - 2.3), xytext=(10.5, legend_y - 2.3),
                arrowprops=dict(arrowstyle='-|>', color='#c05621', lw=3, mutation_scale=15))
    ax.text(12, legend_y - 2.3, '= Vers PRODUIT', fontsize=10, va='center', color='#c05621', fontweight='bold')
    
    # Relation vers COMMANDE
    ax.annotate('', xy=(17, legend_y - 2.3), xytext=(16, legend_y - 2.3),
                arrowprops=dict(arrowstyle='-|>', color='#c53030', lw=3, mutation_scale=15))
    ax.text(17.5, legend_y - 2.3, '= Vers COMMANDE', fontsize=10, va='center', color='#c53030', fontweight='bold')
    
    # Relation vers VENTE
    ax.annotate('', xy=(23, legend_y - 2.3), xytext=(22, legend_y - 2.3),
                arrowprops=dict(arrowstyle='-|>', color='#6b46c1', lw=3, mutation_scale=15))
    ax.text(23.5, legend_y - 2.3, '= Vers VENTE', fontsize=10, va='center', color='#6b46c1', fontweight='bold')
    
    # Ligne 3 - Cardinalités
    ax.text(0.5, legend_y - 3.1, 'Cardinalités: 1 ────► N (Un-à-Plusieurs)', 
            fontsize=10, va='center', color='#4a5568')
    ax.text(10, legend_y - 3.1, 'Les étiquettes sur les flèches indiquent le nom de la clé étrangère', 
            fontsize=10, va='center', color='#4a5568', style='italic')
    
    # Footer
    ax.text(13, -21.5, '© SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace - 2025', 
            fontsize=11, ha='center', color='#718096', style='italic')
    
    # ==================
    # SAUVEGARDE
    # ==================
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # PNG
    png_path = os.path.join(output_dir, 'schema_base_donnees.png')
    plt.savefig(png_path, dpi=300, bbox_inches='tight', facecolor='#edf2f7', edgecolor='none')
    print(f"✅ PNG: {png_path}")
    
    # JPEG
    jpeg_path = os.path.join(output_dir, 'schema_base_donnees.jpg')
    plt.savefig(jpeg_path, dpi=300, bbox_inches='tight', facecolor='#edf2f7', format='jpeg')
    print(f"✅ JPEG: {jpeg_path}")
    
    # PDF
    pdf_path = os.path.join(output_dir, 'schema_base_donnees.pdf')
    plt.savefig(pdf_path, bbox_inches='tight', facecolor='#edf2f7', format='pdf')
    print(f"✅ PDF: {pdf_path}")
    
    plt.close()
    return output_dir

if __name__ == '__main__':
    print("=" * 65)
    print("   GÉNÉRATION DU SCHÉMA DE BASE DE DONNÉES SYGLA-H2O")
    print("   Version avec relations explicites et étiquetées")
    print("=" * 65)
    
    try:
        output = generate_schema()
        print("\n" + "=" * 65)
        print("   ✅ SCHÉMA GÉNÉRÉ AVEC SUCCÈS!")
        print("=" * 65)
        print(f"\n📁 Dossier: {output}")
        print("\n📄 Fichiers créés:")
        print("   • schema_base_donnees.png (PNG haute résolution)")
        print("   • schema_base_donnees.jpg (JPEG)")
        print("   • schema_base_donnees.pdf (PDF vectoriel)")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

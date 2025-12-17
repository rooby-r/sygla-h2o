"""
Script pour générer le schéma de la base de données SYGLA-H2O
Version finale - Structure professionnelle et claire
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch
import os

def draw_table(ax, x, y, table_name, fields, header_color, width=3.2, row_height=0.35):
    """Dessine une table avec un style professionnel"""
    
    num_fields = len(fields)
    total_height = (num_fields + 1) * row_height
    
    # Ombre
    shadow = FancyBboxPatch(
        (x + 0.08, y - total_height - 0.08), width, total_height,
        boxstyle="round,pad=0.02,rounding_size=0.05",
        facecolor='#cccccc', edgecolor='none', alpha=0.5
    )
    ax.add_patch(shadow)
    
    # Fond de la table
    table_bg = FancyBboxPatch(
        (x, y - total_height), width, total_height,
        boxstyle="round,pad=0.02,rounding_size=0.05",
        facecolor='white', edgecolor='#333333', linewidth=2
    )
    ax.add_patch(table_bg)
    
    # En-tête
    header = FancyBboxPatch(
        (x, y - row_height), width, row_height,
        boxstyle="round,pad=0.02,rounding_size=0.05",
        facecolor=header_color, edgecolor='#333333', linewidth=2
    )
    ax.add_patch(header)
    
    # Nom de la table
    ax.text(x + width/2, y - row_height/2, table_name, 
            fontsize=11, fontweight='bold', ha='center', va='center', color='white',
            fontfamily='Arial')
    
    # Ligne séparatrice sous l'en-tête
    ax.plot([x, x + width], [y - row_height, y - row_height], color='#333333', linewidth=2)
    
    # Champs
    for i, (field_name, field_type, key_type) in enumerate(fields):
        row_y = y - (i + 1.5) * row_height
        
        # Alternance de couleurs pour les lignes
        if i % 2 == 0:
            row_bg = patches.Rectangle((x + 0.02, row_y - row_height/2 + 0.02), 
                                        width - 0.04, row_height - 0.04,
                                        facecolor='#f8f9fa', edgecolor='none')
            ax.add_patch(row_bg)
        
        # Icône pour les clés
        icon_x = x + 0.15
        if key_type == 'PK':
            ax.plot(icon_x, row_y, 'o', color='#fbbf24', markersize=8, markeredgecolor='#b45309', markeredgewidth=1.5)
            ax.text(icon_x, row_y, 'P', fontsize=6, ha='center', va='center', fontweight='bold', color='#78350f')
        elif key_type == 'FK':
            ax.plot(icon_x, row_y, 's', color='#60a5fa', markersize=8, markeredgecolor='#1d4ed8', markeredgewidth=1.5)
            ax.text(icon_x, row_y, 'F', fontsize=6, ha='center', va='center', fontweight='bold', color='#1e3a8a')
        
        # Nom du champ
        name_color = '#b45309' if key_type == 'PK' else '#1d4ed8' if key_type == 'FK' else '#1f2937'
        ax.text(x + 0.35, row_y, field_name, fontsize=8, ha='left', va='center', 
                color=name_color, fontweight='bold' if key_type else 'normal',
                fontfamily='Consolas')
        
        # Type du champ
        ax.text(x + width - 0.1, row_y, field_type, fontsize=7, ha='right', va='center',
                color='#6b7280', fontfamily='Consolas')
    
    # Retourner les points de connexion
    return {
        'top': (x + width/2, y),
        'bottom': (x + width/2, y - total_height),
        'left': (x, y - total_height/2),
        'right': (x + width, y - total_height/2),
        'center': (x + width/2, y - total_height/2)
    }

def draw_relation(ax, start, end, color, label='', curved=0, style='-'):
    """Dessine une relation entre deux tables"""
    
    # Créer la flèche
    arrow = ConnectionPatch(
        start, end, 'data', 'data',
        arrowstyle='-|>', mutation_scale=20,
        color=color, linewidth=2, linestyle=style,
        connectionstyle=f"arc3,rad={curved}"
    )
    ax.add_patch(arrow)
    
    # Ajouter le label
    if label:
        mid_x = (start[0] + end[0]) / 2
        mid_y = (start[1] + end[1]) / 2
        ax.text(mid_x, mid_y + 0.3, label, fontsize=7, ha='center', va='center',
                color=color, fontweight='bold', 
                bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor=color, alpha=0.9))

def generate_schema():
    """Génère le schéma de base de données structuré"""
    
    fig, ax = plt.subplots(figsize=(24, 18))
    ax.set_xlim(-2, 26)
    ax.set_ylim(-20, 3)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_facecolor('#f0f4f8')
    fig.patch.set_facecolor('#f0f4f8')
    
    # ==================
    # TITRE
    # ==================
    # Boîte de titre
    title_box = FancyBboxPatch(
        (3, 1), 18, 1.8,
        boxstyle="round,pad=0.1,rounding_size=0.2",
        facecolor='#1e3a8a', edgecolor='#1e40af', linewidth=3
    )
    ax.add_patch(title_box)
    
    ax.text(12, 2.2, 'SCHÉMA DE LA BASE DE DONNÉES', 
            fontsize=20, fontweight='bold', ha='center', va='center', color='white')
    ax.text(12, 1.5, 'SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', 
            fontsize=12, ha='center', va='center', color='#93c5fd', style='italic')
    
    # ==================
    # NIVEAU 1 - ENTITÉS PRINCIPALES (User, Client, Produit)
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
        ('adresse', 'TEXT', ''),
        ('is_active', 'BOOLEAN', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    user_pos = draw_table(ax, 0, 0, 'USER', user_fields, '#1e40af')
    
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
        ('credit_utilise', 'DECIMAL(12,2)', ''),
        ('is_active', 'BOOLEAN', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    client_pos = draw_table(ax, 8, 0, 'CLIENT', client_fields, '#166534')
    
    # PRODUIT
    produit_fields = [
        ('id', 'INTEGER', 'PK'),
        ('nom', 'VARCHAR(200)', ''),
        ('code_produit', 'VARCHAR(20)', ''),
        ('type_produit', 'VARCHAR(50)', ''),
        ('unite_mesure', 'VARCHAR(50)', ''),
        ('prix_unitaire', 'DECIMAL(10,2)', ''),
        ('stock_actuel', 'INTEGER', ''),
        ('stock_initial', 'INTEGER', ''),
        ('stock_minimal', 'INTEGER', ''),
        ('is_active', 'BOOLEAN', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    produit_pos = draw_table(ax, 16, 0, 'PRODUIT', produit_fields, '#b45309')
    
    # ==================
    # NIVEAU 2 - COMMANDE et VENTE
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
        ('montant_restant', 'DECIMAL(12,2)', ''),
        ('statut_paiement', 'VARCHAR(20)', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    commande_pos = draw_table(ax, 2, -6, 'COMMANDE', commande_fields, '#dc2626')
    
    # VENTE
    vente_fields = [
        ('id', 'INTEGER', 'PK'),
        ('numero_vente', 'VARCHAR(50)', ''),
        ('client_id', 'INTEGER', 'FK'),
        ('vendeur_id', 'INTEGER', 'FK'),
        ('montant_total', 'DECIMAL(12,2)', ''),
        ('montant_paye', 'DECIMAL(12,2)', ''),
        ('montant_restant', 'DECIMAL(12,2)', ''),
        ('statut_paiement', 'VARCHAR(20)', ''),
        ('type_livraison', 'VARCHAR(50)', ''),
        ('date_vente', 'DATETIME', ''),
    ]
    vente_pos = draw_table(ax, 14, -6, 'VENTE', vente_fields, '#7c3aed')
    
    # MOUVEMENT_STOCK
    mouvement_fields = [
        ('id', 'INTEGER', 'PK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('utilisateur_id', 'INTEGER', 'FK'),
        ('type_mouvement', 'VARCHAR(20)', ''),
        ('quantite', 'INTEGER', ''),
        ('stock_avant', 'INTEGER', ''),
        ('stock_apres', 'INTEGER', ''),
        ('motif', 'VARCHAR(200)', ''),
        ('date_creation', 'DATETIME', ''),
    ]
    mouvement_pos = draw_table(ax, 20, -6, 'MOUVEMENT_STOCK', mouvement_fields, '#0891b2')
    
    # ==================
    # NIVEAU 3 - TABLES DE DÉTAIL
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
    item_commande_pos = draw_table(ax, 0, -12, 'ITEM_COMMANDE', item_commande_fields, '#be123c')
    
    # PAIEMENT_COMMANDE
    paiement_commande_fields = [
        ('id', 'INTEGER', 'PK'),
        ('commande_id', 'INTEGER', 'FK'),
        ('recu_par_id', 'INTEGER', 'FK'),
        ('montant', 'DECIMAL(12,2)', ''),
        ('methode', 'VARCHAR(20)', ''),
        ('reference', 'VARCHAR(100)', ''),
        ('date_paiement', 'DATETIME', ''),
    ]
    paiement_commande_pos = draw_table(ax, 6, -12, 'PAIEMENT_COMMANDE', paiement_commande_fields, '#9f1239')
    
    # LIGNE_VENTE
    ligne_vente_fields = [
        ('id', 'INTEGER', 'PK'),
        ('vente_id', 'INTEGER', 'FK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('quantite', 'DECIMAL(10,2)', ''),
        ('prix_unitaire', 'DECIMAL(12,2)', ''),
        ('montant', 'DECIMAL(12,2)', ''),
    ]
    ligne_vente_pos = draw_table(ax, 12, -12, 'LIGNE_VENTE', ligne_vente_fields, '#6d28d9')
    
    # PAIEMENT
    paiement_fields = [
        ('id', 'INTEGER', 'PK'),
        ('vente_id', 'INTEGER', 'FK'),
        ('recu_par_id', 'INTEGER', 'FK'),
        ('montant', 'DECIMAL(12,2)', ''),
        ('methode', 'VARCHAR(20)', ''),
        ('reference', 'VARCHAR(100)', ''),
        ('date_paiement', 'DATETIME', ''),
    ]
    paiement_pos = draw_table(ax, 18, -12, 'PAIEMENT', paiement_fields, '#4c1d95')
    
    # ==================
    # RELATIONS
    # ==================
    
    # Relations vers CLIENT
    ax.annotate('', xy=(9.6, -4.55), xytext=(3.6, -7.2),
                arrowprops=dict(arrowstyle='-|>', color='#16a34a', lw=2.5, 
                               connectionstyle="arc3,rad=-0.2", mutation_scale=18))
    ax.annotate('', xy=(9.6, -4.55), xytext=(15.6, -7.2),
                arrowprops=dict(arrowstyle='-|>', color='#16a34a', lw=2.5, 
                               connectionstyle="arc3,rad=0.2", mutation_scale=18))
    
    # Relations vers USER
    ax.annotate('', xy=(1.6, -4.55), xytext=(3.6, -7.6),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2.5, 
                               connectionstyle="arc3,rad=-0.3", mutation_scale=18))
    ax.annotate('', xy=(1.6, -4.55), xytext=(15.6, -7.6),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2.5, 
                               connectionstyle="arc3,rad=0.3", mutation_scale=18))
    ax.annotate('', xy=(1.6, -4.55), xytext=(21.6, -7.6),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2, 
                               connectionstyle="arc3,rad=0.4", mutation_scale=15))
    ax.annotate('', xy=(1.6, -4.55), xytext=(7.6, -13.6),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2, 
                               connectionstyle="arc3,rad=-0.3", mutation_scale=15))
    ax.annotate('', xy=(1.6, -4.55), xytext=(19.6, -13.6),
                arrowprops=dict(arrowstyle='-|>', color='#2563eb', lw=2, 
                               connectionstyle="arc3,rad=0.4", mutation_scale=15))
    
    # Relations vers PRODUIT
    ax.annotate('', xy=(17.6, -4.55), xytext=(21.6, -7.2),
                arrowprops=dict(arrowstyle='-|>', color='#ea580c', lw=2.5, 
                               connectionstyle="arc3,rad=0.2", mutation_scale=18))
    ax.annotate('', xy=(17.6, -4.55), xytext=(1.6, -13),
                arrowprops=dict(arrowstyle='-|>', color='#ea580c', lw=2.5, 
                               connectionstyle="arc3,rad=-0.3", mutation_scale=18))
    ax.annotate('', xy=(17.6, -4.55), xytext=(13.6, -13),
                arrowprops=dict(arrowstyle='-|>', color='#ea580c', lw=2.5, 
                               connectionstyle="arc3,rad=0.2", mutation_scale=18))
    
    # Relations vers COMMANDE
    ax.annotate('', xy=(3.6, -10.2), xytext=(1.6, -12.6),
                arrowprops=dict(arrowstyle='-|>', color='#dc2626', lw=2.5, 
                               connectionstyle="arc3,rad=-0.15", mutation_scale=18))
    ax.annotate('', xy=(3.6, -10.2), xytext=(7.6, -12.8),
                arrowprops=dict(arrowstyle='-|>', color='#dc2626', lw=2.5, 
                               connectionstyle="arc3,rad=0.15", mutation_scale=18))
    
    # Relations vers VENTE
    ax.annotate('', xy=(15.6, -10.2), xytext=(13.6, -12.6),
                arrowprops=dict(arrowstyle='-|>', color='#7c3aed', lw=2.5, 
                               connectionstyle="arc3,rad=-0.15", mutation_scale=18))
    ax.annotate('', xy=(15.6, -10.2), xytext=(19.6, -12.8),
                arrowprops=dict(arrowstyle='-|>', color='#7c3aed', lw=2.5, 
                               connectionstyle="arc3,rad=0.15", mutation_scale=18))
    
    # ==================
    # LÉGENDE
    # ==================
    legend_y = -17
    
    # Boîte de légende
    legend_box = FancyBboxPatch(
        (0, legend_y - 2.5), 24, 2.3,
        boxstyle="round,pad=0.1,rounding_size=0.1",
        facecolor='white', edgecolor='#333333', linewidth=2
    )
    ax.add_patch(legend_box)
    
    ax.text(0.3, legend_y - 0.5, 'LÉGENDE', fontsize=12, fontweight='bold', color='#1f2937')
    
    # Symboles PK/FK
    ax.plot(0.5, legend_y - 1.3, 'o', color='#fbbf24', markersize=12, markeredgecolor='#b45309', markeredgewidth=2)
    ax.text(0.5, legend_y - 1.3, 'P', fontsize=8, ha='center', va='center', fontweight='bold', color='#78350f')
    ax.text(1, legend_y - 1.3, '= Clé Primaire (PK)', fontsize=10, va='center')
    
    ax.plot(5.5, legend_y - 1.3, 's', color='#60a5fa', markersize=12, markeredgecolor='#1d4ed8', markeredgewidth=2)
    ax.text(5.5, legend_y - 1.3, 'F', fontsize=8, ha='center', va='center', fontweight='bold', color='#1e3a8a')
    ax.text(6, legend_y - 1.3, '= Clé Étrangère (FK)', fontsize=10, va='center')
    
    # Couleurs des relations
    ax.plot([10.5, 11.5], [legend_y - 1.3, legend_y - 1.3], color='#16a34a', lw=3)
    ax.text(12, legend_y - 1.3, '= Relation vers CLIENT', fontsize=10, va='center', color='#16a34a')
    
    ax.plot([16, 17], [legend_y - 1.3, legend_y - 1.3], color='#2563eb', lw=3)
    ax.text(17.5, legend_y - 1.3, '= Relation vers USER', fontsize=10, va='center', color='#2563eb')
    
    ax.plot([10.5, 11.5], [legend_y - 2, legend_y - 2], color='#ea580c', lw=3)
    ax.text(12, legend_y - 2, '= Relation vers PRODUIT', fontsize=10, va='center', color='#ea580c')
    
    ax.plot([16, 17], [legend_y - 2, legend_y - 2], color='#dc2626', lw=3)
    ax.text(17.5, legend_y - 2, '= Relation vers COMMANDE', fontsize=10, va='center', color='#dc2626')
    
    ax.plot([21, 22], [legend_y - 1.65, legend_y - 1.65], color='#7c3aed', lw=3)
    ax.text(22.5, legend_y - 1.65, '= Relation vers VENTE', fontsize=10, va='center', color='#7c3aed')
    
    # Footer
    ax.text(12, -19.5, '© SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace - 2025', 
            fontsize=10, ha='center', color='#6b7280', style='italic')
    
    # ==================
    # SAUVEGARDE
    # ==================
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # PNG
    png_path = os.path.join(output_dir, 'schema_base_donnees.png')
    plt.savefig(png_path, dpi=300, bbox_inches='tight', facecolor='#f0f4f8', edgecolor='none')
    print(f"✅ PNG: {png_path}")
    
    # JPEG
    jpeg_path = os.path.join(output_dir, 'schema_base_donnees.jpg')
    plt.savefig(jpeg_path, dpi=300, bbox_inches='tight', facecolor='#f0f4f8', format='jpeg')
    print(f"✅ JPEG: {jpeg_path}")
    
    # PDF
    pdf_path = os.path.join(output_dir, 'schema_base_donnees.pdf')
    plt.savefig(pdf_path, bbox_inches='tight', facecolor='#f0f4f8', format='pdf')
    print(f"✅ PDF: {pdf_path}")
    
    plt.close()
    return output_dir

if __name__ == '__main__':
    print("=" * 60)
    print("  GÉNÉRATION DU SCHÉMA DE BASE DE DONNÉES SYGLA-H2O")
    print("=" * 60)
    
    try:
        output = generate_schema()
        print("\n" + "=" * 60)
        print("  ✅ SCHÉMA GÉNÉRÉ AVEC SUCCÈS!")
        print("=" * 60)
        print(f"\n📁 Dossier: {output}")
        print("\n📄 Fichiers créés:")
        print("   • schema_base_donnees.png")
        print("   • schema_base_donnees.jpg")
        print("   • schema_base_donnees.pdf")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

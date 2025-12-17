"""
Script pour générer le schéma de la base de données SYGLA-H2O
Version avec flèches pointant exactement vers les champs concernés
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

class TableDrawer:
    """Classe pour dessiner une table et garder les positions des champs"""
    
    def __init__(self, ax, x, y, table_name, fields, header_color, width=3.6, row_height=0.4):
        self.ax = ax
        self.x = x
        self.y = y
        self.width = width
        self.row_height = row_height
        self.table_name = table_name
        self.fields = fields
        self.header_color = header_color
        self.field_positions = {}
        
        self.draw()
    
    def draw(self):
        """Dessine la table et enregistre les positions des champs"""
        num_fields = len(self.fields)
        total_height = (num_fields + 1) * self.row_height
        
        # Ombre
        shadow = FancyBboxPatch(
            (self.x + 0.12, self.y - total_height - 0.12), self.width, total_height,
            boxstyle="round,pad=0.02,rounding_size=0.08",
            facecolor='#888888', edgecolor='none', alpha=0.4
        )
        self.ax.add_patch(shadow)
        
        # Fond de la table
        table_bg = FancyBboxPatch(
            (self.x, self.y - total_height), self.width, total_height,
            boxstyle="round,pad=0.02,rounding_size=0.08",
            facecolor='white', edgecolor='#1a202c', linewidth=2.5
        )
        self.ax.add_patch(table_bg)
        
        # En-tête
        header = FancyBboxPatch(
            (self.x, self.y - self.row_height), self.width, self.row_height,
            boxstyle="round,pad=0.02,rounding_size=0.08",
            facecolor=self.header_color, edgecolor='#1a202c', linewidth=2.5
        )
        self.ax.add_patch(header)
        
        # Nom de la table
        self.ax.text(self.x + self.width/2, self.y - self.row_height/2, self.table_name, 
                fontsize=13, fontweight='bold', ha='center', va='center', color='white')
        
        # Dessiner les champs et enregistrer leurs positions
        for i, (field_name, field_type, key_type) in enumerate(self.fields):
            row_y = self.y - (i + 1.5) * self.row_height
            
            # Enregistrer la position du champ (gauche et droite)
            self.field_positions[field_name] = {
                'left': (self.x, row_y),
                'right': (self.x + self.width, row_y),
                'center': (self.x + self.width/2, row_y)
            }
            
            # Fond alterné
            if i % 2 == 0:
                row_bg = patches.Rectangle(
                    (self.x + 0.03, row_y - self.row_height/2 + 0.03), 
                    self.width - 0.06, self.row_height - 0.06,
                    facecolor='#f0f4f8', edgecolor='none'
                )
                self.ax.add_patch(row_bg)
            
            # Icône pour les clés
            icon_x = self.x + 0.22
            if key_type == 'PK':
                self.ax.plot(icon_x, row_y, 'o', color='#fbbf24', markersize=12, 
                       markeredgecolor='#b45309', markeredgewidth=2)
                self.ax.text(icon_x, row_y, 'P', fontsize=8, ha='center', va='center', 
                       fontweight='bold', color='#78350f')
            elif key_type == 'FK':
                self.ax.plot(icon_x, row_y, 's', color='#60a5fa', markersize=12, 
                       markeredgecolor='#2563eb', markeredgewidth=2)
                self.ax.text(icon_x, row_y, 'F', fontsize=8, ha='center', va='center', 
                       fontweight='bold', color='#1e3a8a')
            
            # Nom du champ
            name_color = '#b45309' if key_type == 'PK' else '#2563eb' if key_type == 'FK' else '#1a202c'
            self.ax.text(self.x + 0.5, row_y, field_name, fontsize=10, ha='left', va='center', 
                    color=name_color, fontweight='bold' if key_type else 'normal')
            
            # Type du champ
            self.ax.text(self.x + self.width - 0.15, row_y, field_type, fontsize=8, 
                    ha='right', va='center', color='#6b7280')
    
    def get_field_pos(self, field_name, side='left'):
        """Retourne la position d'un champ"""
        if field_name in self.field_positions:
            return self.field_positions[field_name][side]
        return None


def draw_field_relation(ax, from_table, from_field, to_table, to_field, color, label_offset=(0, 0.3)):
    """Dessine une relation entre deux champs spécifiques avec étiquette"""
    
    # Obtenir les positions
    start = from_table.get_field_pos(from_field, 'right' if from_table.x < to_table.x else 'left')
    end = to_table.get_field_pos(to_field, 'left' if from_table.x < to_table.x else 'right')
    
    if start is None or end is None:
        print(f"Warning: Could not find field positions for {from_field} -> {to_field}")
        return
    
    # Calculer la courbure en fonction de la distance
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    
    # Courbure adaptative
    if abs(dx) < 1:
        curved = 0
    elif dy > 0:
        curved = -0.15
    else:
        curved = 0.15
    
    # Dessiner la flèche
    arrow = FancyArrowPatch(
        start, end,
        arrowstyle='-|>',
        mutation_scale=18,
        color=color,
        linewidth=2.5,
        connectionstyle=f"arc3,rad={curved}"
    )
    ax.add_patch(arrow)
    
    # Calculer position du label
    mid_x = (start[0] + end[0]) / 2 + label_offset[0]
    mid_y = (start[1] + end[1]) / 2 + label_offset[1]
    
    # Dessiner le label
    ax.text(mid_x, mid_y, f"{from_field} → {to_field}", fontsize=7, ha='center', va='center',
            color='white', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.25', facecolor=color, edgecolor='white', 
                     linewidth=1.5, alpha=0.95))


def generate_schema():
    """Génère le schéma avec flèches pointant vers les champs exacts"""
    
    fig, ax = plt.subplots(figsize=(28, 22))
    ax.set_xlim(-2, 30)
    ax.set_ylim(-24, 3)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_facecolor('#e8eef4')
    fig.patch.set_facecolor('#e8eef4')
    
    # ==================
    # TITRE
    # ==================
    title_box = FancyBboxPatch(
        (5, 1), 22, 1.8,
        boxstyle="round,pad=0.1,rounding_size=0.2",
        facecolor='#1e3a5f', edgecolor='#2c5282', linewidth=4
    )
    ax.add_patch(title_box)
    
    ax.text(16, 2.2, 'SCHÉMA DE LA BASE DE DONNÉES', 
            fontsize=24, fontweight='bold', ha='center', va='center', color='white')
    ax.text(16, 1.4, 'SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', 
            fontsize=14, ha='center', va='center', color='#90cdf4', style='italic')
    
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
    user_table = TableDrawer(ax, 0, 0, 'USER', user_fields, '#1e40af')
    
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
    client_table = TableDrawer(ax, 10, 0, 'CLIENT', client_fields, '#166534')
    
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
    produit_table = TableDrawer(ax, 20, 0, 'PRODUIT', produit_fields, '#c2410c')
    
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
    commande_table = TableDrawer(ax, 0, -7, 'COMMANDE', commande_fields, '#dc2626')
    
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
    vente_table = TableDrawer(ax, 10, -7, 'VENTE', vente_fields, '#7c3aed')
    
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
    mouvement_table = TableDrawer(ax, 20, -7, 'MOUVEMENT_STOCK', mouvement_fields, '#0891b2')
    
    # ==================
    # TABLES - NIVEAU 3 (Détails)
    # ==================
    
    # ITEM_COMMANDE
    item_cmd_fields = [
        ('id', 'INTEGER', 'PK'),
        ('commande_id', 'INTEGER', 'FK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('quantite', 'INTEGER', ''),
        ('prix_unitaire', 'DECIMAL(10,2)', ''),
        ('sous_total', 'DECIMAL(12,2)', ''),
    ]
    item_cmd_table = TableDrawer(ax, 0, -14, 'ITEM_COMMANDE', item_cmd_fields, '#be123c')
    
    # PAIEMENT_COMMANDE
    paiement_cmd_fields = [
        ('id', 'INTEGER', 'PK'),
        ('commande_id', 'INTEGER', 'FK'),
        ('recu_par_id', 'INTEGER', 'FK'),
        ('montant', 'DECIMAL(12,2)', ''),
        ('methode', 'VARCHAR(20)', ''),
        ('date_paiement', 'DATETIME', ''),
    ]
    paiement_cmd_table = TableDrawer(ax, 7, -14, 'PAIEMENT_COMMANDE', paiement_cmd_fields, '#9f1239')
    
    # LIGNE_VENTE
    ligne_vente_fields = [
        ('id', 'INTEGER', 'PK'),
        ('vente_id', 'INTEGER', 'FK'),
        ('produit_id', 'INTEGER', 'FK'),
        ('quantite', 'DECIMAL(10,2)', ''),
        ('prix_unitaire', 'DECIMAL(12,2)', ''),
        ('montant', 'DECIMAL(12,2)', ''),
    ]
    ligne_vente_table = TableDrawer(ax, 14, -14, 'LIGNE_VENTE', ligne_vente_fields, '#6d28d9')
    
    # PAIEMENT
    paiement_fields = [
        ('id', 'INTEGER', 'PK'),
        ('vente_id', 'INTEGER', 'FK'),
        ('recu_par_id', 'INTEGER', 'FK'),
        ('montant', 'DECIMAL(12,2)', ''),
        ('methode', 'VARCHAR(20)', ''),
        ('date_paiement', 'DATETIME', ''),
    ]
    paiement_table = TableDrawer(ax, 21, -14, 'PAIEMENT', paiement_fields, '#4c1d95')
    
    # ==================
    # RELATIONS VERS LES CHAMPS EXACTS
    # ==================
    
    # === Relations vers CLIENT.id (Vert) ===
    draw_field_relation(ax, commande_table, 'client_id', client_table, 'id', '#16a34a', (1, 0.3))
    draw_field_relation(ax, vente_table, 'client_id', client_table, 'id', '#16a34a', (0, 0.3))
    
    # === Relations vers USER.id (Bleu) ===
    draw_field_relation(ax, commande_table, 'vendeur_id', user_table, 'id', '#2563eb', (-1, 0.3))
    draw_field_relation(ax, vente_table, 'vendeur_id', user_table, 'id', '#2563eb', (-1, 0.5))
    draw_field_relation(ax, mouvement_table, 'utilisateur_id', user_table, 'id', '#2563eb', (0, 0.5))
    draw_field_relation(ax, paiement_cmd_table, 'recu_par_id', user_table, 'id', '#2563eb', (-2, 0.5))
    draw_field_relation(ax, paiement_table, 'recu_par_id', user_table, 'id', '#2563eb', (0, -0.5))
    
    # === Relations vers PRODUIT.id (Orange) ===
    draw_field_relation(ax, mouvement_table, 'produit_id', produit_table, 'id', '#ea580c', (0.5, 0.3))
    draw_field_relation(ax, item_cmd_table, 'produit_id', produit_table, 'id', '#ea580c', (2, 0.5))
    draw_field_relation(ax, ligne_vente_table, 'produit_id', produit_table, 'id', '#ea580c', (1, 0.5))
    
    # === Relations vers COMMANDE.id (Rouge) ===
    draw_field_relation(ax, item_cmd_table, 'commande_id', commande_table, 'id', '#dc2626', (-0.5, 0.3))
    draw_field_relation(ax, paiement_cmd_table, 'commande_id', commande_table, 'id', '#dc2626', (0.5, 0.3))
    
    # === Relations vers VENTE.id (Violet) ===
    draw_field_relation(ax, ligne_vente_table, 'vente_id', vente_table, 'id', '#7c3aed', (-0.5, 0.3))
    draw_field_relation(ax, paiement_table, 'vente_id', vente_table, 'id', '#7c3aed', (0.5, 0.3))
    
    # ==================
    # LÉGENDE
    # ==================
    legend_y = -19.5
    
    legend_box = FancyBboxPatch(
        (0, legend_y - 3.8), 28, 3.6,
        boxstyle="round,pad=0.1,rounding_size=0.15",
        facecolor='white', edgecolor='#2d3748', linewidth=2.5
    )
    ax.add_patch(legend_box)
    
    ax.text(0.5, legend_y - 0.5, 'LÉGENDE', fontsize=15, fontweight='bold', color='#1a202c')
    
    # Clés
    ax.plot(0.8, legend_y - 1.5, 'o', color='#fbbf24', markersize=16, 
           markeredgecolor='#b45309', markeredgewidth=2.5)
    ax.text(0.8, legend_y - 1.5, 'P', fontsize=10, ha='center', va='center', 
           fontweight='bold', color='#78350f')
    ax.text(1.5, legend_y - 1.5, '= Clé Primaire (Primary Key)', fontsize=12, va='center')
    
    ax.plot(9, legend_y - 1.5, 's', color='#60a5fa', markersize=16, 
           markeredgecolor='#2563eb', markeredgewidth=2.5)
    ax.text(9, legend_y - 1.5, 'F', fontsize=10, ha='center', va='center', 
           fontweight='bold', color='#1e3a8a')
    ax.text(9.7, legend_y - 1.5, '= Clé Étrangère (Foreign Key)', fontsize=12, va='center')
    
    # Relations par couleur
    relations = [
        ('#16a34a', 'CLIENT', 0.5),
        ('#2563eb', 'USER', 6),
        ('#ea580c', 'PRODUIT', 11),
        ('#dc2626', 'COMMANDE', 16.5),
        ('#7c3aed', 'VENTE', 22.5),
    ]
    
    for color, target, x_pos in relations:
        ax.annotate('', xy=(x_pos + 1.2, legend_y - 2.5), xytext=(x_pos, legend_y - 2.5),
                    arrowprops=dict(arrowstyle='-|>', color=color, lw=3.5, mutation_scale=18))
        ax.text(x_pos + 1.5, legend_y - 2.5, f'→ {target}', fontsize=11, va='center', 
               color=color, fontweight='bold')
    
    # Note
    ax.text(0.5, legend_y - 3.4, 
            'Les étiquettes indiquent: champ_source → champ_cible  |  Cardinalité: 1 ────► N (Un-à-Plusieurs)', 
            fontsize=11, va='center', color='#4a5568', style='italic')
    
    # Footer
    ax.text(14, legend_y - 4.5, '© SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace - 2025', 
            fontsize=12, ha='center', color='#718096', style='italic')
    
    # ==================
    # SAUVEGARDE
    # ==================
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    png_path = os.path.join(output_dir, 'schema_base_donnees.png')
    plt.savefig(png_path, dpi=300, bbox_inches='tight', facecolor='#e8eef4', edgecolor='none')
    print(f"✅ PNG: {png_path}")
    
    jpeg_path = os.path.join(output_dir, 'schema_base_donnees.jpg')
    plt.savefig(jpeg_path, dpi=300, bbox_inches='tight', facecolor='#e8eef4', format='jpeg')
    print(f"✅ JPEG: {jpeg_path}")
    
    pdf_path = os.path.join(output_dir, 'schema_base_donnees.pdf')
    plt.savefig(pdf_path, bbox_inches='tight', facecolor='#e8eef4', format='pdf')
    print(f"✅ PDF: {pdf_path}")
    
    plt.close()
    return output_dir


if __name__ == '__main__':
    print("=" * 70)
    print("   GÉNÉRATION DU SCHÉMA DE BASE DE DONNÉES SYGLA-H2O")
    print("   Flèches pointant vers les champs exacts")
    print("=" * 70)
    
    try:
        output = generate_schema()
        print("\n" + "=" * 70)
        print("   ✅ SCHÉMA GÉNÉRÉ AVEC SUCCÈS!")
        print("=" * 70)
        print(f"\n📁 Dossier: {output}")
        print("\n📄 Fichiers créés:")
        print("   • schema_base_donnees.png")
        print("   • schema_base_donnees.jpg")
        print("   • schema_base_donnees.pdf")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

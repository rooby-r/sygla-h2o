"""
Génération du diagramme de communication pour CreateProductPage()
SYGLA-H2O - Système de Gestion d'Eau Potable et Glace
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
import numpy as np

# Configuration de la figure
fig, ax = plt.subplots(1, 1, figsize=(20, 16))
ax.set_xlim(0, 20)
ax.set_ylim(0, 16)
ax.set_aspect('equal')
ax.axis('off')

# Couleurs
colors = {
    'actor': '#FFD93D',
    'react_component': '#61DAFB',
    'service': '#8B5CF6',
    'axios': '#5A45FF',
    'storage': '#10B981',
    'django_view': '#092E20',
    'serializer': '#FF6B6B',
    'model': '#F59E0B',
    'database': '#3B82F6',
    'logger': '#EC4899',
    'context': '#06B6D4',
    'toast': '#84CC16',
    'router': '#F97316',
    'auth': '#EF4444',
    'hook': '#A855F7'
}

def draw_object(ax, x, y, width, height, label, sublabel, color, text_color='white'):
    """Dessine un objet/composant du diagramme"""
    rect = FancyBboxPatch((x - width/2, y - height/2), width, height,
                          boxstyle="round,pad=0.03,rounding_size=0.2",
                          facecolor=color, edgecolor='white', linewidth=2)
    ax.add_patch(rect)
    
    # Label principal
    ax.text(x, y + 0.15, label, ha='center', va='center', fontsize=9,
            fontweight='bold', color=text_color)
    # Sous-label
    if sublabel:
        ax.text(x, y - 0.25, sublabel, ha='center', va='center', fontsize=7,
                color=text_color, style='italic')

def draw_actor(ax, x, y, label):
    """Dessine un acteur (stick figure)"""
    # Tête
    circle = Circle((x, y + 0.5), 0.25, facecolor=colors['actor'], edgecolor='black', linewidth=2)
    ax.add_patch(circle)
    # Corps
    ax.plot([x, x], [y + 0.25, y - 0.3], color='black', linewidth=2)
    # Bras
    ax.plot([x - 0.3, x + 0.3], [y + 0.1, y + 0.1], color='black', linewidth=2)
    # Jambes
    ax.plot([x, x - 0.25], [y - 0.3, y - 0.7], color='black', linewidth=2)
    ax.plot([x, x + 0.25], [y - 0.3, y - 0.7], color='black', linewidth=2)
    # Label
    ax.text(x, y - 1, label, ha='center', va='center', fontsize=9, fontweight='bold')

def draw_message(ax, x1, y1, x2, y2, number, message, color='#374151', offset=0.15, curved=False):
    """Dessine une flèche de message avec numérotation"""
    if curved:
        style = "arc3,rad=0.2"
    else:
        style = "arc3,rad=0"
    
    arrow = FancyArrowPatch((x1, y1), (x2, y2),
                            arrowstyle='->', mutation_scale=15,
                            color=color, linewidth=1.5,
                            connectionstyle=style)
    ax.add_patch(arrow)
    
    # Position du texte
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2 + offset
    
    # Numéro du message
    ax.text(mid_x, mid_y, f"{number}: {message}", ha='center', va='bottom',
            fontsize=7, color=color, fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='none', alpha=0.9))

def draw_database(ax, x, y, label):
    """Dessine un symbole de base de données"""
    # Cylindre
    ellipse_top = mpatches.Ellipse((x, y + 0.4), 1.4, 0.4, facecolor=colors['database'], edgecolor='white', linewidth=2)
    rect = FancyBboxPatch((x - 0.7, y - 0.4), 1.4, 0.8,
                          boxstyle="square,pad=0", facecolor=colors['database'], edgecolor='white', linewidth=2)
    ellipse_bottom = mpatches.Ellipse((x, y - 0.4), 1.4, 0.4, facecolor=colors['database'], edgecolor='white', linewidth=2)
    
    ax.add_patch(rect)
    ax.add_patch(ellipse_bottom)
    ax.add_patch(ellipse_top)
    
    ax.text(x, y, label, ha='center', va='center', fontsize=8, fontweight='bold', color='white')

# Titre
ax.text(10, 15.5, 'DIAGRAMME DE COMMUNICATION', ha='center', va='center',
        fontsize=16, fontweight='bold', color='#1F2937')
ax.text(10, 15, 'CreateProductPage()', ha='center', va='center',
        fontsize=14, fontweight='bold', color='#3B82F6')
ax.text(10, 14.5, 'SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', ha='center', va='center',
        fontsize=10, color='#6B7280', style='italic')

# ==================== OBJETS ====================

# Acteur
draw_actor(ax, 1.5, 12, ':Actor\n(Admin/Stock)')

# Frontend Components
draw_object(ax, 4.5, 12, 2.2, 1.2, 'CreateProductPage', '(React Component)', colors['react_component'], 'black')
draw_object(ax, 4.5, 9.5, 1.8, 0.9, 'useState', '(React Hook)', colors['hook'])
draw_object(ax, 7.5, 12, 1.8, 0.9, 'useProductTypes', '(Custom Hook)', colors['hook'])
draw_object(ax, 7.5, 10.5, 1.8, 0.9, 'useMeasureUnits', '(Custom Hook)', colors['hook'])

# Services & API
draw_object(ax, 10.5, 12, 2, 1, 'productService', '(api.js)', colors['service'])
draw_object(ax, 10.5, 9.5, 1.8, 0.9, 'Axios API', '(Interceptor)', colors['axios'])
draw_object(ax, 13.5, 9.5, 1.6, 0.8, 'localStorage', '(JWT Token)', colors['storage'])

# Context & Notifications
draw_object(ax, 4.5, 6.5, 2, 0.9, 'DataUpdateContext', '(React Context)', colors['context'])
draw_object(ax, 7.5, 6.5, 1.6, 0.8, 'toast', '(react-hot-toast)', colors['toast'])
draw_object(ax, 10.5, 6.5, 1.6, 0.8, 'useNavigate', '(React Router)', colors['router'])

# Backend - Cadre
backend_rect = FancyBboxPatch((12.5, 0.5), 7, 7.5,
                               boxstyle="round,pad=0.05,rounding_size=0.3",
                               facecolor='#F3F4F6', edgecolor='#092E20', linewidth=3)
ax.add_patch(backend_rect)
ax.text(16, 7.7, 'BACKEND DJANGO REST FRAMEWORK', ha='center', va='center',
        fontsize=10, fontweight='bold', color='#092E20')

# Backend Components
draw_object(ax, 14, 6.5, 1.6, 0.8, 'urls.py', '(Router)', colors['router'])
draw_object(ax, 16.5, 6.5, 1.8, 0.8, 'JWTAuth', '(Simple JWT)', colors['auth'])
draw_object(ax, 14.5, 4.5, 2.2, 1, 'ProduitListCreate', 'View (views.py)', colors['django_view'])
draw_object(ax, 17.5, 4.5, 1.8, 0.9, 'ProduitSerializer', '(serializers.py)', colors['serializer'])
draw_object(ax, 14.5, 2.5, 1.8, 0.9, 'Produit', '(models.py)', colors['model'])
draw_object(ax, 17.5, 2.5, 1.8, 0.9, 'LogService', '(logs/utils.py)', colors['logger'])

# Database
draw_database(ax, 16, 1, 'PostgreSQL')

# ==================== MESSAGES ====================

# 1: Actor -> CreateProductPage
draw_message(ax, 2.2, 12, 3.3, 12, '1', 'remplitFormulaire()', '#374151', 0.3)

# 2: CreateProductPage -> useState
draw_message(ax, 4.5, 11.3, 4.5, 10, '2', 'handleSubmit()', '#374151', 0.15)

# 2.1: useState -> CreateProductPage (retour)
ax.annotate('', xy=(4.2, 11.3), xytext=(4.2, 10),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))
ax.text(3.3, 10.6, '2.1: setLoading(true)', fontsize=6, color='#9CA3AF')

# 3: CreateProductPage validation locale
ax.text(5.8, 11.2, '3: validateForm()', fontsize=7, color='#EF4444', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#FEE2E2', edgecolor='none'))

# 4: CreateProductPage -> productService
draw_message(ax, 5.6, 12, 9.4, 12, '4', 'create(productData)', '#8B5CF6', 0.3)

# 5: productService -> Axios
draw_message(ax, 10.5, 11.4, 10.5, 10, '5', 'POST(/products/)', '#5A45FF', 0.15)

# 6: Axios -> localStorage
draw_message(ax, 11.4, 9.5, 12.6, 9.5, '6', 'getToken()', '#10B981', 0.25)

# 6.1: localStorage -> Axios (retour)
ax.annotate('', xy=(11.4, 9.3), xytext=(12.6, 9.3),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))
ax.text(11.6, 9.05, '6.1: JWT', fontsize=6, color='#9CA3AF')

# 7: Axios -> urls.py (HTTP POST)
draw_message(ax, 10.5, 9, 14, 7, '7', 'HTTP POST /api/products/', '#F97316', 0.4)

# 8: urls.py -> JWTAuth
draw_message(ax, 14.8, 6.5, 15.5, 6.5, '8', 'auth()', '#EF4444', 0.25)

# 8.1: JWTAuth -> urls.py (retour)
ax.annotate('', xy=(14.8, 6.3), xytext=(15.5, 6.3),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))
ax.text(14.9, 6.05, '8.1: user', fontsize=6, color='#9CA3AF')

# 9: urls.py -> ProduitListCreateView
draw_message(ax, 14, 6, 14.5, 5.1, '9', 'route()', '#F97316', 0.2)

# 10: ProduitListCreateView -> ProduitSerializer
draw_message(ax, 15.6, 4.5, 16.5, 4.5, '10', 'validate()', '#FF6B6B', 0.25)

# 10.1: Serializer validation retour
ax.annotate('', xy=(15.6, 4.3), xytext=(16.5, 4.3),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))
ax.text(15.7, 4.05, '10.1: valid', fontsize=6, color='#9CA3AF')

# 11: ProduitListCreateView -> Produit
draw_message(ax, 14.5, 4, 14.5, 3.1, '11', 'save()', '#F59E0B', 0.15)

# 12: Produit -> PostgreSQL
draw_message(ax, 14.5, 2, 15.3, 1.5, '12', 'INSERT', '#3B82F6', 0.2)

# 12.1: PostgreSQL -> Produit (retour)
ax.annotate('', xy=(14.7, 2), xytext=(15.5, 1.5),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))

# 13: ProduitListCreateView -> LogService
draw_message(ax, 15.5, 4.2, 17.5, 3, '13', 'create_log()', '#EC4899', 0.3)

# 14: LogService -> PostgreSQL
draw_message(ax, 17.5, 2, 16.7, 1.5, '14', 'INSERT log', '#3B82F6', 0.2)

# 15: Response back (vertical line representing response flow)
ax.annotate('', xy=(10.5, 8.5), xytext=(14, 6.8),
            arrowprops=dict(arrowstyle='->', color='#10B981', lw=2, ls='-'))
ax.text(12, 8, '15: Response 201', fontsize=7, color='#10B981', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#D1FAE5', edgecolor='none'))

# 16: productService -> CreateProductPage
draw_message(ax, 9.4, 11.7, 5.6, 11.7, '16', 'return data', '#8B5CF6', 0.3)

# 17: CreateProductPage -> DataUpdateContext
draw_message(ax, 4.5, 11.3, 4.5, 7, '17', 'onProductCreated()', '#06B6D4', 0.15)

# 18: CreateProductPage -> toast
draw_message(ax, 5.5, 11.3, 7.5, 7, '18', 'success()', '#84CC16', 0.2)

# 19: CreateProductPage -> useNavigate
draw_message(ax, 5.6, 11.5, 10.5, 7, '19', 'navigate(/products)', '#F97316', 0.3)

# Hooks initialization (dashed lines)
ax.annotate('', xy=(6.5, 12), xytext=(7.5, 11.7),
            arrowprops=dict(arrowstyle='->', color='#A855F7', lw=1.2, ls=':'))
ax.text(6.8, 12.2, 'init', fontsize=6, color='#A855F7')

ax.annotate('', xy=(6.5, 11.5), xytext=(7.5, 10.9),
            arrowprops=dict(arrowstyle='->', color='#A855F7', lw=1.2, ls=':'))

# ==================== LÉGENDE ====================

legend_y = 0.8
legend_items = [
    (colors['react_component'], 'React Component'),
    (colors['hook'], 'React Hook'),
    (colors['service'], 'API Service'),
    (colors['axios'], 'HTTP Client'),
    (colors['storage'], 'Storage'),
    (colors['context'], 'Context'),
]

legend_items2 = [
    (colors['django_view'], 'Django View'),
    (colors['serializer'], 'Serializer'),
    (colors['model'], 'Model'),
    (colors['logger'], 'Logger'),
    (colors['database'], 'Database'),
    (colors['auth'], 'Authentication'),
]

ax.text(1, legend_y + 1.2, 'LÉGENDE:', fontsize=9, fontweight='bold', color='#374151')

for i, (color, label) in enumerate(legend_items):
    rect = FancyBboxPatch((1 + i * 1.8, legend_y), 0.4, 0.4,
                          boxstyle="round,pad=0.02", facecolor=color, edgecolor='white', linewidth=1)
    ax.add_patch(rect)
    ax.text(1.5 + i * 1.8, legend_y + 0.2, label, fontsize=7, va='center', color='#374151')

for i, (color, label) in enumerate(legend_items2):
    rect = FancyBboxPatch((1 + i * 1.8, legend_y - 0.7), 0.4, 0.4,
                          boxstyle="round,pad=0.02", facecolor=color, edgecolor='white', linewidth=1)
    ax.add_patch(rect)
    ax.text(1.5 + i * 1.8, legend_y - 0.5, label, fontsize=7, va='center', color='#374151')

# ==================== DONNÉES ÉCHANGÉES ====================

data_box = FancyBboxPatch((0.3, 2.5), 5.5, 3.5,
                           boxstyle="round,pad=0.05,rounding_size=0.2",
                           facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1)
ax.add_patch(data_box)

ax.text(3, 5.7, 'DONNÉES ÉCHANGÉES', fontsize=8, fontweight='bold', color='#1F2937', ha='center')

input_text = """ENTRÉE (productData):
{
  nom: string,
  type_produit: "eau" | "glace" | custom,
  description: string,
  prix_unitaire: decimal,
  unite_mesure: string,
  stock_actuel: integer,
  stock_minimal: integer,
  is_active: boolean
}"""

ax.text(0.5, 5.3, input_text, fontsize=6, color='#374151', va='top', family='monospace')

output_text = """SORTIE (Response 201):
{
  id, nom, code_produit,
  type_produit, prix_unitaire,
  stock_actuel, stock_minimal,
  date_creation, ...
}"""

ax.text(3.2, 4.2, output_text, fontsize=6, color='#10B981', va='top', family='monospace')

# ==================== VALIDATIONS ====================

valid_box = FancyBboxPatch((6.2, 2.5), 5.5, 3.5,
                            boxstyle="round,pad=0.05,rounding_size=0.2",
                            facecolor='#FEF3C7', edgecolor='#F59E0B', linewidth=1)
ax.add_patch(valid_box)

ax.text(9, 5.7, 'VALIDATIONS', fontsize=8, fontweight='bold', color='#92400E', ha='center')

valid_text = """FRONTEND (validateForm):
• nom: requis, pas uniquement chiffres
• prix_unitaire: > 0
• stock_actuel: >= 0
• stock_minimal: > 0

BACKEND (ProduitSerializer):
• Validation des types de données
• Génération code_produit unique
• Vérification is_active"""

ax.text(6.4, 5.3, valid_text, fontsize=6, color='#78350F', va='top')

# Sauvegarder
plt.tight_layout()
plt.savefig('docs/diagrammes/communication_create_product.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.savefig('docs/diagrammes/communication_create_product.pdf', bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("✅ Diagramme de communication CreateProductPage() généré avec succès!")
print("   - PNG: docs/diagrammes/communication_create_product.png")
print("   - PDF: docs/diagrammes/communication_create_product.pdf")

plt.show()

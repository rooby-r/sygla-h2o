"""
Génération du diagramme de communication pour CreateOrderPage()
SYGLA-H2O - Système de Gestion d'Eau Potable et Glace
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
import numpy as np

# Configuration de la figure
fig, ax = plt.subplots(1, 1, figsize=(22, 18))
ax.set_xlim(0, 22)
ax.set_ylim(0, 18)
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
    'hook': '#A855F7',
    'client_service': '#14B8A6',
    'product_service': '#6366F1'
}

def draw_object(ax, x, y, width, height, label, sublabel, color, text_color='white'):
    """Dessine un objet/composant du diagramme"""
    rect = FancyBboxPatch((x - width/2, y - height/2), width, height,
                          boxstyle="round,pad=0.03,rounding_size=0.2",
                          facecolor=color, edgecolor='white', linewidth=2)
    ax.add_patch(rect)
    
    ax.text(x, y + 0.15, label, ha='center', va='center', fontsize=8,
            fontweight='bold', color=text_color)
    if sublabel:
        ax.text(x, y - 0.25, sublabel, ha='center', va='center', fontsize=6,
                color=text_color, style='italic')

def draw_actor(ax, x, y, label):
    """Dessine un acteur (stick figure)"""
    circle = Circle((x, y + 0.5), 0.25, facecolor=colors['actor'], edgecolor='black', linewidth=2)
    ax.add_patch(circle)
    ax.plot([x, x], [y + 0.25, y - 0.3], color='black', linewidth=2)
    ax.plot([x - 0.3, x + 0.3], [y + 0.1, y + 0.1], color='black', linewidth=2)
    ax.plot([x, x - 0.25], [y - 0.3, y - 0.7], color='black', linewidth=2)
    ax.plot([x, x + 0.25], [y - 0.3, y - 0.7], color='black', linewidth=2)
    ax.text(x, y - 1, label, ha='center', va='center', fontsize=8, fontweight='bold')

def draw_message(ax, x1, y1, x2, y2, number, message, color='#374151', offset=0.15):
    """Dessine une flèche de message avec numérotation"""
    arrow = FancyArrowPatch((x1, y1), (x2, y2),
                            arrowstyle='->', mutation_scale=12,
                            color=color, linewidth=1.5)
    ax.add_patch(arrow)
    
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2 + offset
    
    ax.text(mid_x, mid_y, f"{number}: {message}", ha='center', va='bottom',
            fontsize=6, color=color, fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.15', facecolor='white', edgecolor='none', alpha=0.9))

def draw_database(ax, x, y, label):
    """Dessine un symbole de base de données"""
    ellipse_top = mpatches.Ellipse((x, y + 0.4), 1.4, 0.4, facecolor=colors['database'], edgecolor='white', linewidth=2)
    rect = FancyBboxPatch((x - 0.7, y - 0.4), 1.4, 0.8,
                          boxstyle="square,pad=0", facecolor=colors['database'], edgecolor='white', linewidth=2)
    ellipse_bottom = mpatches.Ellipse((x, y - 0.4), 1.4, 0.4, facecolor=colors['database'], edgecolor='white', linewidth=2)
    
    ax.add_patch(rect)
    ax.add_patch(ellipse_bottom)
    ax.add_patch(ellipse_top)
    
    ax.text(x, y, label, ha='center', va='center', fontsize=7, fontweight='bold', color='white')

# Titre
ax.text(11, 17.5, 'DIAGRAMME DE COMMUNICATION', ha='center', va='center',
        fontsize=16, fontweight='bold', color='#1F2937')
ax.text(11, 17, 'CreateOrderPage()', ha='center', va='center',
        fontsize=14, fontweight='bold', color='#3B82F6')
ax.text(11, 16.5, 'SYGLA-H2O - Système de Gestion d\'Eau Potable et Glace', ha='center', va='center',
        fontsize=10, color='#6B7280', style='italic')

# ==================== OBJETS ====================

# Acteur
draw_actor(ax, 1.5, 14, ':Actor\n(Vendeur)')

# Frontend Components - Page principale
draw_object(ax, 4.5, 14, 2.2, 1.2, 'CreateOrderPage', '(React Component)', colors['react_component'], 'black')

# Hooks et State
draw_object(ax, 4.5, 11.5, 1.6, 0.8, 'useState', '(React Hooks)', colors['hook'])
draw_object(ax, 7, 14, 1.6, 0.8, 'useEffect', '(Initial Load)', colors['hook'])
draw_object(ax, 7, 11.5, 1.8, 0.8, 'useDataUpdate', '(Context)', colors['context'])

# Services Frontend
draw_object(ax, 10, 15.5, 1.8, 0.8, 'clientService', '(api.js)', colors['client_service'])
draw_object(ax, 10, 14, 1.8, 0.8, 'productService', '(api.js)', colors['product_service'])
draw_object(ax, 10, 12.5, 1.8, 0.8, 'orderService', '(api.js)', colors['service'])

# Axios et Storage
draw_object(ax, 13, 14, 1.6, 0.8, 'Axios API', '(Interceptor)', colors['axios'])
draw_object(ax, 13, 11.5, 1.5, 0.7, 'localStorage', '(JWT Token)', colors['storage'])

# Notifications et Navigation
draw_object(ax, 4.5, 8.5, 1.5, 0.7, 'toast', '(react-hot-toast)', colors['toast'])
draw_object(ax, 7, 8.5, 1.6, 0.7, 'useNavigate', '(React Router)', colors['router'])

# Backend - Cadre
backend_rect = FancyBboxPatch((14.5, 1), 7, 12,
                               boxstyle="round,pad=0.05,rounding_size=0.3",
                               facecolor='#F3F4F6', edgecolor='#092E20', linewidth=3)
ax.add_patch(backend_rect)
ax.text(18, 12.7, 'BACKEND DJANGO REST FRAMEWORK', ha='center', va='center',
        fontsize=10, fontweight='bold', color='#092E20')

# Backend Components
draw_object(ax, 16, 11.5, 1.5, 0.7, 'urls.py', '(Router)', colors['router'])
draw_object(ax, 18.5, 11.5, 1.6, 0.7, 'JWTAuth', '(Simple JWT)', colors['auth'])

draw_object(ax, 16, 9.5, 2.2, 0.9, 'CommandeListCreate', 'View (views.py)', colors['django_view'])
draw_object(ax, 19, 9.5, 2, 0.8, 'CommandeSerializer', '(serializers.py)', colors['serializer'])

draw_object(ax, 16, 7, 1.8, 0.8, 'Commande', '(models.py)', colors['model'])
draw_object(ax, 19, 7, 1.8, 0.8, 'ItemCommande', '(models.py)', colors['model'])

draw_object(ax, 16, 4.5, 1.5, 0.7, 'Client', '(models.py)', colors['model'])
draw_object(ax, 19, 4.5, 1.5, 0.7, 'Produit', '(models.py)', colors['model'])

draw_object(ax, 17.5, 2.5, 1.8, 0.8, 'LogService', '(logs/utils.py)', colors['logger'])

# Database
draw_database(ax, 20.5, 5.5, 'PostgreSQL')

# ==================== PHASE 1: CHARGEMENT INITIAL ====================

# Cadre phase 1
phase1_rect = FancyBboxPatch((0.3, 9.5), 9.5, 3.5,
                              boxstyle="round,pad=0.05,rounding_size=0.2",
                              facecolor='#EFF6FF', edgecolor='#3B82F6', linewidth=1, linestyle='--')
ax.add_patch(phase1_rect)
ax.text(5, 12.7, 'PHASE 1: Chargement Initial (useEffect)', fontsize=8, fontweight='bold', color='#1E40AF')

# 1: Component Mount -> useEffect
draw_message(ax, 5.6, 14, 6.2, 14, '1', 'mount()', '#3B82F6', 0.25)

# 2: useEffect -> clientService.getAll()
draw_message(ax, 7.8, 14, 9, 15.5, '2', 'getAll()', '#14B8A6', 0.3)

# 3: useEffect -> productService.getAll()
draw_message(ax, 7.8, 13.8, 9, 14, '3', 'getAll()', '#6366F1', 0.15)

# 4: Services -> Axios (Promise.all)
draw_message(ax, 10.9, 15, 12.2, 14.3, '4', 'GET /clients/', '#5A45FF', 0.3)
draw_message(ax, 10.9, 14, 12.2, 14, '5', 'GET /products/', '#5A45FF', 0.15)

# 6: Axios -> localStorage
draw_message(ax, 13, 13.5, 13, 12, '6', 'getToken()', '#10B981', 0.15)

# Retour des données
ax.annotate('', xy=(7, 13.5), xytext=(9, 15),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))
ax.text(7.5, 14.5, '7: clients[]', fontsize=6, color='#14B8A6')

ax.annotate('', xy=(7, 13.3), xytext=(9, 13.8),
            arrowprops=dict(arrowstyle='->', color='#9CA3AF', lw=1.2, ls='--'))
ax.text(7.5, 13.3, '8: products[]', fontsize=6, color='#6366F1')

# 9: setClients, setProducts
draw_message(ax, 5.6, 13.5, 5.2, 12, '9', 'setState()', '#A855F7', 0.15)

# ==================== PHASE 2: SOUMISSION COMMANDE ====================

# 10: Actor -> CreateOrderPage
draw_message(ax, 2.2, 14, 3.4, 14, '10', 'handleSubmit()', '#374151', 0.35)

# 11: Validation locale
ax.text(3.8, 13.2, '11: validateForm()', fontsize=7, color='#EF4444', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#FEE2E2', edgecolor='none'))

# 12: CreateOrderPage -> orderService
draw_message(ax, 5.6, 13.8, 9, 12.5, '12', 'create(orderData)', '#8B5CF6', 0.25)

# 13: orderService -> Axios
draw_message(ax, 10.9, 12.5, 12.2, 13.8, '13', 'POST /orders/', '#5A45FF', 0.25)

# 14: Axios -> Backend (HTTP)
draw_message(ax, 13.8, 14, 15.2, 11.5, '14', 'HTTP POST', '#F97316', 0.35)

# 15: urls.py -> JWTAuth
draw_message(ax, 16.8, 11.5, 17.6, 11.5, '15', 'auth()', '#EF4444', 0.2)

# 16: urls.py -> CommandeListCreateView
draw_message(ax, 16, 11, 16, 10, '16', 'route()', '#F97316', 0.15)

# 17: View -> Serializer
draw_message(ax, 17.1, 9.5, 17.9, 9.5, '17', 'validate()', '#FF6B6B', 0.2)

# 18: Serializer -> Client (FK validation)
draw_message(ax, 19, 9, 16.5, 5, '18', 'get_client()', '#F59E0B', 0.3)

# 19: Serializer -> Produit (items validation)
draw_message(ax, 19.5, 9, 19.5, 5, '19', 'get_products()', '#F59E0B', 0.15)

# 20: View -> Commande.save()
draw_message(ax, 16, 9, 16, 7.5, '20', 'save()', '#F59E0B', 0.15)

# 21: Commande -> ItemCommande (cascade)
draw_message(ax, 16.9, 7, 18.1, 7, '21', 'create_items()', '#F59E0B', 0.2)

# 22: Models -> PostgreSQL
draw_message(ax, 17, 6.5, 19.8, 5.8, '22', 'INSERT', '#3B82F6', 0.25)
draw_message(ax, 19.5, 6.5, 20.2, 5.8, '23', 'INSERT items', '#3B82F6', 0.15)

# 24: View -> LogService
draw_message(ax, 16.5, 9.2, 17.5, 3, '24', 'create_log()', '#EC4899', 0.3)

# 25: LogService -> PostgreSQL
draw_message(ax, 18.4, 2.5, 20, 5, '25', 'INSERT log', '#3B82F6', 0.2)

# 26: Response 201
ax.annotate('', xy=(13.8, 13.5), xytext=(15.2, 11),
            arrowprops=dict(arrowstyle='->', color='#10B981', lw=2))
ax.text(13.5, 12.5, '26: Response 201', fontsize=7, color='#10B981', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#D1FAE5', edgecolor='none'))

# 27: orderService -> CreateOrderPage
draw_message(ax, 9, 12.2, 5.6, 13.5, '27', 'return data', '#8B5CF6', 0.2)

# 28: triggerDashboardUpdate
draw_message(ax, 5.5, 11.2, 6.2, 11.5, '28', 'update()', '#06B6D4', 0.15)

# 29: toast.success
draw_message(ax, 4.5, 13.3, 4.5, 9, '29', 'success()', '#84CC16', 0.15)

# 30: navigate
draw_message(ax, 5.3, 13.3, 7, 9, '30', 'navigate(/orders)', '#F97316', 0.2)

# ==================== LÉGENDE ====================

legend_y = 0.8
legend_items = [
    (colors['react_component'], 'React Component'),
    (colors['hook'], 'React Hook'),
    (colors['service'], 'Order Service'),
    (colors['client_service'], 'Client Service'),
    (colors['product_service'], 'Product Service'),
    (colors['axios'], 'HTTP Client'),
]

legend_items2 = [
    (colors['django_view'], 'Django View'),
    (colors['serializer'], 'Serializer'),
    (colors['model'], 'Model'),
    (colors['logger'], 'Logger'),
    (colors['database'], 'Database'),
    (colors['auth'], 'Authentication'),
]

ax.text(0.5, legend_y + 1.2, 'LÉGENDE:', fontsize=9, fontweight='bold', color='#374151')

for i, (color, label) in enumerate(legend_items):
    rect = FancyBboxPatch((0.5 + i * 2.2, legend_y), 0.4, 0.4,
                          boxstyle="round,pad=0.02", facecolor=color, edgecolor='white', linewidth=1)
    ax.add_patch(rect)
    ax.text(1 + i * 2.2, legend_y + 0.2, label, fontsize=6, va='center', color='#374151')

for i, (color, label) in enumerate(legend_items2):
    rect = FancyBboxPatch((0.5 + i * 2.2, legend_y - 0.7), 0.4, 0.4,
                          boxstyle="round,pad=0.02", facecolor=color, edgecolor='white', linewidth=1)
    ax.add_patch(rect)
    ax.text(1 + i * 2.2, legend_y - 0.5, label, fontsize=6, va='center', color='#374151')

# ==================== DONNÉES ÉCHANGÉES ====================

data_box = FancyBboxPatch((0.3, 2.5), 6, 5.5,
                           boxstyle="round,pad=0.05,rounding_size=0.2",
                           facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1)
ax.add_patch(data_box)

ax.text(3.3, 7.7, 'DONNÉES ÉCHANGÉES', fontsize=8, fontweight='bold', color='#1F2937', ha='center')

input_text = """ENTRÉE (orderData):
{
  client_id: integer,
  date_livraison_prevue: date | null,
  date_echeance: date | null,
  type_livraison: "retrait_magasin" 
                 | "livraison_domicile",
  frais_livraison: decimal (si livraison),
  notes: string,
  items: [
    { produit_id, quantite, prix_unitaire }
  ]
}"""

ax.text(0.5, 7.4, input_text, fontsize=5.5, color='#374151', va='top', family='monospace')

output_text = """SORTIE (Response 201):
{
  id, numero_commande,
  client: {...},
  items: [...],
  montant_produits,
  frais_livraison,
  montant_total,
  statut: "attente",
  date_creation, ...
}"""

ax.text(0.5, 4, output_text, fontsize=5.5, color='#10B981', va='top', family='monospace')

# ==================== VALIDATIONS ====================

valid_box = FancyBboxPatch((6.8, 2.5), 6.5, 5.5,
                            boxstyle="round,pad=0.05,rounding_size=0.2",
                            facecolor='#FEF3C7', edgecolor='#F59E0B', linewidth=1)
ax.add_patch(valid_box)

ax.text(10, 7.7, 'VALIDATIONS & WORKFLOW', fontsize=8, fontweight='bold', color='#92400E', ha='center')

valid_text = """FRONTEND (validateForm):
• client_id: requis
• items[]: au moins 1 produit
• quantité vs stock disponible
• date_livraison si type=livraison_domicile
• date_echeance <= date_livraison

BACKEND (CommandeSerializer):
• Validation FK client (existe, actif)
• Validation FK produit pour chaque item
• Calcul automatique montants
• Génération numero_commande unique

WORKFLOW:
attente → validee → en_preparation 
→ en_livraison → livree"""

ax.text(7, 7.4, valid_text, fontsize=5.5, color='#78350F', va='top')

# Sauvegarder
plt.tight_layout()
plt.savefig('docs/diagrammes/communication_create_order.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.savefig('docs/diagrammes/communication_create_order.pdf', bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("✅ Diagramme de communication CreateOrderPage() généré avec succès!")
print("   - PNG: docs/diagrammes/communication_create_order.png")
print("   - PDF: docs/diagrammes/communication_create_order.pdf")

plt.show()

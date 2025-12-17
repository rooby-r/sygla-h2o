"""
Génération du diagramme de communication pour CreateClientPage()
"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# Configuration de la figure
fig, ax = plt.subplots(1, 1, figsize=(20, 16))
ax.set_xlim(0, 20)
ax.set_ylim(0, 16)
ax.set_aspect('equal')
ax.axis('off')

# Titre
ax.text(10, 15.5, 'Diagramme de Communication - CreateClientPage()', 
        fontsize=16, fontweight='bold', ha='center', va='center',
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#2563EB', edgecolor='#1E40AF', linewidth=2),
        color='white')

# Couleurs
colors = {
    'actor': '#F59E0B',
    'frontend': '#10B981',
    'service': '#6366F1',
    'backend': '#EF4444',
    'database': '#8B5CF6',
    'arrow': '#374151'
}

# Fonction pour dessiner un objet (rectangle avec nom)
def draw_object(ax, x, y, width, height, name, stereotype, color):
    rect = FancyBboxPatch((x - width/2, y - height/2), width, height,
                          boxstyle="round,pad=0.02,rounding_size=0.1",
                          facecolor=color, edgecolor='#1F2937', linewidth=2, alpha=0.9)
    ax.add_patch(rect)
    ax.text(x, y + 0.15, f':{name}', fontsize=9, ha='center', va='center', fontweight='bold', color='white')
    ax.text(x, y - 0.2, f'«{stereotype}»', fontsize=7, ha='center', va='center', color='white', style='italic')

# Fonction pour dessiner une flèche avec message
def draw_message(ax, x1, y1, x2, y2, num, message, color='#374151', offset=0.15):
    # Dessiner la flèche
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
    # Calculer le milieu pour le texte
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2 + offset
    ax.text(mid_x, mid_y, f'{num}: {message}', fontsize=7, ha='center', va='bottom',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='#D1D5DB', alpha=0.95))

# ============== OBJETS ==============

# Acteur (Vendeur/Admin)
actor_x, actor_y = 2, 13
ax.plot([actor_x], [actor_y + 0.5], 'o', markersize=15, color=colors['actor'], markeredgecolor='#1F2937', markeredgewidth=2)
ax.plot([actor_x, actor_x], [actor_y + 0.3, actor_y - 0.3], color='#1F2937', linewidth=2)
ax.plot([actor_x - 0.3, actor_x + 0.3], [actor_y + 0.1, actor_y + 0.1], color='#1F2937', linewidth=2)
ax.plot([actor_x - 0.3, actor_x], [actor_y - 0.7, actor_y - 0.3], color='#1F2937', linewidth=2)
ax.plot([actor_x + 0.3, actor_x], [actor_y - 0.7, actor_y - 0.3], color='#1F2937', linewidth=2)
ax.text(actor_x, actor_y - 1.1, ':Utilisateur\n(Admin/Vendeur)', fontsize=8, ha='center', va='top', fontweight='bold')

# Frontend Components
draw_object(ax, 5, 13, 2.2, 0.9, 'CreateClientPage', 'React Component', colors['frontend'])
draw_object(ax, 8.5, 13, 1.8, 0.9, 'useState', 'React Hook', colors['frontend'])
draw_object(ax, 5, 10.5, 2, 0.9, 'clientService', 'API Service', colors['service'])
draw_object(ax, 8.5, 10.5, 1.8, 0.9, 'Axios', 'HTTP Client', colors['service'])
draw_object(ax, 12, 10.5, 1.8, 0.9, 'localStorage', 'Web Storage', colors['service'])

# Backend Components
draw_object(ax, 5, 7.5, 2, 0.9, 'urls.py', 'URL Router', colors['backend'])
draw_object(ax, 8.5, 7.5, 2.2, 0.9, 'JWTAuth', 'Authentication', colors['backend'])
draw_object(ax, 5, 5, 2.5, 0.9, 'ClientListCreateView', 'API View', colors['backend'])
draw_object(ax, 9, 5, 2.2, 0.9, 'ClientSerializer', 'Serializer', colors['backend'])
draw_object(ax, 13, 5, 2, 0.9, 'Validators', 'Validation', colors['backend'])

# Models & Database
draw_object(ax, 5, 2.5, 2, 0.9, 'Client', 'Django Model', colors['database'])
draw_object(ax, 9, 2.5, 2, 0.9, 'PostgreSQL', 'Database', colors['database'])
draw_object(ax, 13, 2.5, 2, 0.9, 'LogService', 'Logging', colors['database'])

# Response Components
draw_object(ax, 14, 13, 2.2, 0.9, 'DataUpdateContext', 'React Context', colors['frontend'])
draw_object(ax, 17.5, 13, 1.8, 0.9, 'toast', 'Notification', colors['frontend'])
draw_object(ax, 17.5, 10.5, 1.8, 0.9, 'useNavigate', 'Router', colors['frontend'])

# ============== MESSAGES ==============

# 1: Utilisateur -> CreateClientPage
draw_message(ax, 2.5, 13, 3.8, 13, '1', 'remplitFormulaire()', offset=0.3)

# 2: CreateClientPage -> useState
draw_message(ax, 6.2, 13, 7.5, 13, '2', 'handleSubmit()', offset=0.3)

# 3: CreateClientPage -> clientService
draw_message(ax, 5, 12.5, 5, 11, '3', 'create(clientData)')

# 4: clientService -> Axios
draw_message(ax, 6.1, 10.5, 7.5, 10.5, '4', 'POST()', offset=0.25)

# 5: Axios -> localStorage
draw_message(ax, 9.5, 10.5, 11, 10.5, '5', 'getToken()', offset=0.25)

# 6: Axios -> urls.py (HTTP)
draw_message(ax, 8.5, 10, 5.5, 8, '6', 'HTTP POST /api/clients/')

# 7: urls.py -> JWTAuth
draw_message(ax, 6.1, 7.5, 7.3, 7.5, '7', 'authenticate()', offset=0.25)

# 8: urls.py -> ClientListCreateView
draw_message(ax, 5, 7, 5, 5.5, '8', 'route()')

# 9: ClientListCreateView -> ClientSerializer
draw_message(ax, 6.4, 5, 7.8, 5, '9', 'create()', offset=0.25)

# 10: ClientSerializer -> Validators
draw_message(ax, 10.2, 5, 11.9, 5, '10', 'validate()', offset=0.25)

# 11: ClientSerializer -> Client
draw_message(ax, 9, 4.5, 5.5, 3, '11', 'save()')

# 12: Client -> PostgreSQL
draw_message(ax, 6.1, 2.5, 7.9, 2.5, '12', 'INSERT', offset=0.25)

# 13: ClientListCreateView -> LogService
draw_message(ax, 6.4, 4.5, 12, 3, '13', 'create_log()')

# 14: LogService -> PostgreSQL
draw_message(ax, 12.9, 2.5, 10.1, 2.5, '14', 'INSERT', offset=0.25)

# Response flow
# 15: Response back to CreateClientPage
ax.annotate('', xy=(5, 12.5), xytext=(5, 8),
            arrowprops=dict(arrowstyle='->', color='#059669', lw=1.5, linestyle='--'))
ax.text(4.2, 10.2, '15: Response\n201 Created', fontsize=7, ha='center',
        bbox=dict(boxstyle='round,pad=0.2', facecolor='#D1FAE5', edgecolor='#059669'))

# 16: CreateClientPage -> DataUpdateContext
draw_message(ax, 6.2, 13, 12.8, 13, '16', 'triggerDashboardUpdate()', offset=0.5)

# 17: CreateClientPage -> toast
draw_message(ax, 6.2, 12.8, 16.5, 12.8, '17', 'success()', offset=-0.4)

# 18: CreateClientPage -> useNavigate
draw_message(ax, 6.2, 12.6, 16.5, 10.8, '18', 'navigate("/clients")')

# ============== LÉGENDE ==============
legend_x, legend_y = 16, 7
ax.text(legend_x, legend_y + 1.5, 'Légende', fontsize=10, fontweight='bold', ha='center')

legend_items = [
    (colors['actor'], 'Acteur'),
    (colors['frontend'], 'Frontend React'),
    (colors['service'], 'Services/API'),
    (colors['backend'], 'Backend Django'),
    (colors['database'], 'Base de données'),
]

for i, (color, label) in enumerate(legend_items):
    rect = FancyBboxPatch((legend_x - 1.5, legend_y - i * 0.6 + 0.5), 0.4, 0.35,
                          boxstyle="round,pad=0.02", facecolor=color, edgecolor='#1F2937', linewidth=1)
    ax.add_patch(rect)
    ax.text(legend_x - 0.9, legend_y - i * 0.6 + 0.65, label, fontsize=8, ha='left', va='center')

# Cadres pour les couches
# Frontend frame
frontend_rect = mpatches.FancyBboxPatch((0.5, 9.8), 19, 5.2,
                                         boxstyle="round,pad=0.02,rounding_size=0.2",
                                         facecolor='none', edgecolor='#10B981', linewidth=2, linestyle='--')
ax.add_patch(frontend_rect)
ax.text(1, 14.7, 'FRONTEND (React)', fontsize=9, fontweight='bold', color='#10B981')

# Backend frame
backend_rect = mpatches.FancyBboxPatch((0.5, 4.2), 14.5, 4.2,
                                        boxstyle="round,pad=0.02,rounding_size=0.2",
                                        facecolor='none', edgecolor='#EF4444', linewidth=2, linestyle='--')
ax.add_patch(backend_rect)
ax.text(1, 8.1, 'BACKEND (Django REST)', fontsize=9, fontweight='bold', color='#EF4444')

# Database frame
db_rect = mpatches.FancyBboxPatch((0.5, 1.8), 14.5, 1.6,
                                   boxstyle="round,pad=0.02,rounding_size=0.2",
                                   facecolor='none', edgecolor='#8B5CF6', linewidth=2, linestyle='--')
ax.add_patch(db_rect)
ax.text(1, 3.1, 'PERSISTANCE', fontsize=9, fontweight='bold', color='#8B5CF6')

# Note explicative
note_text = """Flux de création d'un client:
1-2: Soumission du formulaire
3-5: Appel API avec authentification JWT
6-10: Validation et traitement backend
11-14: Persistance en base de données
15-18: Réponse et mise à jour UI"""

ax.text(16, 4.5, note_text, fontsize=7, ha='left', va='top',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='#FEF3C7', edgecolor='#F59E0B', linewidth=1),
        family='monospace')

# Sauvegarder
plt.tight_layout()
plt.savefig('docs/diagrammes/communication_create_client.png', dpi=150, bbox_inches='tight', 
            facecolor='white', edgecolor='none')
plt.savefig('docs/diagrammes/communication_create_client.pdf', bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("✅ Diagramme de communication généré avec succès!")
print("   - PNG: docs/diagrammes/communication_create_client.png")
print("   - PDF: docs/diagrammes/communication_create_client.pdf")

plt.show()

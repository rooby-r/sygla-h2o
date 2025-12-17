"""
Script pour générer le schéma de la base de données SYGLA-H2O
Génère des fichiers JPEG et PDF avec les relations entre les tables
"""

from graphviz import Digraph
import os

def generate_database_schema():
    """Génère le schéma de la base de données avec Graphviz"""
    
    # Créer le graphe
    dot = Digraph(comment='Schéma Base de Données SYGLA-H2O')
    dot.attr(rankdir='TB', size='20,15', dpi='150')
    dot.attr('node', shape='record', fontname='Arial', fontsize='10')
    dot.attr('edge', fontname='Arial', fontsize='9')
    
    # Style pour les tables
    table_style = {
        'shape': 'record',
        'style': 'filled',
        'fillcolor': 'lightblue',
        'fontname': 'Arial Bold'
    }
    
    # =====================
    # TABLE USER
    # =====================
    dot.node('User', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightblue">
            <TR><TD COLSPAN="2" BGCOLOR="darkblue"><FONT COLOR="white"><B>User</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">email</TD><TD>VARCHAR(255) UNIQUE</TD></TR>
            <TR><TD ALIGN="LEFT">username</TD><TD>VARCHAR(150)</TD></TR>
            <TR><TD ALIGN="LEFT">password</TD><TD>VARCHAR(128)</TD></TR>
            <TR><TD ALIGN="LEFT">first_name</TD><TD>VARCHAR(150)</TD></TR>
            <TR><TD ALIGN="LEFT">last_name</TD><TD>VARCHAR(150)</TD></TR>
            <TR><TD ALIGN="LEFT">role</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">telephone</TD><TD>VARCHAR(17)</TD></TR>
            <TR><TD ALIGN="LEFT">adresse</TD><TD>TEXT</TD></TR>
            <TR><TD ALIGN="LEFT">photo</TD><TD>VARCHAR(100)</TD></TR>
            <TR><TD ALIGN="LEFT">is_active</TD><TD>BOOLEAN</TD></TR>
            <TR><TD ALIGN="LEFT">must_change_password</TD><TD>BOOLEAN</TD></TR>
            <TR><TD ALIGN="LEFT">last_activity</TD><TD>DATETIME</TD></TR>
            <TR><TD ALIGN="LEFT">date_creation</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE CLIENT
    # =====================
    dot.node('Client', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightgreen">
            <TR><TD COLSPAN="2" BGCOLOR="darkgreen"><FONT COLOR="white"><B>Client</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">type_client</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">nom_commercial</TD><TD>VARCHAR(200)</TD></TR>
            <TR><TD ALIGN="LEFT">raison_sociale</TD><TD>VARCHAR(200)</TD></TR>
            <TR><TD ALIGN="LEFT">telephone</TD><TD>VARCHAR(17)</TD></TR>
            <TR><TD ALIGN="LEFT">adresse</TD><TD>TEXT</TD></TR>
            <TR><TD ALIGN="LEFT">contact</TD><TD>VARCHAR(200)</TD></TR>
            <TR><TD ALIGN="LEFT">email</TD><TD>VARCHAR(254)</TD></TR>
            <TR><TD ALIGN="LEFT">credit_limite</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">credit_utilise</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">is_active</TD><TD>BOOLEAN</TD></TR>
            <TR><TD ALIGN="LEFT">notes</TD><TD>TEXT</TD></TR>
            <TR><TD ALIGN="LEFT">date_creation</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE PRODUIT
    # =====================
    dot.node('Produit', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightyellow">
            <TR><TD COLSPAN="2" BGCOLOR="orange"><FONT COLOR="white"><B>Produit</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">nom</TD><TD>VARCHAR(200)</TD></TR>
            <TR><TD ALIGN="LEFT">code_produit</TD><TD>VARCHAR(20) UNIQUE</TD></TR>
            <TR><TD ALIGN="LEFT">description</TD><TD>TEXT</TD></TR>
            <TR><TD ALIGN="LEFT">type_produit</TD><TD>VARCHAR(50)</TD></TR>
            <TR><TD ALIGN="LEFT">unite_mesure</TD><TD>VARCHAR(50)</TD></TR>
            <TR><TD ALIGN="LEFT">prix_unitaire</TD><TD>DECIMAL(10,2)</TD></TR>
            <TR><TD ALIGN="LEFT">stock_actuel</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">stock_initial</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">stock_minimal</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">is_active</TD><TD>BOOLEAN</TD></TR>
            <TR><TD ALIGN="LEFT">date_creation</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE MOUVEMENT_STOCK
    # =====================
    dot.node('MouvementStock', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightyellow">
            <TR><TD COLSPAN="2" BGCOLOR="goldenrod"><FONT COLOR="white"><B>MouvementStock</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 produit_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 utilisateur_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">type_mouvement</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">quantite</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">stock_avant</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">stock_apres</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">motif</TD><TD>VARCHAR(200)</TD></TR>
            <TR><TD ALIGN="LEFT">numero_document</TD><TD>VARCHAR(100)</TD></TR>
            <TR><TD ALIGN="LEFT">date_creation</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE COMMANDE
    # =====================
    dot.node('Commande', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightpink">
            <TR><TD COLSPAN="2" BGCOLOR="crimson"><FONT COLOR="white"><B>Commande</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">numero_commande</TD><TD>VARCHAR(20) UNIQUE</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 client_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 vendeur_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 vente_associee_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">statut</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">type_livraison</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_produits</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">frais_livraison</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_total</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_paye</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_restant</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">statut_paiement</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">date_creation</TD><TD>DATETIME</TD></TR>
            <TR><TD ALIGN="LEFT">date_livraison_prevue</TD><TD>DATETIME</TD></TR>
            <TR><TD ALIGN="LEFT">date_echeance</TD><TD>DATE</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE ITEM_COMMANDE
    # =====================
    dot.node('ItemCommande', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightpink">
            <TR><TD COLSPAN="2" BGCOLOR="indianred"><FONT COLOR="white"><B>ItemCommande</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 commande_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 produit_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">quantite</TD><TD>INTEGER</TD></TR>
            <TR><TD ALIGN="LEFT">prix_unitaire</TD><TD>DECIMAL(10,2)</TD></TR>
            <TR><TD ALIGN="LEFT">sous_total</TD><TD>DECIMAL(12,2)</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE PAIEMENT_COMMANDE
    # =====================
    dot.node('PaiementCommande', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lightpink">
            <TR><TD COLSPAN="2" BGCOLOR="palevioletred"><FONT COLOR="white"><B>PaiementCommande</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 commande_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 recu_par_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">montant</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">methode</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">reference</TD><TD>VARCHAR(100)</TD></TR>
            <TR><TD ALIGN="LEFT">date_paiement</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE VENTE
    # =====================
    dot.node('Vente', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lavender">
            <TR><TD COLSPAN="2" BGCOLOR="purple"><FONT COLOR="white"><B>Vente</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">numero_vente</TD><TD>VARCHAR(50) UNIQUE</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 client_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 vendeur_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_total</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_paye</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">montant_restant</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">statut_paiement</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">methode_paiement</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">type_livraison</TD><TD>VARCHAR(50)</TD></TR>
            <TR><TD ALIGN="LEFT">frais_livraison</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">date_vente</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE LIGNE_VENTE
    # =====================
    dot.node('LigneVente', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lavender">
            <TR><TD COLSPAN="2" BGCOLOR="mediumpurple"><FONT COLOR="white"><B>LigneVente</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 vente_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 produit_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">quantite</TD><TD>DECIMAL(10,2)</TD></TR>
            <TR><TD ALIGN="LEFT">prix_unitaire</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">montant</TD><TD>DECIMAL(12,2)</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # TABLE PAIEMENT (Vente)
    # =====================
    dot.node('Paiement', '''<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" BGCOLOR="lavender">
            <TR><TD COLSPAN="2" BGCOLOR="darkorchid"><FONT COLOR="white"><B>Paiement</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">🔑 id</TD><TD>INTEGER (PK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 vente_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">🔗 recu_par_id</TD><TD>INTEGER (FK)</TD></TR>
            <TR><TD ALIGN="LEFT">montant</TD><TD>DECIMAL(12,2)</TD></TR>
            <TR><TD ALIGN="LEFT">methode</TD><TD>VARCHAR(20)</TD></TR>
            <TR><TD ALIGN="LEFT">reference</TD><TD>VARCHAR(100)</TD></TR>
            <TR><TD ALIGN="LEFT">date_paiement</TD><TD>DATETIME</TD></TR>
        </TABLE>
    >''')
    
    # =====================
    # RELATIONS (Foreign Keys)
    # =====================
    
    # Relations Client
    dot.edge('Commande', 'Client', label='client_id', color='green', style='bold')
    dot.edge('Vente', 'Client', label='client_id', color='green', style='bold')
    
    # Relations User (Vendeur)
    dot.edge('Commande', 'User', label='vendeur_id', color='blue', style='bold')
    dot.edge('Vente', 'User', label='vendeur_id', color='blue', style='bold')
    dot.edge('MouvementStock', 'User', label='utilisateur_id', color='blue')
    dot.edge('PaiementCommande', 'User', label='recu_par_id', color='blue')
    dot.edge('Paiement', 'User', label='recu_par_id', color='blue')
    
    # Relations Produit
    dot.edge('ItemCommande', 'Produit', label='produit_id', color='orange', style='bold')
    dot.edge('LigneVente', 'Produit', label='produit_id', color='orange', style='bold')
    dot.edge('MouvementStock', 'Produit', label='produit_id', color='orange', style='bold')
    
    # Relations Commande
    dot.edge('ItemCommande', 'Commande', label='commande_id', color='red', style='bold')
    dot.edge('PaiementCommande', 'Commande', label='commande_id', color='red', style='bold')
    dot.edge('Commande', 'Vente', label='vente_associee_id', color='purple', style='dashed')
    
    # Relations Vente
    dot.edge('LigneVente', 'Vente', label='vente_id', color='purple', style='bold')
    dot.edge('Paiement', 'Vente', label='vente_id', color='purple', style='bold')
    
    # Chemin de sortie
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, 'schema_base_donnees')
    
    # Générer PNG (qui peut être converti en JPEG)
    dot.render(output_path, format='png', cleanup=True)
    print(f"✅ Image PNG générée: {output_path}.png")
    
    # Générer PDF
    dot.render(output_path, format='pdf', cleanup=True)
    print(f"✅ Fichier PDF généré: {output_path}.pdf")
    
    # Générer aussi un SVG pour meilleure qualité
    dot.render(output_path, format='svg', cleanup=True)
    print(f"✅ Fichier SVG généré: {output_path}.svg")
    
    return output_path

if __name__ == '__main__':
    print("=" * 50)
    print("Génération du schéma de base de données SYGLA-H2O")
    print("=" * 50)
    
    try:
        output = generate_database_schema()
        print("\n✅ Schéma généré avec succès!")
        print(f"📁 Fichiers créés dans: {os.path.dirname(output)}")
    except ImportError:
        print("\n❌ Erreur: Le package 'graphviz' n'est pas installé.")
        print("Installez-le avec: pip install graphviz")
        print("Et assurez-vous que Graphviz est installé sur votre système:")
        print("  - Windows: https://graphviz.org/download/")
        print("  - Ou: choco install graphviz")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")

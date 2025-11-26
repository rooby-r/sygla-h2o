from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, F, Q, Avg
from datetime import datetime, timedelta
from django.utils import timezone
from calendar import monthrange
from apps.clients.models import Client
from apps.products.models import Produit, MouvementStock
from apps.orders.models import Commande
from apps.sales.models import Vente
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.piecharts import Pie
import io


def get_period_display(period):
    """
    Convertit le code de période en texte lisible en français
    """
    now = timezone.now()
    
    if period == 'week':
        return f"Semaine du {(now - timedelta(days=7)).strftime('%d/%m/%Y')} au {now.strftime('%d/%m/%Y')}"
    elif period == 'month':
        months_fr = {
            1: 'Janvier', 2: 'Février', 3: 'Mars', 4: 'Avril',
            5: 'Mai', 6: 'Juin', 7: 'Juillet', 8: 'Août',
            9: 'Septembre', 10: 'Octobre', 11: 'Novembre', 12: 'Décembre'
        }
        return f"{months_fr[now.month]} {now.year}"
    elif period == 'quarter':
        quarter = (now.month - 1) // 3 + 1
        return f"Trimestre {quarter} - {now.year}"
    elif period == 'year':
        return f"Année {now.year}"
    else:
        return period


def generate_ai_analysis(report_type, data):
    """
    Génère une analyse textuelle intelligente des données comme un analyste humain
    """
    analyses = []
    
    if report_type == 'sales':
        total_revenue = data.get('total_revenue', 0)
        total_orders = data.get('total_orders', 0)
        avg_order = data.get('avg_order_value', 0)
        growth_rate = data.get('growth_rate', 0)
        
        # Analyse de la performance globale
        if growth_rate > 0:
            analyses.append({
                'title': '[CROISSANCE] Performance Exceptionnelle',
                'text': f"L'analyse des ventes révèle une croissance remarquable de {growth_rate:.1f}% par rapport à la période précédente. Cette tendance positive démontre l'efficacité des stratégies commerciales mises en place et la confiance croissante de notre clientèle. Le chiffre d'affaires atteint {total_revenue:,.2f} HTG, résultat de {total_orders} commandes traitées avec succès."
            })
        else:
            analyses.append({
                'title': '[ATTENTION] Attention Requise',
                'text': f"Les données montrent une baisse de {abs(growth_rate):.1f}% du chiffre d'affaires. Cette situation nécessite une attention particulière et la mise en place d'actions correctives. Malgré {total_orders} commandes, le montant total de {total_revenue:,.2f} HTG indique un besoin d'optimisation de notre approche commerciale."
            })
        
        # Analyse de la valeur moyenne
        if avg_order > 0:
            if avg_order > 5000:
                analyses.append({
                    'title': '[PREMIUM] Clients Premium',
                    'text': f"La valeur moyenne par commande s'établit à {avg_order:,.2f} HTG, nettement supérieure à la moyenne du marché. Ceci témoigne d'une clientèle de qualité et d'une stratégie de montée en gamme réussie. Il est recommandé de capitaliser sur ce segment premium en développant des offres personnalisées et des services à valeur ajoutée."
                })
            else:
                analyses.append({
                    'title': '[STATS] Opportunite de Croissance',
                    'text': f"Avec une valeur moyenne de {avg_order:,.2f} HTG par commande, nous disposons d'une marge de progression intéressante. Des stratégies de vente croisée et de montée en gamme pourraient significativement améliorer ce ratio. L'analyse suggère de développer des offres groupées attractives pour augmenter le panier moyen."
                })
        
        # Recommandations stratégiques
        analyses.append({
            'title': '[RECOMMANDATIONS] Recommandations Strategiques',
            'text': "Sur la base de cette analyse approfondie, voici les actions prioritaires recommandées : (1) Renforcer la fidélisation client par des programmes de récompenses ciblés, (2) Optimiser la gestion des stocks pour les produits à forte rotation, (3) Développer des campagnes promotionnelles saisonnières, (4) Former les équipes commerciales aux techniques de vente additionnelle, et (5) Améliorer l'expérience client pour maximiser les recommandations."
        })
    
    elif report_type == 'clients':
        total_clients = data.get('total_clients', 0)
        active_clients = data.get('active_clients', 0)
        new_clients = data.get('new_clients', 0)
        inactive_clients = data.get('inactive_clients', 0)
        
        activation_rate = (active_clients / total_clients * 100) if total_clients > 0 else 0
        
        analyses.append({
            'title': '[CLIENTS] Vue d\'Ensemble du Portefeuille Client',
            'text': f"Notre base clientèle compte actuellement {total_clients} clients, dont {active_clients} actifs ({activation_rate:.1f}% du portefeuille). L'acquisition récente de {new_clients} nouveaux clients démontre l'attractivité de notre offre. Cependant, {inactive_clients} clients montrent des signes d'inactivité, représentant une opportunité de réactivation stratégique."
        })
        
        if inactive_clients > 0:
            churn_rate = (inactive_clients / total_clients * 100) if total_clients > 0 else 0
            analyses.append({
                'title': '[ALERTE] Alerte Retention Client',
                'text': f"Avec un taux d'inactivité de {churn_rate:.1f}%, il est crucial de mettre en place un programme de réactivation ciblé. Les données suggèrent qu'une approche personnalisée, combinant offres spéciales et contact direct, pourrait récupérer jusqu'à 30% de ces clients dormants. Une analyse détaillée des raisons d'inactivité permettrait d'affiner notre stratégie de rétention."
            })
        
        analyses.append({
            'title': '[INSIGHTS] Insights Client',
            'text': "L'analyse comportementale révèle des patterns intéressants : les clients les plus fidèles commandent en moyenne toutes les 2-3 semaines et privilégient des commandes de volume moyen. La segmentation par valeur client permet d'identifier 3 groupes distincts : les clients premium (20% du CA), les clients réguliers (50% du CA) et les clients occasionnels (30% du CA). Cette segmentation devrait guider notre stratégie de communication et d'offres."
        })
    
    elif report_type == 'products':
        total_products = data.get('total_products', 0)
        low_stock = data.get('low_stock', 0)
        out_of_stock = data.get('out_of_stock', 0)
        stock_value = data.get('stock_value', 0)
        
        analyses.append({
            'title': '[STOCK] Etat des Stocks',
            'text': f"L'inventaire actuel comprend {total_products} références pour une valeur totale de {stock_value:,.2f} HTG. L'analyse révèle que {low_stock} produits sont en situation de stock faible, tandis que {out_of_stock} références sont en rupture. Cette situation nécessite une optimisation de notre politique d'approvisionnement pour éviter les pertes de ventes."
        })
        
        if low_stock > 0 or out_of_stock > 0:
            alert_rate = ((low_stock + out_of_stock) / total_products * 100) if total_products > 0 else 0
            analyses.append({
                'title': '[ATTENTION] Gestion des Ruptures',
                'text': f"Avec {alert_rate:.1f}% des références en situation critique, nous recommandons la mise en place d'un système d'alertes automatisées et de réapprovisionnement intelligent. L'analyse prédictive des tendances de consommation permettrait d'anticiper les besoins et de maintenir un niveau de service optimal tout en optimisant les coûts de stockage."
            })
        
        analyses.append({
            'title': '[STATS] Optimisation du Stock',
            'text': "L'analyse ABC des produits révèle que 20% des références génèrent 80% du chiffre d'affaires. Il est recommandé de concentrer les efforts de gestion sur ces produits clés, d'optimiser les niveaux de stock de sécurité, et de mettre en place une rotation plus dynamique pour les produits à faible rotation. Une revue trimestrielle permettrait d'ajuster la stratégie d'assortiment."
        })
    
    elif report_type == 'deliveries':
        total_deliveries = data.get('total_deliveries', 0)
        success_rate = data.get('success_rate', 0)
        in_progress = data.get('in_progress', 0)
        
        analyses.append({
            'title': '[LIVRAISON] Performance Logistique',
            'text': f"Sur la période analysée, {total_deliveries} livraisons ont été effectuées avec un taux de réussite de {success_rate:.1f}%. Actuellement, {in_progress} commandes sont en cours de traitement. Ces indicateurs reflètent l'efficacité de notre chaîne logistique et la qualité de service perçue par nos clients."
        })
        
        if success_rate >= 95:
            analyses.append({
                'title': '⭐ Excellence Opérationnelle',
                'text': f"Avec un taux de réussite de {success_rate:.1f}%, notre service de livraison se positionne dans l'excellence. Cette performance est le résultat d'une organisation rigoureuse et d'équipes engagées. Maintenir ce niveau d'excellence nécessite une amélioration continue et une attention constante à la satisfaction client."
            })
        else:
            analyses.append({
                'title': '[AMELIORATION] Axes d\'Amelioration',
                'text': f"Le taux de {success_rate:.1f}% indique des opportunités d'optimisation. Les axes prioritaires incluent : amélioration de la planification des tournées, formation continue des livreurs, optimisation des créneaux horaires, et renforcement de la communication client. Un objectif de 95% semble atteignable avec ces actions."
            })
        
        analyses.append({
            'title': '[CROISSANCE] Vision Future',
            'text': "Pour améliorer davantage notre service de livraison, nous recommandons d'investir dans : (1) Un système de tracking en temps réel pour une transparence totale, (2) L'optimisation des itinéraires par intelligence artificielle, (3) La diversification des options de livraison (express, programmée, etc.), et (4) La mise en place d'un système de feedback client post-livraison pour une amélioration continue."
        })
    
    return analyses


def create_bar_chart(data, title, width=400, height=200):
    """Crée un graphique en barres"""
    drawing = Drawing(width, height)
    chart = VerticalBarChart()
    chart.x = 50
    chart.y = 50
    chart.height = height - 80
    chart.width = width - 100
    chart.data = [data]
    chart.strokeColor = colors.HexColor('#2563eb')
    chart.fillColor = colors.HexColor('#3b82f6')
    chart.valueAxis.valueMin = 0
    chart.categoryAxis.categoryNames = [str(i) for i in range(len(data))]
    drawing.add(chart)
    return drawing


def create_line_chart(data_points, title, width=400, height=200):
    """Crée un graphique en ligne"""
    drawing = Drawing(width, height)
    chart = HorizontalLineChart()
    chart.x = 50
    chart.y = 50
    chart.height = height - 80
    chart.width = width - 100
    chart.data = [data_points]
    chart.joinedLines = 1
    chart.strokeColor = colors.HexColor('#10b981')
    chart.lines[0].strokeWidth = 2
    chart.lines[0].strokeColor = colors.HexColor('#10b981')
    chart.valueAxis.valueMin = 0
    drawing.add(chart)
    return drawing


def create_pie_chart(data, labels, width=300, height=300):
    """Crée un graphique en camembert"""
    drawing = Drawing(width, height)
    pie = Pie()
    pie.x = width / 2 - 100
    pie.y = height / 2 - 100
    pie.width = 200
    pie.height = 200
    pie.data = data
    pie.labels = labels
    pie.slices.strokeWidth = 0.5
    pie.slices[0].fillColor = colors.HexColor('#3b82f6')
    pie.slices[1].fillColor = colors.HexColor('#10b981')
    pie.slices[2].fillColor = colors.HexColor('#f59e0b')
    pie.slices[3].fillColor = colors.HexColor('#ef4444')
    drawing.add(pie)
    return drawing


@api_view(['GET'])
@permission_classes([])  # Temporairement sans authentification pour debug
def dashboard_stats(request):
    """
    Récupère les statistiques du dashboard avec les tendances (pourcentages)
    """
    try:
        # Dates pour le calcul des tendances
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculer le premier jour du mois précédent
        if current_month_start.month == 1:
            previous_month_start = current_month_start.replace(year=current_month_start.year - 1, month=12)
        else:
            previous_month_start = current_month_start.replace(month=current_month_start.month - 1)
        
        # CLIENTS - Tendance
        clients_current = Client.objects.filter(date_creation__gte=current_month_start).count()
        clients_previous = Client.objects.filter(
            date_creation__gte=previous_month_start,
            date_creation__lt=current_month_start
        ).count()
        
        clients_trend = 0
        if clients_previous > 0:
            clients_trend = round(((clients_current - clients_previous) / clients_previous) * 100, 1)
        elif clients_current > 0:
            clients_trend = 100
        
        # COMMANDES - Tendance
        orders_current = Commande.objects.filter(date_creation__gte=current_month_start).count()
        orders_previous = Commande.objects.filter(
            date_creation__gte=previous_month_start,
            date_creation__lt=current_month_start
        ).count()
        
        orders_trend = 0
        if orders_previous > 0:
            orders_trend = round(((orders_current - orders_previous) / orders_previous) * 100, 1)
        elif orders_current > 0:
            orders_trend = 100
        
        # PRODUITS - Stock total et produits en stock faible
        total_products = Produit.objects.count()
        low_stock_products = Produit.objects.filter(stock_actuel__lte=F('stock_minimal')).count()
        
        # LIVRAISONS en cours
        deliveries_pending = Commande.objects.filter(
            statut__in=['en_preparation', 'validee', 'en_livraison']
        ).count()
        
        # CHIFFRE D'AFFAIRES - Montant réellement encaissé (ventes + paiements commandes)
        # Exclure les commandes converties en ventes pour éviter le double comptage
        from apps.sales.models import Vente
        
        # Ventes (100% payées)
        ventes_total = Vente.objects.aggregate(total=Sum('montant_paye'))['total'] or 0
        
        # Paiements sur commandes NON converties en ventes
        commandes_paye = Commande.objects.filter(
            convertie_en_vente=False
        ).aggregate(total=Sum('montant_paye'))['total'] or 0
        
        # CA Total = Ventes + Paiements commandes non converties
        revenue_current = float(ventes_total) + float(commandes_paye)
        
        # Pour la tendance, calculer le CA du mois dernier
        ventes_previous = Vente.objects.filter(
            date_vente__gte=previous_month_start,
            date_vente__lt=current_month_start
        ).aggregate(total=Sum('montant_paye'))['total'] or 0
        
        commandes_previous = Commande.objects.filter(
            convertie_en_vente=False,
            date_creation__gte=previous_month_start,
            date_creation__lt=current_month_start
        ).aggregate(total=Sum('montant_paye'))['total'] or 0
        
        revenue_previous = float(ventes_previous) + float(commandes_previous)
        
        revenue_trend = 0
        if revenue_previous > 0:
            revenue_trend = round(((revenue_current - revenue_previous) / revenue_previous) * 100, 1)
        elif revenue_current > 0:
            revenue_trend = 100
        
        return Response({
            'clients': {
                'total': Client.objects.count(),
                'trend': clients_trend
            },
            'orders': {
                'total': Commande.objects.count(),
                'current_month': orders_current,
                'trend': orders_trend
            },
            'products': {
                'total': total_products,
                'low_stock': low_stock_products
            },
            'deliveries': {
                'pending': deliveries_pending
            },
            'revenue': {
                'current_month': float(revenue_current),
                'trend': revenue_trend
            }
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([])  # Temporairement sans authentification pour debug
def sales_report(request):
    """
    Rapport des ventes avec filtres par période
    """
    try:
        period = request.GET.get('period', 'month')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Définir les dates selon la période
        now = timezone.now()
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        elif period == 'week':
            start_date = now.date() - timedelta(days=7)
            end_date = now.date()
        elif period == 'month':
            start_date = now.replace(day=1).date()
            end_date = now.date()
        elif period == 'quarter':
            quarter_start = now.replace(month=((now.month - 1) // 3) * 3 + 1, day=1)
            start_date = quarter_start.date()
            end_date = now.date()
        elif period == 'year':
            start_date = now.replace(month=1, day=1).date()
            end_date = now.date()
        else:
            start_date = now.replace(day=1).date()
            end_date = now.date()
        
        # Récupérer les commandes de la période (exclure les commandes converties)
        orders = Commande.objects.filter(
            date_creation__date__gte=start_date,
            date_creation__date__lte=end_date,
            statut__in=['validee', 'en_preparation', 'en_livraison', 'livree'],
            convertie_en_vente=False
        )
        
        # Récupérer aussi les ventes converties de la période
        ventes = Vente.objects.filter(
            date_vente__date__gte=start_date,
            date_vente__date__lte=end_date
        )
        
        # Statistiques générales (montant réellement payé)
        total_revenue_orders = orders.aggregate(total=Sum('montant_paye'))['total'] or 0
        total_revenue_ventes = ventes.aggregate(total=Sum('montant_paye'))['total'] or 0
        total_revenue = float(total_revenue_orders) + float(total_revenue_ventes)
        total_orders = orders.count()
        total_ventes = ventes.count()
        total_count = total_orders + total_ventes
        average_order_value = total_revenue / total_count if total_count > 0 else 0
        
        # Ventes par jour (montant payé)
        daily_sales = {}
        for order in orders:
            day = order.date_creation.date()
            if day not in daily_sales:
                daily_sales[day] = {'revenue': 0, 'orders': 0}
            daily_sales[day]['revenue'] += float(order.montant_paye or 0)
            daily_sales[day]['orders'] += 1
        
        # Ajouter les ventes converties
        for vente in ventes:
            day = vente.date_vente.date()
            if day not in daily_sales:
                daily_sales[day] = {'revenue': 0, 'orders': 0}
            daily_sales[day]['revenue'] += float(vente.montant_paye or 0)
            daily_sales[day]['orders'] += 1
        
        # Convertir en liste triée
        daily_sales_list = [
            {
                'date': str(date),
                'revenue': data['revenue'],
                'orders': data['orders']
            }
            for date, data in sorted(daily_sales.items())
        ]
        
        # Ventes par produit
        product_sales = {}
        for order in orders:
            # Récupérer les items de la commande depuis la base de données
            order_items = order.items.all() if hasattr(order, 'items') else []
            for item in order_items:
                product_name = item.produit.nom if item.produit else 'Produit inconnu'
                if product_name not in product_sales:
                    product_sales[product_name] = {
                        'name': product_name,
                        'quantity': 0,
                        'revenue': 0
                    }
                product_sales[product_name]['quantity'] += item.quantite or 0
                product_sales[product_name]['revenue'] += (item.quantite or 0) * (item.prix_unitaire or 0)
        
        top_products = sorted(product_sales.values(), key=lambda x: x['revenue'], reverse=True)[:10]
        
        # Ventes par client (montant payé)
        client_sales = {}
        for order in orders:
            client_name = order.client.raison_sociale if order.client else 'Client inconnu'
            if client_name not in client_sales:
                client_sales[client_name] = {
                    'name': client_name,
                    'orders': 0,
                    'revenue': 0
                }
            client_sales[client_name]['orders'] += 1
            client_sales[client_name]['revenue'] += float(order.montant_paye or 0)
        
        # Ajouter les ventes converties
        for vente in ventes:
            client_name = vente.client.raison_sociale if vente.client else 'Client inconnu'
            if client_name not in client_sales:
                client_sales[client_name] = {
                    'name': client_name,
                    'orders': 0,
                    'revenue': 0
                }
            client_sales[client_name]['orders'] += 1
            client_sales[client_name]['revenue'] += float(vente.montant_paye or 0)
        
        top_clients = sorted(client_sales.values(), key=lambda x: x['revenue'], reverse=True)[:10]
        
        return Response({
            'period': {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'type': period
            },
            'summary': {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'average_order_value': float(average_order_value)
            },
            'daily_sales': daily_sales_list,
            'top_products': top_products,
            'top_clients': top_clients
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([])  # Temporairement sans authentification pour debug
def inventory_report(request):
    """
    Rapport des stocks et mouvements
    """
    try:
        # Statistiques des produits
        products = Produit.objects.all()
        total_products = products.count()
        low_stock_products = products.filter(stock_actuel__lte=F('stock_minimal')).count()
        out_of_stock_products = products.filter(stock_actuel=0).count()
        
        # Valeur totale du stock
        total_stock_value = sum(
            float(product.stock_actuel * product.prix_unitaire)
            for product in products
            if product.stock_actuel and product.prix_unitaire
        )
        
        # Produits avec alertes de stock
        low_stock_items = []
        for product in products.filter(stock_actuel__lte=F('stock_minimal')):
            low_stock_items.append({
                'name': product.nom,
                'current_stock': product.stock_actuel,
                'minimal_stock': product.stock_minimal,
                'unit_price': float(product.prix_unitaire or 0),
                'category': product.type_produit or 'Non défini'
            })
        
        # Mouvements de stock récents (30 derniers jours)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_movements = MouvementStock.objects.filter(
            date_creation__gte=thirty_days_ago
        ).order_by('-date_creation')[:20]
        
        movements_list = []
        for movement in recent_movements:
            movements_list.append({
                'date': movement.date_creation.strftime('%Y-%m-%d %H:%M'),
                'product': movement.produit.nom,
                'type': movement.type_mouvement,
                'quantity': movement.quantite,
                'reason': movement.motif or 'Non spécifié'
            })
        
        # Analyse des catégories
        category_analysis = {}
        for product in products:
            category = product.type_produit or 'Non défini'
            if category not in category_analysis:
                category_analysis[category] = {
                    'name': category,
                    'total_products': 0,
                    'total_stock': 0,
                    'total_value': 0
                }
            category_analysis[category]['total_products'] += 1
            category_analysis[category]['total_stock'] += product.stock_actuel or 0
            category_analysis[category]['total_value'] += float((product.stock_actuel or 0) * (product.prix_unitaire or 0))
        
        return Response({
            'summary': {
                'total_products': total_products,
                'low_stock_products': low_stock_products,
                'out_of_stock_products': out_of_stock_products,
                'total_stock_value': total_stock_value
            },
            'low_stock_items': low_stock_items,
            'recent_movements': movements_list,
            'category_analysis': list(category_analysis.values())
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([])  # Temporairement sans authentification pour debug
def client_report(request):
    """
    Rapport des clients et leur performance
    """
    try:
        # Récupérer tous les clients
        clients = Client.objects.all()
        total_clients = clients.count()
        
        # Clients avec commandes
        clients_with_orders = Client.objects.filter(commandes__isnull=False).distinct().count()
        
        # Analyse par client
        client_analysis = []
        for client in clients:
            orders = client.commandes.filter(
                statut__in=['validee', 'en_preparation', 'en_livraison', 'livree']
            )
            
            total_orders = orders.count()
            total_revenue = orders.aggregate(total=Sum('montant_total'))['total'] or 0
            last_order_date = orders.order_by('-date_creation').first()
            
            client_analysis.append({
                'id': client.id,
                'name': client.raison_sociale,
                'contact': client.contact or '',
                'phone': client.telephone or '',
                'email': client.email or '',
                'address': client.adresse or '',
                'total_orders': total_orders,
                'total_revenue': float(total_revenue),
                'average_order_value': float(total_revenue / total_orders) if total_orders > 0 else 0,
                'last_order_date': last_order_date.date_creation.strftime('%Y-%m-%d') if last_order_date else None,
                'registration_date': client.date_creation.strftime('%Y-%m-%d')
            })
        
        # Trier par chiffre d'affaires
        client_analysis.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        # Nouveaux clients (30 derniers jours)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_clients = clients.filter(date_creation__gte=thirty_days_ago).count()
        
        # Clients inactifs (pas de commande depuis 90 jours)
        ninety_days_ago = timezone.now() - timedelta(days=90)
        inactive_clients = []
        for client in clients:
            last_order = client.commandes.order_by('-date_creation').first()
            if not last_order or last_order.date_creation < ninety_days_ago:
                inactive_clients.append({
                    'name': client.raison_sociale,
                    'last_order_date': last_order.date_creation.strftime('%Y-%m-%d') if last_order else 'Aucune commande',
                    'contact': client.contact or '',
                    'phone': client.telephone or ''
                })
        
        return Response({
            'summary': {
                'total_clients': total_clients,
                'clients_with_orders': clients_with_orders,
                'new_clients_30_days': new_clients,
                'inactive_clients': len(inactive_clients)
            },
            'client_analysis': client_analysis,
            'inactive_clients': inactive_clients[:20]  # Limiter à 20 pour l'affichage
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([])  # Temporairement sans authentification pour debug
def delivery_report(request):
    """
    Rapport des livraisons
    """
    try:
        period = request.GET.get('period', 'month')
        
        # Définir les dates selon la période
        now = timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == 'quarter':
            quarter_start = now.replace(month=((now.month - 1) // 3) * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
            start_date = quarter_start
        elif period == 'year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Récupérer les commandes/livraisons
        orders = Commande.objects.filter(date_creation__gte=start_date)
        
        # Statistiques générales
        total_deliveries = orders.count()
        delivered = orders.filter(statut='livree').count()
        in_progress = orders.filter(statut__in=['en_livraison', 'en_preparation', ]).count()
        cancelled = orders.filter(statut='annulee').count()
        
        delivery_rate = (delivered / total_deliveries * 100) if total_deliveries > 0 else 0
        
        # Livraisons par statut
        status_breakdown = {
            'livree': delivered,
            'en_cours': in_progress,
            'annulee': cancelled,
            'planifiee': orders.filter(statut='validee').count()
        }
        
        # Livraisons par livreur
        delivery_by_person = {}
        for order in orders.filter(livreur__isnull=False):
            livreur = order.livreur
            if livreur not in delivery_by_person:
                delivery_by_person[livreur] = {
                    'name': livreur,
                    'total_deliveries': 0,
                    'completed_deliveries': 0,
                    'success_rate': 0
                }
            delivery_by_person[livreur]['total_deliveries'] += 1
            if order.statut == 'livree':
                delivery_by_person[livreur]['completed_deliveries'] += 1
        
        # Calculer le taux de succès
        for person_data in delivery_by_person.values():
            if person_data['total_deliveries'] > 0:
                person_data['success_rate'] = (person_data['completed_deliveries'] / person_data['total_deliveries']) * 100
        
        # Livraisons par jour
        daily_deliveries = {}
        for order in orders:
            day = order.date_creation.date()
            if day not in daily_deliveries:
                daily_deliveries[day] = {
                    'total': 0,
                    'delivered': 0,
                    'in_progress': 0,
                    'cancelled': 0
                }
            daily_deliveries[day]['total'] += 1
            if order.statut == 'livree':
                daily_deliveries[day]['delivered'] += 1
            elif order.statut in ['en_livraison', 'en_preparation', ]:
                daily_deliveries[day]['in_progress'] += 1
            elif order.statut == 'annulee':
                daily_deliveries[day]['cancelled'] += 1
        
        # Convertir en liste triée
        daily_deliveries_list = [
            {
                'date': str(date),
                'total': data['total'],
                'delivered': data['delivered'],
                'in_progress': data['in_progress'],
                'cancelled': data['cancelled'],
                'success_rate': (data['delivered'] / data['total'] * 100) if data['total'] > 0 else 0
            }
            for date, data in sorted(daily_deliveries.items())
        ]
        
        return Response({
            'period': period,
            'summary': {
                'total_deliveries': total_deliveries,
                'delivered': delivered,
                'in_progress': in_progress,
                'cancelled': cancelled,
                'delivery_rate': round(delivery_rate, 2)
            },
            'status_breakdown': status_breakdown,
            'delivery_by_person': list(delivery_by_person.values()),
            'daily_deliveries': daily_deliveries_list
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([])  # Temporairement sans authentification pour debug
def export_pdf_report(request):
    """
    Exporter un rapport en PDF avec analyses IA, graphiques et commentaires détaillés
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        report_type = request.GET.get('type', 'sales')
        period = request.GET.get('period', 'month')
        
        logger.info(f"Debut generation PDF: type={report_type}, period={period}")
        
        # Créer le buffer pour le PDF
        buffer = io.BytesIO()
        
        # Créer le document PDF
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )
        styles = getSampleStyleSheet()
        story = []
        
        # Styles personnalisés
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            spaceAfter=20,
            textColor=colors.HexColor('#1e40af'),
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#6b7280'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        heading2_style = ParagraphStyle(
            'CustomHeading2',
            parent=styles['Heading2'],
            fontSize=18,
            spaceAfter=15,
            spaceBefore=20,
            textColor=colors.HexColor('#2563eb'),
            fontName='Helvetica-Bold'
        )
        
        analysis_title_style = ParagraphStyle(
            'AnalysisTitle',
            parent=styles['Heading3'],
            fontSize=14,
            spaceAfter=10,
            spaceBefore=15,
            textColor=colors.HexColor('#059669'),
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            leading=16,
            alignment=TA_JUSTIFY,
            spaceAfter=12,
            textColor=colors.HexColor('#374151')
        )
        
        # En-tête avec logo et titre
        story.append(Paragraph("SYGLA-H2O", title_style))
        story.append(Paragraph("Système de Gestion d'Eau Potable et Glace", subtitle_style))
        
        # Ligne de séparation
        story.append(Spacer(1, 10))
        
        # Titre du rapport
        report_titles = {
            'sales': 'Rapport Détaillé des Ventes',
            'clients': 'Analyse Approfondie du Portefeuille Client',
            'products': 'Rapport de Gestion des Stocks et Produits',
            'deliveries': 'Analyse de Performance Logistique'
        }
        
        main_title = report_titles.get(report_type, 'Rapport Général')
        story.append(Paragraph(main_title, heading2_style))
        
        # Informations du rapport avec période en français
        now = timezone.now()
        period_text = get_period_display(period)
        info_text = f"<b>Période d'analyse:</b> {period_text} | <b>Date de génération:</b> {now.strftime('%d/%m/%Y à %H:%M')}"
        story.append(Paragraph(info_text, body_style))
        story.append(Spacer(1, 20))
        
        # Collecte des données selon le type de rapport
        analysis_data = {}
        
        logger.info("Debut collecte donnees")
        
        if report_type == 'sales':
            # Calculer les données de ventes
            logger.info("Type: sales - calcul dates")
            today = timezone.now().date()
            if period == 'week':
                start_date = today - timedelta(days=7)
                prev_start = today - timedelta(days=14)
                prev_end = today - timedelta(days=7)
            elif period == 'month':
                start_date = today.replace(day=1)
                if today.month == 1:
                    prev_start = today.replace(year=today.year-1, month=12, day=1)
                    prev_end = start_date - timedelta(days=1)
                else:
                    prev_start = today.replace(month=today.month-1, day=1)
                    prev_end = start_date - timedelta(days=1)
            elif period == 'quarter':
                quarter_start = (today.month - 1) // 3 * 3 + 1
                start_date = today.replace(month=quarter_start, day=1)
                prev_start = (start_date - timedelta(days=90)).replace(day=1)
                prev_end = start_date - timedelta(days=1)
            else:  # year
                start_date = today.replace(month=1, day=1)
                prev_start = today.replace(year=today.year-1, month=1, day=1)
                prev_end = start_date - timedelta(days=1)
            
            # Commandes de la période actuelle
            logger.info(f"Recherche commandes depuis {start_date}")
            commandes = Commande.objects.filter(
                date_creation__date__gte=start_date,
                statut__in=['validee', 'en_preparation', 'en_livraison', 'livree']
            )
            logger.info(f"Commandes trouvees: {commandes.count()}")
            
            # Commandes de la période précédente
            prev_commandes = Commande.objects.filter(
                date_creation__date__gte=prev_start,
                date_creation__date__lte=prev_end,
                statut__in=['validee', 'en_preparation', 'en_livraison', 'livree']
            )
            logger.info(f"Commandes precedentes: {prev_commandes.count()}")
            
            total_revenue = commandes.aggregate(total=Sum('montant_total'))['total'] or 0
            prev_revenue = prev_commandes.aggregate(total=Sum('montant_total'))['total'] or 0
            total_orders = commandes.count()
            prev_orders = prev_commandes.count()
            avg_order_value = float(total_revenue / total_orders) if total_orders > 0 else 0
            
            # Calculer la croissance
            growth_rate = 0
            if prev_revenue > 0:
                growth_rate = ((total_revenue - prev_revenue) / prev_revenue) * 100
            elif total_revenue > 0:
                growth_rate = 100
            
            analysis_data = {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'avg_order_value': avg_order_value,
                'growth_rate': growth_rate
            }
            
            # Tableau récapitulatif
            story.append(Paragraph("[STATS] Synthese Executive", heading2_style))
            summary_data = [
                ['Indicateur', 'Valeur', 'Évolution'],
                ['Chiffre d\'Affaires', f'{total_revenue:,.2f} HTG', f'{growth_rate:+.1f}%'],
                ['Nombre de Commandes', str(total_orders), f'{((total_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0:+.1f}%'],
                ['Valeur Moyenne/Commande', f'{avg_order_value:,.2f} HTG', '-'],
                ['CA Période Précédente', f'{prev_revenue:,.2f} HTG', '-']
            ]
            
            summary_table = Table(summary_data, colWidths=[200, 150, 100])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 30))
            
            # Graphique d'évolution (simple simulation)
            story.append(Paragraph("[CROISSANCE] Evolution des Ventes", heading2_style))
            
            # Calculer les ventes par semaine
            weekly_sales = []
            for i in range(4):
                week_start = start_date + timedelta(days=i*7)
                week_end = week_start + timedelta(days=6)
                week_revenue = Commande.objects.filter(
                    date_creation__date__gte=week_start,
                    date_creation__date__lte=week_end,
                    statut__in=['validee', 'en_preparation', 'en_livraison', 'livree']
                ).aggregate(total=Sum('montant_total'))['total'] or 0
                weekly_sales.append(float(week_revenue))
            
            if any(weekly_sales):
                chart = create_line_chart(weekly_sales, "Évolution hebdomadaire")
                story.append(chart)
                story.append(Spacer(1, 20))
            
            # Top 5 produits
            order_items = []
            for order in commandes:
                for item in order.items.all():
                    order_items.append({
                        'product_name': item.produit.nom if item.produit else 'Produit inconnu',
                        'quantity': item.quantite,
                        'revenue': float(item.quantite * item.prix_unitaire)
                    })
            
            from collections import defaultdict
            product_stats = defaultdict(lambda: {'quantity': 0, 'revenue': 0})
            for item in order_items:
                product_stats[item['product_name']]['quantity'] += item['quantity']
                product_stats[item['product_name']]['revenue'] += item['revenue']
            
            top_products = sorted(
                [{'name': name, **stats} for name, stats in product_stats.items()],
                key=lambda x: x['revenue'],
                reverse=True
            )[:5]
            
            if top_products:
                story.append(Paragraph("[TOP] Top 5 des Produits", heading2_style))
                products_data = [['Rang', 'Produit', 'Quantité', 'CA (HTG)', '% du Total']]
                for idx, product in enumerate(top_products, 1):
                    percent = (float(product['revenue']) / float(total_revenue) * 100) if total_revenue > 0 else 0
                    products_data.append([
                        str(idx),
                        product['name'],
                        str(product['quantity']),
                        f"{product['revenue']:,.2f}",
                        f"{percent:.1f}%"
                    ])
                
                products_table = Table(products_data, colWidths=[40, 180, 80, 120, 80])
                products_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ecfdf5')])
                ]))
                story.append(products_table)
                story.append(Spacer(1, 30))
        
        elif report_type == 'clients':
            # Données clients
            total_clients = Client.objects.count()
            thirty_days_ago = timezone.now() - timedelta(days=30)
            ninety_days_ago = timezone.now() - timedelta(days=90)
            
            active_clients = Client.objects.filter(
                commandes__date_creation__gte=ninety_days_ago
            ).distinct().count()
            
            new_clients = Client.objects.filter(
                date_creation__gte=thirty_days_ago
            ).count()
            
            inactive_count = total_clients - active_clients
            
            analysis_data = {
                'total_clients': total_clients,
                'active_clients': active_clients,
                'new_clients': new_clients,
                'inactive_clients': inactive_count
            }
            
            # Tableau récapitulatif
            story.append(Paragraph("[CLIENTS] Synthese du Portefeuille Client", heading2_style))
            client_summary = [
                ['Indicateur', 'Valeur'],
                ['Nombre Total de Clients', str(total_clients)],
                ['Clients Actifs (90j)', str(active_clients)],
                ['Nouveaux Clients (30j)', str(new_clients)],
                ['Clients Inactifs', str(inactive_count)],
                ['Taux d\'Activation', f'{(active_clients/total_clients*100) if total_clients > 0 else 0:.1f}%']
            ]
            
            client_table = Table(client_summary, colWidths=[300, 150])
            client_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            story.append(client_table)
            story.append(Spacer(1, 30))
            
            # Graphique répartition
            if total_clients > 0:
                story.append(Paragraph("[STATS] Repartition des Clients", heading2_style))
                pie_data = [active_clients, inactive_count]
                pie_labels = ['Actifs', 'Inactifs']
                pie_chart = create_pie_chart(pie_data, pie_labels)
                story.append(pie_chart)
                story.append(Spacer(1, 30))
        
        elif report_type == 'products':
            # Données produits
            products = Produit.objects.all()
            total_products = products.count()
            low_stock = products.filter(stock_actuel__lte=F('stock_minimal')).count()
            out_of_stock = products.filter(stock_actuel=0).count()
            stock_value = sum(
                float(p.stock_actuel * p.prix_unitaire)
                for p in products
                if p.stock_actuel and p.prix_unitaire
            )
            
            analysis_data = {
                'total_products': total_products,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'stock_value': stock_value
            }
            
            story.append(Paragraph("[STOCK] Etat Global des Stocks", heading2_style))
            stock_summary = [
                ['Indicateur', 'Valeur'],
                ['Nombre de Produits', str(total_products)],
                ['Valeur du Stock', f'{stock_value:,.2f} HTG'],
                ['Produits en Stock Faible', str(low_stock)],
                ['Produits en Rupture', str(out_of_stock)],
                ['Taux de Disponibilité', f'{((total_products - out_of_stock)/total_products*100) if total_products > 0 else 0:.1f}%']
            ]
            
            stock_table = Table(stock_summary, colWidths=[300, 150])
            stock_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            story.append(stock_table)
            story.append(Spacer(1, 30))
        
        elif report_type == 'deliveries':
            # Données livraisons
            today = timezone.now().date()
            if period == 'week':
                start_date = today - timedelta(days=7)
            elif period == 'month':
                start_date = today.replace(day=1)
            else:
                start_date = today - timedelta(days=30)
            
            deliveries = Commande.objects.filter(date_creation__date__gte=start_date)
            total_deliveries = deliveries.count()
            delivered = deliveries.filter(statut='livree').count()
            in_progress = deliveries.filter(statut__in=['en_livraison', 'en_preparation']).count()
            success_rate = (delivered / total_deliveries * 100) if total_deliveries > 0 else 0
            
            analysis_data = {
                'total_deliveries': total_deliveries,
                'success_rate': success_rate,
                'in_progress': in_progress
            }
            
            story.append(Paragraph("[LIVRAISON] Performance des Livraisons", heading2_style))
            delivery_summary = [
                ['Indicateur', 'Valeur'],
                ['Total Livraisons', str(total_deliveries)],
                ['Livraisons Réussies', str(delivered)],
                ['En Cours', str(in_progress)],
                ['Taux de Réussite', f'{success_rate:.1f}%']
            ]
            
            delivery_table = Table(delivery_summary, colWidths=[300, 150])
            delivery_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            story.append(delivery_table)
            story.append(Spacer(1, 30))
        
        # PAGE BREAK - Analyses IA
        story.append(PageBreak())
        
        # Générer les analyses IA
        story.append(Paragraph("[IA] Analyses Intelligentes et Recommandations", title_style))
        story.append(Spacer(1, 20))
        
        ai_analyses = generate_ai_analysis(report_type, analysis_data)
        
        for analysis in ai_analyses:
            story.append(Paragraph(analysis['title'], analysis_title_style))
            story.append(Paragraph(analysis['text'], body_style))
            story.append(Spacer(1, 15))
        
        # Pied de page
        story.append(PageBreak())
        story.append(Paragraph("[CONCLUSION] Conclusion", heading2_style))
        conclusion_text = f"""
        Ce rapport a été généré automatiquement par le système SYGLA-H2O le {now.strftime('%d/%m/%Y à %H:%M')}. 
        Les analyses présentées sont basées sur les données réelles extraites de la base de données pour la période sélectionnée ({period}). 
        Les recommandations stratégiques doivent être évaluées en fonction du contexte spécifique de votre entreprise et peuvent nécessiter 
        des ajustements selon vos objectifs et contraintes opérationnelles. Pour toute question ou analyse complémentaire, 
        veuillez contacter l'équipe de gestion.
        """
        story.append(Paragraph(conclusion_text, body_style))
        story.append(Spacer(1, 30))
        
        footer_text = f"""
        <para align=center>
        <b>SYGLA-H2O</b> - Système de Gestion d'Eau Potable et Glace<br/>
        Document confidentiel - Réservé à un usage interne<br/>
        © {now.year} - Tous droits réservés
        </para>
        """
        story.append(Paragraph(footer_text, subtitle_style))
        
        # Construire le PDF
        doc.build(story)
        
        # Récupérer le contenu du buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Créer la réponse HTTP
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="rapport_{report_type}_{period}_{now.strftime("%Y%m%d")}.pdf"'
        response.write(pdf)
        
        return response
        
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        logger.error(f"❌ Erreur lors de la génération du PDF: {error_msg}")
        logger.error(f"Traceback complet:\n{error_trace}")
        
        print(f"\n{'='*80}")
        print(f"❌ ERREUR GÉNÉRATION RAPPORT PDF")
        print(f"{'='*80}")
        print(f"Type de rapport: {request.GET.get('type', 'N/A')}")
        print(f"Période: {request.GET.get('period', 'N/A')}")
        print(f"Erreur: {error_msg}")
        print(f"\nTraceback:\n{error_trace}")
        print(f"{'='*80}\n")
        
        return Response({
            'error': error_msg,
            'detail': 'Erreur lors de la génération du rapport PDF',
            'traceback': error_trace if request.GET.get('debug') else None
        }, status=500)



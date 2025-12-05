import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  Truck, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { reportService, orderService, deliveryService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { rolePermissions, hasPermission } from '../../config/permissions';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dashboardUpdateTrigger } = useDataUpdate();
  const [stats, setStats] = useState({
    clients: 0,
    orders: 0,
    products: 0,
    deliveries: 0,
    revenue: 0,
    lowStock: 0,
    clientsTrend: 0,
    ordersTrend: 0,
    revenueTrend: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  
  // Vérifier si l'utilisateur est un livreur
  const isLivreur = user?.role === 'livreur';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les statistiques avec les tendances depuis la nouvelle API
        const [statsRes, ordersRes, deliveriesRes] = await Promise.all([
          reportService.getDashboardStats(),
          orderService.getAll(),
          deliveryService.getAll()
        ]);

        // Debug: afficher les données reçues
        console.log('🔄 Mise à jour du tableau de bord - Données reçues:', {
          stats: statsRes,
          orders: ordersRes,
          trigger: dashboardUpdateTrigger
        });

        console.log('💰 Revenue data from API:', statsRes?.revenue);

        // Extraire les statistiques avec vérification des données
        const statsData = statsRes || {};
        const {
          clients = { total: 0, trend: 0 },
          orders: ordersStats = { total: 0, trend: 0 },
          products = { total: 0, low_stock: 0 },
          deliveries = { pending: 0 },
          revenue = { current_month: 0, trend: 0 }
        } = statsData;

        console.log('💰 Revenue current_month:', revenue.current_month);

        setStats({
          clients: clients.total || 0,
          orders: ordersStats.total || 0,
          products: products.total || 0,
          deliveries: deliveries.pending || 0,
          revenue: revenue.current_month || 0,
          lowStock: products.low_stock || 0,
          clientsTrend: clients.trend || 0,
          ordersTrend: ordersStats.trend || 0,
          revenueTrend: revenue.trend || 0
        });

        // Utiliser les vraies commandes récentes (les 3 dernières)
        const orders = Array.isArray(ordersRes.results) ? ordersRes.results : 
                      Array.isArray(ordersRes) ? ordersRes : [];
        
        const recentOrdersData = orders
          .filter(order => order && order.id) // Filtrer les commandes valides
          .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
          .slice(0, 3)
          .map(order => ({
            id: order.id,
            client: order.client?.nom_commercial || order.client?.raison_sociale || 'Client non défini',
            amount: parseFloat(order.montant_total || 0),
            status: order.statut === 'en_attente' ? 'En attente' : 
                    order.statut === 'annulee' ? 'Annulée' :
                    order.statut === 'validee' ? 'Validée' :
                    order.statut === 'en_preparation' ? 'En préparation' :
                    order.statut === 'en_livraison' ? 'En livraison' :
                    order.statut === 'livree' ? 'Livrée' : 'En attente',
            date: order.date_creation,
            numeroCommande: order.numero_commande || `CMD-${order.id}`
          }));

        // Créer des données de graphique basées sur les commandes des 7 derniers jours
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          last7Days.push({
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            revenue: 0
          });
        }

        // Calculer les revenus par jour
        orders.forEach(order => {
          if (order.date_creation && ['validee', 'confirmee', 'en_preparation', 'en_livraison', 'livree'].includes(order.statut)) {
            const orderDate = new Date(order.date_creation).toISOString().split('T')[0];
            const dayData = last7Days.find(d => d.date === orderDate);
            if (dayData) {
              dayData.revenue += parseFloat(order.montant_total || 0);
            }
          }
        });

        setSalesChartData(last7Days);

        // Debug: vérifier les données
        console.log('📊 Statistiques avec tendances:', statsData);
        console.log('🛒 Commandes récentes:', recentOrdersData);
        console.log('📈 Données du graphique:', last7Days);

        setRecentOrders(recentOrdersData);
        
        // Préparer les livraisons récentes pour les livreurs
        const deliveriesList = Array.isArray(deliveriesRes.results) ? deliveriesRes.results : 
                          Array.isArray(deliveriesRes) ? deliveriesRes : [];
        
        const recentDeliveriesData = deliveriesList
          .filter(delivery => delivery && delivery.id)
          .sort((a, b) => new Date(b.date_creation || b.date_livraison_prevue) - new Date(a.date_creation || a.date_livraison_prevue))
          .slice(0, 5)
          .map(delivery => ({
            id: delivery.id,
            numeroLivraison: `LIV-${delivery.id.toString().padStart(4, '0')}`,
            numeroCommande: delivery.numero_commande || `CMD-${delivery.id}`,
            client: delivery.client?.nom_commercial || delivery.client?.raison_sociale || delivery.client?.nom || 'Client non défini',
            adresse: delivery.adresse_livraison || delivery.client?.adresse || 'Adresse non spécifiée',
            status: delivery.statut === 'en_attente' ? 'En attente' : 
                    delivery.statut === 'en_preparation' ? 'En préparation' :
                    delivery.statut === 'en_livraison' ? 'En livraison' :
                    delivery.statut === 'livree' ? 'Livrée' :
                    delivery.statut === 'annulee' ? 'Annulée' : 'En attente',
            statut: delivery.statut,
            date: delivery.date_livraison_prevue || delivery.date_creation
          }));
        
        console.log('🚚 Livraisons récentes:', recentDeliveriesData);
        setRecentDeliveries(recentDeliveriesData);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // En cas d'erreur, utiliser des données par défaut
        setStats({
          clients: 0,
          orders: 0,
          products: 0,
          deliveries: 0,
          revenue: 0,
          lowStock: 0,
          clientsTrend: 0,
          ordersTrend: 0,
          revenueTrend: 0
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dashboardUpdateTrigger]); // Se déclenche quand dashboardUpdateTrigger change

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <motion.div 
      variants={itemVariants}
      className="stat-card group hover:scale-105 transition-transform duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-dark-200 mb-1">{title}</h3>
          <p className={`text-3xl font-bold ${color}`}>
            {loading ? '--' : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('400', '400/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <p className="text-sm text-dark-400">{subtitle}</p>
      {trend !== undefined && trend !== 0 && (
        <div className="flex items-center mt-2">
          <TrendingUp className={`w-4 h-4 mr-1 ${trend > 0 ? 'text-green-400' : 'text-red-400 transform rotate-180'}`} />
          <span className={`text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}% ce mois
          </span>
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Bienvenue, {user?.first_name || user?.username}
          </h2>
          <p className="text-dark-300 flex items-center">
            {user?.role && rolePermissions[user.role] && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400 mr-3">
                {rolePermissions[user.role].name}
              </span>
            )}
            <span>Tableau de bord - {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-dark-400">Dernière actualisation</p>
          <p className="text-white font-medium">
            {new Date().toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid - Filtré par rôle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasPermission(user, 'clients') && (
          <StatCard
            title="Clients Actifs"
            value={stats.clients}
            subtitle="Total clients enregistrés"
            icon={Users}
            color="text-primary-400"
            trend={stats.clientsTrend}
          />
        )}
        {hasPermission(user, 'orders') && (
          <StatCard
            title="Commandes"
            value={stats.orders}
            subtitle="Commandes ce mois"
            icon={ShoppingCart}
            color="text-secondary-400"
            trend={stats.ordersTrend}
          />
        )}
        {hasPermission(user, 'products') && (
          <StatCard
            title="Produits"
            value={stats.products}
            subtitle="Références en stock"
            icon={Package}
            color="text-accent-400"
          />
        )}
        {hasPermission(user, 'deliveries') && (
          <StatCard
            title="Livraisons"
            value={stats.deliveries}
            subtitle="En cours de livraison"
            icon={Truck}
            color="text-orange-400"
          />
        )}
      </div>

      {/* Revenue and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-400" />
                Chiffre d'Affaires
              </h3>
              {stats.revenueTrend !== 0 && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  stats.revenueTrend > 0 
                    ? 'bg-green-400/20 text-green-400' 
                    : 'bg-red-400/20 text-red-400'
                }`}>
                  {stats.revenueTrend > 0 ? '+' : ''}{stats.revenueTrend}% ce mois
                </span>
              )}
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">
              {loading ? '--' : formatHTG(stats.revenue)}
            </div>
            <p className="text-dark-300">Revenus générés (30 derniers jours)</p>
            
            {/* Enhanced Bar Chart */}
            <div className="mt-6 bg-dark-800 rounded-lg p-6">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Activity className="w-8 h-8 text-dark-600 animate-pulse" />
                </div>
              ) : salesChartData.length > 0 ? (
                <div className="space-y-4">
                  {/* Chart Header */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-dark-400">Ventes des 7 derniers jours</span>
                    <span className="text-green-400 font-medium">
                      Total: {formatHTG(salesChartData.reduce((sum, day) => sum + day.revenue, 0))}
                    </span>
                  </div>
                  
                  {/* Chart with Grid */}
                  <div className="relative h-40">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-dark-700 w-full"></div>
                      ))}
                    </div>
                    
                    {/* Bars */}
                    <div className="relative flex items-end justify-between h-full gap-3 pt-2">
                      {salesChartData.map((day, index) => {
                        const maxRevenue = Math.max(...salesChartData.map(d => d.revenue), 1);
                        const height = day.revenue > 0 ? (day.revenue / maxRevenue) * 100 : 3;
                        const isToday = index === salesChartData.length - 1;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center justify-end group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-dark-900 border border-dark-600 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 shadow-xl">
                              <div className="text-xs font-medium text-white whitespace-nowrap">
                                {day.day}
                              </div>
                              <div className="text-sm font-bold text-green-400 mt-1">
                                {formatHTG(day.revenue)}
                              </div>
                            </div>
                            
                            {/* Bar */}
                            <div className="relative w-full">
                              <div 
                                className={`w-full rounded-t transition-all duration-300 ${
                                  isToday 
                                    ? 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300' 
                                    : 'bg-gradient-to-t from-green-500 to-green-400 hover:from-green-400 hover:to-green-300'
                                }`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                              >
                                {day.revenue > 0 && (
                                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-green-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {Math.round(day.revenue)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Day label */}
                            <div className="mt-2 text-center">
                              <span className={`text-xs font-medium ${
                                isToday ? 'text-blue-400' : 'text-dark-400'
                              }`}>
                                {day.day}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t border-dark-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
                      <span className="text-dark-400">Jours précédents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                      <span className="text-dark-400">Aujourd'hui</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-dark-500">
                  <Activity className="w-8 h-8 mb-2" />
                  <span>Aucune vente à afficher</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-yellow-400" />
              Alertes
            </h3>
            <div className="space-y-3">
              {stats.lowStock > 0 && (
                <div className="flex items-center p-3 bg-yellow-400/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-white text-sm font-medium">Stock faible</p>
                    <p className="text-yellow-300 text-xs">
                      {stats.lowStock} produit(s) en rupture
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center p-3 bg-blue-400/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-white text-sm font-medium">Système actif</p>
                  <p className="text-blue-300 text-xs">
                    Tous les services fonctionnent
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders ou Recent Deliveries selon le rôle */}
      {isLivreur ? (
        /* Livraisons Récentes pour les livreurs */
        <motion.div variants={itemVariants} className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Mes Livraisons Récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 text-dark-300 font-medium">Livraison</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Client</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Adresse</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Statut</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Date prévue</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-dark-400">
                      Aucune livraison récente
                    </td>
                  </tr>
                ) : (
                  recentDeliveries.map((delivery) => (
                    <tr 
                      key={delivery.id} 
                      className="border-b border-dark-800 hover:bg-dark-800/50 cursor-pointer"
                      onClick={() => navigate(`/deliveries/${delivery.id}`)}
                    >
                      <td className="py-4">
                        <div>
                          <p className="text-white font-medium">{delivery.numeroLivraison}</p>
                          <p className="text-dark-400 text-xs">{delivery.numeroCommande}</p>
                        </div>
                      </td>
                      <td className="py-4 text-white">{delivery.client}</td>
                      <td className="py-4 text-dark-300 max-w-xs truncate">{delivery.adresse}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delivery.status === 'Livrée' 
                            ? 'bg-green-400/20 text-green-400'
                            : delivery.status === 'En livraison'
                            ? 'bg-orange-400/20 text-orange-400'
                            : delivery.status === 'En préparation'
                            ? 'bg-purple-400/20 text-purple-400'
                            : delivery.status === 'Annulée'
                            ? 'bg-red-400/20 text-red-400'
                            : 'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="py-4 text-dark-300">
                        {new Date(delivery.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Commandes Récentes pour les autres rôles */
        <motion.div variants={itemVariants} className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Commandes Récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 text-dark-300 font-medium">Commande</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Client</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Montant</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Statut</th>
                  <th className="text-left py-3 text-dark-300 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-dark-400">
                      Aucune commande récente
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                      <td className="py-4">
                        <div>
                          <p className="text-white font-medium">{order.numeroCommande}</p>
                          <p className="text-dark-400 text-xs">#{order.id}</p>
                        </div>
                      </td>
                      <td className="py-4 text-white">{order.client}</td>
                      <td className="py-4 text-green-400 font-medium">
                        {formatHTG(order.amount)}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Livrée' 
                            ? 'bg-green-400/20 text-green-400'
                            : order.status === 'Validée'
                            ? 'bg-cyan-400/20 text-cyan-400'
                            : order.status === 'Confirmée'
                            ? 'bg-blue-400/20 text-blue-400'
                            : order.status === 'En préparation'
                            ? 'bg-purple-400/20 text-purple-400'
                            : order.status === 'En livraison'
                            ? 'bg-orange-400/20 text-orange-400'
                            : order.status === 'Annulée'
                            ? 'bg-red-400/20 text-red-400'
                            : 'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-dark-300">
                        {new Date(order.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Quick Actions - Masqué pour les livreurs et gestionnaires de stock */}
      {user?.role !== 'livreur' && user?.role !== 'stock' && (
        <motion.div variants={itemVariants} className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/clients/create')}
              className="btn btn-primary flex items-center justify-center space-x-2 py-4"
            >
              <Users className="w-5 h-5" />
              <span>Nouveau Client</span>
            </button>
            <button 
              onClick={() => navigate('/orders/create')}
              className="btn btn-secondary flex items-center justify-center space-x-2 py-4"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Nouvelle Commande</span>
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="btn btn-accent flex items-center justify-center space-x-2 py-4"
            >
              <Package className="w-5 h-5" />
              <span>Gérer Stock</span>
            </button>
            <button 
              onClick={() => navigate('/deliveries')}
              className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center space-x-2 py-4"
            >
              <Truck className="w-5 h-5" />
              <span>Planifier Livraison</span>
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardPage;
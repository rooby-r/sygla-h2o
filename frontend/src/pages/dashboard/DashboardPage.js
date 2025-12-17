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
import { useTheme } from '../../contexts/ThemeContext';
import { reportService, orderService, deliveryService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { rolePermissions, hasPermission } from '../../config/permissions';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dashboardUpdateTrigger } = useDataUpdate();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    clients: 0,
    orders: 0,
    products: 0,
    deliveries: 0,
    revenue: 0,
    revenueToday: 0,
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
          deliveries = { total: 0, en_cours: 0, livrees: 0 },
          revenue = { current_month: 0, today: 0, trend: 0, last_7_days: [] }
        } = statsData;

        console.log('💰 Revenue current_month:', revenue.current_month);
        console.log('💰 Revenue today:', revenue.today);
        console.log('📊 Revenue last_7_days:', revenue.last_7_days);

        setStats({
          clients: clients.total || 0,
          orders: ordersStats.current_month || ordersStats.total || 0,
          products: products.total || 0,
          deliveries: deliveries.en_cours || 0,
          revenue: revenue.current_month || 0,
          revenueToday: revenue.today || 0,
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

        // Créer des données de graphique basées sur les données du backend (7 derniers jours)
        let last7Days = [];
        
        // Utiliser les données du backend si disponibles
        if (revenue.last_7_days && revenue.last_7_days.length > 0) {
          last7Days = revenue.last_7_days.map(dayData => {
            const date = new Date(dayData.date);
            return {
              date: dayData.date,
              day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
              revenue: dayData.revenue || 0
            };
          });
        } else {
          // Fallback: créer des données vides si le backend ne retourne rien
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
        }

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
          revenueToday: 0,
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
          <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>{title}</h3>
          <p className={`text-3xl font-bold ${color}`}>
            {loading ? '--' : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('400', '400/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{subtitle}</p>
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
          <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Bienvenue, {user?.first_name || user?.username}
          </h2>
          <p className={`flex items-center ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
            {user?.role && rolePermissions[user.role] && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400 mr-3">
                {rolePermissions[user.role].name}
              </span>
            )}
            <span>Tableau de bord - {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Dernière actualisation</p>
          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
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
              <h3 className={`text-xl font-semibold flex items-center ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <DollarSign className="w-6 h-6 mr-2 text-green-400" />
                {user?.role === 'admin' ? "Chiffre d'Affaires" : "Chiffre d'Affaires du Jour"}
              </h3>
              {user?.role === 'admin' && stats.revenueTrend !== 0 && (
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
              {loading ? '--' : formatHTG(user?.role === 'admin' ? stats.revenue : stats.revenueToday)}
            </div>
            <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
              {user?.role === 'admin' ? 'Revenus générés (30 derniers jours)' : "Revenus générés aujourd'hui"}
            </p>
            
            {/* Enhanced Bar Chart */}
            <div className={`mt-6 rounded-lg p-6 ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Activity className={`w-8 h-8 animate-pulse ${theme === 'light' ? 'text-slate-300' : 'text-dark-600'}`} />
                </div>
              ) : salesChartData.length > 0 ? (
                <div className="space-y-4">
                  {/* Chart Header */}
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Ventes des 7 derniers jours</span>
                    <span className="text-green-400 font-medium">
                      Total: {formatHTG(salesChartData.reduce((sum, day) => sum + day.revenue, 0))}
                    </span>
                  </div>
                  
                  {/* Chart with Grid - pt-16 for tooltip space */}
                  <div className="relative h-56 pt-14">
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-x-0 top-14 bottom-6 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`border-t w-full ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}></div>
                      ))}
                    </div>
                    
                    {/* Bars Container */}
                    <div className="absolute inset-x-0 top-14 bottom-6 flex items-end justify-between gap-3 px-2">
                      {salesChartData.map((day, index) => {
                        const maxRevenue = Math.max(...salesChartData.map(d => d.revenue), 1);
                        const heightPercent = day.revenue > 0 ? (day.revenue / maxRevenue) * 100 : 8;
                        const isToday = index === salesChartData.length - 1;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Tooltip - visible on hover */}
                            <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-xl 
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                              transition-all duration-200 ease-out
                              pointer-events-none z-50 shadow-2xl min-w-[130px] text-center ${
                              theme === 'light' 
                                ? 'bg-white border-2 border-green-200 shadow-lg' 
                                : 'bg-dark-900 border-2 border-green-500/30 shadow-lg shadow-green-500/10'
                            }`}>
                              {/* Arrow */}
                              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 
                                border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                                theme === 'light' ? 'border-t-white' : 'border-t-dark-900'
                              }`}></div>
                              
                              <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                                theme === 'light' ? 'text-slate-500' : 'text-dark-400'
                              }`}>
                                {isToday ? "Aujourd'hui" : day.day}
                              </div>
                              <div className={`text-lg font-bold ${isToday ? 'text-blue-500' : 'text-green-500'}`}>
                                {formatHTG(day.revenue)}
                              </div>
                              {day.revenue > 0 && (
                                <div className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-400' : 'text-dark-500'}`}>
                                  Chiffre d'affaires
                                </div>
                              )}
                            </div>
                            
                            {/* Bar */}
                            <div 
                              className={`w-full max-w-[45px] rounded-t-md transition-all duration-300 cursor-pointer shadow-lg 
                                hover:shadow-xl hover:scale-105 ${
                                isToday 
                                  ? 'bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300' 
                                  : 'bg-gradient-to-t from-green-600 to-green-400 hover:from-green-500 hover:to-green-300'
                              }`}
                              style={{ height: `${Math.max(heightPercent, 5)}%`, minHeight: '6px' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Day labels - Fixed at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-3 px-2">
                      {salesChartData.map((day, index) => {
                        const isToday = index === salesChartData.length - 1;
                        return (
                          <div key={index} className="flex-1 text-center">
                            <span className={`text-xs font-medium ${
                              isToday ? 'text-blue-400' : theme === 'light' ? 'text-slate-500' : 'text-dark-400'
                            }`}>
                              {day.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className={`flex items-center justify-center gap-4 text-xs pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
                      <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Jours précédents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                      <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Aujourd'hui</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-40 ${theme === 'light' ? 'text-slate-400' : 'text-dark-500'}`}>
                  <Activity className="w-8 h-8 mb-2" />
                  <span>Aucune vente à afficher</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="card p-6">
            <h3 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <AlertTriangle className="w-6 h-6 mr-2 text-yellow-400" />
              Alertes
            </h3>
            <div className="space-y-3">
              {stats.lowStock > 0 && (
                <div className="flex items-center p-3 bg-yellow-400/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                  <div>
                    <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Stock faible</p>
                    <p className="text-yellow-600 text-xs">
                      {stats.lowStock} produit(s) en rupture
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center p-3 bg-blue-400/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Système actif</p>
                  <p className="text-blue-600 text-xs">
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
          <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Mes Livraisons Récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Livraison</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Client</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Adresse</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Statut</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Date prévue</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                      Aucune livraison récente
                    </td>
                  </tr>
                ) : (
                  recentDeliveries.map((delivery) => (
                    <tr 
                      key={delivery.id} 
                      className={`border-b cursor-pointer ${theme === 'light' ? 'border-slate-100 hover:bg-slate-50' : 'border-dark-800 hover:bg-dark-800/50'}`}
                      onClick={() => navigate(`/deliveries/${delivery.id}`)}
                    >
                      <td className="py-4">
                        <div>
                          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{delivery.numeroLivraison}</p>
                          <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{delivery.numeroCommande}</p>
                        </div>
                      </td>
                      <td className={`py-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{delivery.client}</td>
                      <td className={`py-4 max-w-xs truncate ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>{delivery.adresse}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delivery.status === 'Livrée' 
                            ? 'bg-green-400/20 text-green-600'
                            : delivery.status === 'En livraison'
                            ? 'bg-orange-400/20 text-orange-600'
                            : delivery.status === 'En préparation'
                            ? 'bg-purple-400/20 text-purple-600'
                            : delivery.status === 'Annulée'
                            ? 'bg-red-400/20 text-red-600'
                            : 'bg-yellow-400/20 text-yellow-600'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className={`py-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
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
          <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Commandes Récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Commande</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Client</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Montant</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Statut</th>
                  <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                      Aucune commande récente
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className={`border-b ${theme === 'light' ? 'border-slate-100 hover:bg-slate-50' : 'border-dark-800 hover:bg-dark-800/50'}`}>
                      <td className="py-4">
                        <div>
                          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{order.numeroCommande}</p>
                          <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>#{order.id}</p>
                        </div>
                      </td>
                      <td className={`py-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{order.client}</td>
                      <td className="py-4 text-green-500 font-medium">
                        {formatHTG(order.amount)}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Livrée' 
                            ? 'bg-green-400/20 text-green-600'
                            : order.status === 'Validée'
                            ? 'bg-cyan-400/20 text-cyan-600'
                            : order.status === 'Confirmée'
                            ? 'bg-blue-400/20 text-blue-600'
                            : order.status === 'En préparation'
                            ? 'bg-purple-400/20 text-purple-600'
                            : order.status === 'En livraison'
                            ? 'bg-orange-400/20 text-orange-600'
                            : order.status === 'Annulée'
                            ? 'bg-red-400/20 text-red-600'
                            : 'bg-yellow-400/20 text-yellow-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={`py-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
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
          <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/clients/create')}
              className="btn btn-primary flex items-center justify-center space-x-2 py-4"
            >
              <Users className="w-5 h-5" />
              <span>Nouveau Client</span>
            </button>
            <button 
              onClick={() => navigate('/sales/create')}
              className="btn btn-secondary flex items-center justify-center space-x-2 py-4"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Nouvelles Ventes</span>
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
              <span>Livraisons</span>
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashboardPage;
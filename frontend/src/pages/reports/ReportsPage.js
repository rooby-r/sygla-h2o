import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  Download,
  Eye,
  FileText,
  PieChart
} from 'lucide-react';
import Button from '../../components/ui/Button.js';
import { formatHTG } from '../../utils/currency';
import { reportService, clientService } from '../../services/api.js';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext';

const ReportsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Les non-admins voient uniquement les stats du jour
  const isAdmin = user?.role === 'admin';
  const [selectedPeriod, setSelectedPeriod] = useState(isAdmin ? 'month' : 'day');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalClients: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients] = useState([]);

  // Charger les données réelles depuis l'API
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Tentative de récupération des données de rapport...');
        
        // Récupérer les statistiques du dashboard
        const dashboardStats = await reportService.getDashboardStats();
        console.log('📊 Statistiques reçues:', dashboardStats);
        
        // Récupérer le rapport de ventes
        const salesReport = await reportService.getSalesReport({ period: selectedPeriod });
        console.log('📈 Rapport de ventes reçu:', salesReport);

        // Mettre à jour les statistiques
        // Pour les non-admins, utiliser les données du jour
        if (isAdmin) {
          setStats({
            totalRevenue: dashboardStats.revenue?.current_month || 0,
            totalOrders: dashboardStats.orders?.total || 0,
            totalClients: dashboardStats.clients?.total || 0,
            totalProducts: dashboardStats.products?.total || 0,
            averageOrderValue: salesReport.summary?.average_order_value || 0,
            growthRate: dashboardStats.revenue?.trend || 0
          });
        } else {
          // Données journalières pour les non-admins (vendeur, stock, livreur)
          setStats({
            totalRevenue: dashboardStats.revenue?.today || 0,
            totalOrders: dashboardStats.orders?.today || 0,
            totalClients: dashboardStats.clients?.today || 0,
            totalProducts: dashboardStats.products?.total || 0,
            averageOrderValue: salesReport.summary?.average_order_value || 0,
            growthRate: 0 // Pas de tendance pour les données journalières
          });
        }

        // Utiliser les données réelles du rapport de ventes
        if (salesReport.daily_sales && salesReport.daily_sales.length > 0) {
          const recentSales = salesReport.daily_sales.slice(-5).map(day => ({
            month: new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            revenue: day.revenue,
            orders: day.orders
          }));
          setSalesData(recentSales);
        } else {
          // Si pas de données de ventes quotidiennes, utiliser les données du mois actuel
          setSalesData([{
            month: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            revenue: dashboardStats.revenue?.current_month || 0,
            orders: dashboardStats.orders?.current_month || 0
          }]);
        }

        // Utiliser les top produits du rapport - DONNÉES RÉELLES UNIQUEMENT
        setTopProducts(salesReport.top_products || []);

        // Utiliser les top clients du rapport - DONNÉES RÉELLES UNIQUEMENT  
        setTopClients(salesReport.top_clients || []);

      } catch (error) {
        console.error('❌ Erreur lors du chargement des données de rapport:', error);
        
        // Si erreur d'authentification, utiliser les données du dashboard quand même
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('🔒 Erreur d\'authentification, tentative avec dashboard stats seulement');
          toast.error('Erreur d\'authentification - Chargement partiel des données');
          
          try {
            // Essayer de récupérer au moins les stats du dashboard
            const dashboardStats = await reportService.getDashboardStats();
            setStats({
              totalRevenue: dashboardStats.revenue?.current_month || 0,
              totalOrders: dashboardStats.orders?.total || 0,
              totalClients: dashboardStats.clients?.total || 0,
              totalProducts: dashboardStats.products?.total || 0,
              averageOrderValue: dashboardStats.revenue?.current_month && dashboardStats.orders?.total ? 
                (dashboardStats.revenue.current_month / dashboardStats.orders.total) : 0,
              growthRate: dashboardStats.revenue?.trend || 0
            });
            
            // Données de base pour le graphique
            setSalesData([{
              month: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
              revenue: dashboardStats.revenue?.current_month || 0,
              orders: dashboardStats.orders?.current_month || 0
            }]);
          } catch (dashError) {
            console.error('Erreur même pour les stats dashboard:', dashError);
            // En dernier recours, tout à zéro
            setStats({
              totalRevenue: 0,
              totalOrders: 0,
              totalClients: 0,
              totalProducts: 0,
              averageOrderValue: 0,
              growthRate: 0
            });
            setSalesData([]);
          }
        } else {
          toast.error('Erreur lors du chargement des données de rapport');
          // Pour autres erreurs, mettre à zéro
          setStats({
            totalRevenue: 0,
            totalOrders: 0,
            totalClients: 0,
            totalProducts: 0,
            averageOrderValue: 0,
            growthRate: 0
          });
          setSalesData([]);
        }
        
        // Listes vides en cas d'erreur
        setTopProducts([]);
        setTopClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [selectedPeriod, isAuthenticated, user]);

  // Fonction d'export PDF
  const handleExportPDF = async () => {
    try {
      const params = { period: selectedPeriod };
      const blob = await reportService.exportToPDF('sales', params);
      const filename = `rapport_ventes_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      reportService.downloadFile(blob, filename);
      toast.success('Rapport exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export du rapport');
    }
  };

  // Fonction pour générer un rapport selon le type
  const handleGenerateReport = async (reportType) => {
    try {
      setSelectedReport(reportType);
      toast.loading(`Génération du rapport ${reportTypes.find(r => r.id === reportType)?.name}...`);
      
      const params = { period: selectedPeriod };
      const blob = await reportService.exportToPDF(reportType, params);
      const reportName = reportTypes.find(r => r.id === reportType)?.name || reportType;
      const filename = `rapport_${reportType}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      reportService.downloadFile(blob, filename);
      toast.dismiss();
      toast.success(`Rapport ${reportName} généré avec succès`);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast.dismiss();
      toast.error(`Erreur lors de la génération du rapport ${reportTypes.find(r => r.id === reportType)?.name}`);
    }
  };

  // Fonction pour les rapports rapides
  const handleQuickReport = async (reportType, reportName) => {
    try {
      toast.loading(`Génération du ${reportName}...`);
      
      // Utiliser la période actuelle pour tous les rapports rapides
      const params = { period: 'month' };
      const blob = await reportService.exportToPDF(reportType, params);
      const filename = `${reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      reportService.downloadFile(blob, filename);
      toast.dismiss();
      toast.success(`${reportName} généré avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.dismiss();
      toast.error(`Erreur lors de la génération du ${reportName}`);
    }
  };

  // Fonction pour voir les détails d'un client
  const handleViewClient = async (clientName) => {
    try {
      // Chercher le client par nom
      const clientsResponse = await clientService.getAll();
      const client = clientsResponse.results?.find(c => c.raison_sociale === clientName);
      
      if (client) {
        // Naviguer vers la page de détails du client
        navigate(`/clients/${client.id}`);
      } else {
        toast.error('Client introuvable');
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du client:', error);
      toast.error('Erreur lors de l\'accès aux détails du client');
    }
  };

  const reportTypes = [
    { id: 'sales', name: 'Ventes', icon: TrendingUp },
    { id: 'clients', name: 'Clients', icon: Users },
    { id: 'products', name: 'Produits', icon: Package },
    { id: 'deliveries', name: 'Livraisons', icon: ShoppingCart }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
          <h2 className={`text-3xl font-bold mb-2 flex items-center ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <BarChart3 className="w-8 h-8 mr-3 text-primary-400" />
            Rapports & Statistiques
          </h2>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
            Analysez les performances de votre entreprise
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isAdmin ? (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`input ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          ) : (
            <div className={`px-4 py-2 rounded-lg font-medium ${theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-dark-700 text-dark-200'}`}>
              Aujourd'hui
            </div>
          )}
          <Button onClick={handleExportPDF} className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Exporter</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className={`stat-card animate-pulse ${theme === 'light' ? 'bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg' : ''}`}>
              <div className={`h-4 rounded mb-2 ${theme === 'light' ? 'bg-slate-200' : 'bg-dark-600'}`}></div>
              <div className={`h-8 rounded mb-2 ${theme === 'light' ? 'bg-slate-200' : 'bg-dark-600'}`}></div>
              <div className={`h-4 rounded w-3/4 ${theme === 'light' ? 'bg-slate-200' : 'bg-dark-600'}`}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-shadow' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                  {isAdmin ? "Chiffre d'Affaires" : "CA du Jour"}
                </h3>
                <p className={`text-3xl font-bold ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                  {formatHTG(stats.totalRevenue)}
                </p>
                {isAdmin && stats.growthRate !== 0 && (
                  <p className={`text-sm flex items-center mt-1 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{stats.growthRate}% ce mois
                  </p>
                )}
                {!isAdmin && (
                  <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Aujourd'hui
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-green-100' : 'bg-green-400/10'}`}>
                <DollarSign className={`w-8 h-8 ${theme === 'light' ? 'text-green-600' : 'text-green-400/50'}`} />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-shadow' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                  {isAdmin ? 'Commandes' : 'Commandes du Jour'}
                </h3>
                <p className={`text-3xl font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>{stats.totalOrders}</p>
                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>
                  {isAdmin ? `Valeur moyenne: ${formatHTG(stats.averageOrderValue)}` : "Aujourd'hui"}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-400/10'}`}>
                <ShoppingCart className={`w-8 h-8 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400/50'}`} />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 shadow-lg hover:shadow-xl transition-shadow' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                  {isAdmin ? 'Clients Actifs' : 'Clients du Jour'}
                </h3>
                <p className={`text-3xl font-bold ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>{stats.totalClients}</p>
                {isAdmin ? (
                  <p className={`text-sm ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>+3 nouveaux ce mois</p>
                ) : (
                  <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Nouveaux aujourd'hui</p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-purple-100' : 'bg-purple-400/10'}`}>
                <Users className={`w-8 h-8 ${theme === 'light' ? 'text-purple-600' : 'text-purple-400/50'}`} />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Types */}
      <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg' : ''}`}>
        <h3 className={`text-xl font-semibold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Types de Rapports</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const colorMap = {
              sales: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-500' },
              clients: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', icon: 'text-violet-500' },
              products: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'text-amber-500' },
              deliveries: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', icon: 'text-sky-500' }
            };
            const colors = colorMap[report.id] || colorMap.sales;
            
            return (
              <button
                key={report.id}
                onClick={() => handleGenerateReport(report.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  selectedReport === report.id
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500 shadow-md'
                    : theme === 'light'
                      ? `${colors.bg} ${colors.border} ${colors.text} hover:shadow-md`
                      : 'border-dark-700 hover:border-primary-500/50 text-dark-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center ${theme === 'light' && selectedReport !== report.id ? 'bg-white shadow-sm' : ''}`}>
                  <Icon className={`w-8 h-8 ${theme === 'light' && selectedReport !== report.id ? colors.icon : ''}`} />
                </div>
                <p className="font-semibold text-lg">{report.name}</p>
                <p className={`text-xs mt-1 ${theme === 'light' ? 'opacity-70' : 'text-dark-400'}`}>Cliquer pour générer</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-gradient-to-br from-white to-emerald-50/20 border border-slate-200 shadow-lg' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Évolution des Ventes</h3>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${theme === 'light' ? 'bg-green-100 text-green-600' : 'text-green-400'}`}>
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold text-sm">+{stats.growthRate}%</span>
            </div>
          </div>
          
          {/* Simple bar chart simulation */}
          <div className="space-y-4">
            {salesData.map((data, index) => {
              const maxRevenue = Math.max(...salesData.map(d => d.revenue));
              return (
                <div key={data.month} className="flex items-center space-x-4">
                  <div className={`w-12 text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>{data.month}</div>
                  <div className={`flex-1 rounded-full h-8 relative overflow-hidden ${theme === 'light' ? 'bg-slate-100' : 'bg-dark-800'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className={`h-full rounded-full ${theme === 'light' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'}`}
                    />
                    <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                      {formatHTG(data.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-gradient-to-br from-white to-amber-50/20 border border-slate-200 shadow-lg' : ''}`}>
          <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Produits les Plus Vendus</h3>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => {
                const medalColors = ['from-yellow-400 to-amber-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];
                return (
                  <div key={product.name} className={`flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02] ${theme === 'light' ? 'bg-white border border-slate-100 shadow-sm hover:shadow-md' : 'bg-dark-800'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${medalColors[index] || 'from-primary-500 to-secondary-500'} flex items-center justify-center text-white font-bold shadow-md`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{product.name}</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{product.quantity || 0} unités vendues</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>{formatHTG(product.revenue || 0)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-dark-700'}`}>
                  <Package className={`w-8 h-8 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                </div>
                <p className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Aucune donnée de vente de produits disponible</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Clients */}
      <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-gradient-to-br from-white to-violet-50/20 border border-slate-200 shadow-lg' : ''}`}>
        <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Meilleurs Clients</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'light' ? 'bg-slate-50/80' : ''}`}>
                <th className={`text-left py-4 px-3 font-semibold rounded-l-lg ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Rang</th>
                <th className={`text-left py-4 px-3 font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Client</th>
                <th className={`text-left py-4 px-3 font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Commandes</th>
                <th className={`text-left py-4 px-3 font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Chiffre d'Affaires</th>
                <th className={`text-left py-4 px-3 font-semibold rounded-r-lg ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topClients.length > 0 ? (
                topClients.map((client, index) => {
                  const medalColors = ['from-yellow-400 to-amber-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-700'];
                  return (
                    <tr key={client.name} className={`transition-all ${theme === 'light' ? 'hover:bg-violet-50/50' : 'hover:bg-dark-800/50'}`}>
                      <td className="py-4 px-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${medalColors[index] || 'from-primary-500 to-secondary-500'} flex items-center justify-center text-white font-bold shadow-md`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <p className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{client.name}</p>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'text-blue-400'}`}>
                          {client.orders || 0}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`font-bold text-lg ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                          {formatHTG(client.revenue || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <button 
                          onClick={() => handleViewClient(client.name)}
                          className={`group relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${theme === 'light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md' : 'text-blue-400 hover:bg-blue-400/20'}`}
                          title="Voir les détails du client"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-dark-700'}`}>
                      <Users className={`w-10 h-10 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                    </div>
                    <p className={`font-medium text-lg ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Aucune donnée de clients disponible</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Reports */}
      <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-gradient-to-br from-white to-sky-50/30 border border-slate-200 shadow-lg' : ''}`}>
        <h3 className={`text-xl font-semibold mb-6 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Rapports Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' 
                ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 text-emerald-700 hover:border-emerald-400' 
                : 'bg-dark-800 border-dark-700 text-white hover:border-primary-500'
            }`}
            onClick={() => handleQuickReport('sales', 'Rapport Mensuel')}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-emerald-100' : 'bg-primary-500/20'}`}>
              <FileText className={`w-6 h-6 ${theme === 'light' ? 'text-emerald-600' : 'text-primary-400'}`} />
            </div>
            <span className="font-semibold">Rapport Mensuel</span>
            <span className={`text-xs mt-1 ${theme === 'light' ? 'text-emerald-600/70' : 'text-dark-400'}`}>Ventes du mois</span>
          </button>
          <button 
            className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' 
                ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200 text-amber-700 hover:border-amber-400' 
                : 'bg-dark-800 border-dark-700 text-white hover:border-primary-500'
            }`}
            onClick={() => handleQuickReport('products', 'Analyse Produits')}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-amber-100' : 'bg-primary-500/20'}`}>
              <BarChart3 className={`w-6 h-6 ${theme === 'light' ? 'text-amber-600' : 'text-primary-400'}`} />
            </div>
            <span className="font-semibold">Analyse Produits</span>
            <span className={`text-xs mt-1 ${theme === 'light' ? 'text-amber-600/70' : 'text-dark-400'}`}>État des stocks</span>
          </button>
          <button 
            className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' 
                ? 'bg-gradient-to-br from-violet-50 to-white border-violet-200 text-violet-700 hover:border-violet-400' 
                : 'bg-dark-800 border-dark-700 text-white hover:border-primary-500'
            }`}
            onClick={() => handleQuickReport('clients', 'Rapport Clients')}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-violet-100' : 'bg-primary-500/20'}`}>
              <Users className={`w-6 h-6 ${theme === 'light' ? 'text-violet-600' : 'text-primary-400'}`} />
            </div>
            <span className="font-semibold">Rapport Clients</span>
            <span className={`text-xs mt-1 ${theme === 'light' ? 'text-violet-600/70' : 'text-dark-400'}`}>Portefeuille client</span>
          </button>
          <button 
            className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              theme === 'light' 
                ? 'bg-gradient-to-br from-sky-50 to-white border-sky-200 text-sky-700 hover:border-sky-400' 
                : 'bg-dark-800 border-dark-700 text-white hover:border-primary-500'
            }`}
            onClick={() => handleQuickReport('sales', 'Répartition CA')}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-sky-100' : 'bg-primary-500/20'}`}>
              <PieChart className={`w-6 h-6 ${theme === 'light' ? 'text-sky-600' : 'text-primary-400'}`} />
            </div>
            <span className="font-semibold">Répartition CA</span>
            <span className={`text-xs mt-1 ${theme === 'light' ? 'text-sky-600/70' : 'text-dark-400'}`}>Chiffre d'affaires</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
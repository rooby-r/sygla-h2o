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

const ReportsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
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
        setStats({
          totalRevenue: dashboardStats.revenue?.current_month || 0,
          totalOrders: dashboardStats.orders?.total || 0,
          totalClients: dashboardStats.clients?.total || 0,
          totalProducts: dashboardStats.products?.total || 0,
          averageOrderValue: salesReport.summary?.average_order_value || 0,
          growthRate: dashboardStats.revenue?.trend || 0
        });

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
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary-400" />
            Rapports & Statistiques
          </h2>
          <p className="text-dark-300">
            Analysez les performances de votre entreprise
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
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
            <div key={index} className="stat-card animate-pulse">
              <div className="h-4 bg-dark-600 rounded mb-2"></div>
              <div className="h-8 bg-dark-600 rounded mb-2"></div>
              <div className="h-4 bg-dark-600 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark-200 mb-1">Chiffre d'Affaires</h3>
                <p className="text-3xl font-bold text-green-400">
                  {formatHTG(stats.totalRevenue)}
                </p>
                <p className="text-sm text-green-400 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{stats.growthRate}% ce mois
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400/50" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark-200 mb-1">Commandes</h3>
                <p className="text-3xl font-bold text-blue-400">{stats.totalOrders}</p>
                <p className="text-sm text-dark-400">
                  Valeur moyenne: {formatHTG(stats.averageOrderValue)}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-400/50" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark-200 mb-1">Clients Actifs</h3>
                <p className="text-3xl font-bold text-purple-400">{stats.totalClients}</p>
                <p className="text-sm text-purple-400">+3 nouveaux ce mois</p>
              </div>
              <Users className="w-8 h-8 text-purple-400/50" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Types */}
      <motion.div variants={itemVariants} className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Types de Rapports</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => handleGenerateReport(report.id)}
                className={`p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${
                  selectedReport === report.id
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-dark-700 hover:border-primary-500/50 text-dark-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className="w-10 h-10 mx-auto mb-3" />
                <p className="font-medium text-lg">{report.name}</p>
                <p className="text-xs text-dark-400 mt-1">Cliquer pour générer</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Évolution des Ventes</h3>
            <div className="flex items-center space-x-2 text-green-400">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">+{stats.growthRate}%</span>
            </div>
          </div>
          
          {/* Simple bar chart simulation */}
          <div className="space-y-4">
            {salesData.map((data, index) => {
              const maxRevenue = Math.max(...salesData.map(d => d.revenue));
              return (
                <div key={data.month} className="flex items-center space-x-4">
                  <div className="w-8 text-dark-300 text-sm">{data.month}</div>
                  <div className="flex-1 bg-dark-800 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                      {formatHTG(data.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div variants={itemVariants} className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Produits les Plus Vendus</h3>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-dark-400 text-sm">{product.quantity || 0} unités vendues</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-medium">{formatHTG(product.revenue || 0)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-dark-400 mb-4" />
                <p className="text-dark-400">Aucune donnée de vente de produits disponible</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Clients */}
      <motion.div variants={itemVariants} className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Meilleurs Clients</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 text-dark-300 font-medium">Rang</th>
                <th className="text-left py-3 text-dark-300 font-medium">Client</th>
                <th className="text-left py-3 text-dark-300 font-medium">Commandes</th>
                <th className="text-left py-3 text-dark-300 font-medium">Chiffre d'Affaires</th>
                <th className="text-left py-3 text-dark-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topClients.length > 0 ? (
                topClients.map((client, index) => (
                  <tr key={client.name} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                    <td className="py-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-white font-medium">{client.name}</p>
                    </td>
                    <td className="py-4 text-blue-400 font-medium">{client.orders || 0}</td>
                    <td className="py-4 text-green-400 font-medium">
                      {formatHTG(client.revenue || 0)}
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleViewClient(client.name)}
                        className="group relative p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Voir les détails du client"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Voir les détails
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-dark-400 mb-4" />
                    <p className="text-dark-400">Aucune donnée de clients disponible</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Reports */}
      <motion.div variants={itemVariants} className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Rapports Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="secondary" 
            className="flex flex-col items-center space-y-2 p-4 h-auto hover:scale-105 transition-transform"
            onClick={() => handleQuickReport('sales', 'Rapport Mensuel')}
          >
            <FileText className="w-6 h-6" />
            <span>Rapport Mensuel</span>
            <span className="text-xs text-dark-400">Ventes du mois</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex flex-col items-center space-y-2 p-4 h-auto hover:scale-105 transition-transform"
            onClick={() => handleQuickReport('products', 'Analyse Produits')}
          >
            <BarChart3 className="w-6 h-6" />
            <span>Analyse Produits</span>
            <span className="text-xs text-dark-400">État des stocks</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex flex-col items-center space-y-2 p-4 h-auto hover:scale-105 transition-transform"
            onClick={() => handleQuickReport('clients', 'Rapport Clients')}
          >
            <Users className="w-6 h-6" />
            <span>Rapport Clients</span>
            <span className="text-xs text-dark-400">Portefeuille client</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex flex-col items-center space-y-2 p-4 h-auto hover:scale-105 transition-transform"
            onClick={() => handleQuickReport('sales', 'Répartition CA')}
          >
            <PieChart className="w-6 h-6" />
            <span>Répartition CA</span>
            <span className="text-xs text-dark-400">Chiffre d'affaires</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
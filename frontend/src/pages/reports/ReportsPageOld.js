import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { clientService, productService, orderService } from '../../services/api.js';
import { toast } from 'react-hot-toast';

const ReportsPage = () => {
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
        
        // Récupérer les données de base
        const [clientsResponse, productsResponse, ordersResponse] = await Promise.all([
          clientService.getClients(),
          productService.getProducts(),
          orderService.getOrders()
        ]);

        const clients = clientsResponse.data;
        const products = productsResponse.data;
        const orders = ordersResponse.data;

        // Calculer les statistiques
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.montant_total || 0), 0);
        const totalOrders = orders.length;
        const totalClients = clients.length;
        const totalProducts = products.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculer le taux de croissance (simulé à 12.5% pour l'instant)
        const growthRate = 12.5;

        setStats({
          totalRevenue,
          totalOrders,
          totalClients,
          totalProducts,
          averageOrderValue,
          growthRate
        });

        // Calculer les données de ventes par mois (simulation avec les données existantes)
        const salesByMonth = [
          { month: 'Jan', revenue: totalRevenue * 0.15, orders: Math.floor(totalOrders * 0.15) },
          { month: 'Fév', revenue: totalRevenue * 0.18, orders: Math.floor(totalOrders * 0.18) },
          { month: 'Mar', revenue: totalRevenue * 0.17, orders: Math.floor(totalOrders * 0.17) },
          { month: 'Avr', revenue: totalRevenue * 0.22, orders: Math.floor(totalOrders * 0.22) },
          { month: 'Mai', revenue: totalRevenue * 0.28, orders: Math.floor(totalOrders * 0.28) }
        ];
        setSalesData(salesByMonth);

        // Top produits basés sur les commandes
        const productSales = {};
        orders.forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              if (!productSales[item.produit]) {
                productSales[item.produit] = {
                  name: item.produit,
                  sales: 0,
                  revenue: 0
                };
              }
              productSales[item.produit].sales += item.quantite;
              productSales[item.produit].revenue += item.quantite * item.prix_unitaire;
            });
          }
        });

        const topProductsList = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 4);
        setTopProducts(topProductsList);

        // Top clients basés sur les commandes
        const clientSales = {};
        orders.forEach(order => {
          const clientName = order.client?.raison_sociale || 'Client inconnu';
          if (!clientSales[clientName]) {
            clientSales[clientName] = {
              name: clientName,
              orders: 0,
              revenue: 0
            };
          }
          clientSales[clientName].orders += 1;
          clientSales[clientName].revenue += parseFloat(order.montant_total || 0);
        });

        const topClientsList = Object.values(clientSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 4);
        setTopClients(topClientsList);

      } catch (error) {
        console.error('Erreur lors du chargement des données de rapport:', error);
        toast.error('Erreur lors du chargement des données de rapport');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [selectedPeriod]);

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
          <Button className="flex items-center space-x-2">
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
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  selectedReport === report.id
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-dark-700 hover:border-dark-600 text-dark-300 hover:text-white'
                }`}
              >
                <Icon className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">{report.name}</p>
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
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-dark-400 text-sm">{product.sales} unités vendues</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">{formatHTG(product.revenue)}</p>
                </div>
              </div>
            ))}
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
              {topClients.map((client, index) => (
                <tr key={client.name} className="border-b border-dark-800 hover:bg-dark-800/50">
                  <td className="py-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-white font-medium">{client.name}</p>
                  </td>
                  <td className="py-4 text-blue-400 font-medium">{client.orders}</td>
                  <td className="py-4 text-green-400 font-medium">
                    {formatHTG(client.revenue)}
                  </td>
                  <td className="py-4">
                    <button className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Reports */}
      <motion.div variants={itemVariants} className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Rapports Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="secondary" className="flex flex-col items-center space-y-2 p-4 h-auto">
            <FileText className="w-6 h-6" />
            <span>Rapport Mensuel</span>
          </Button>
          <Button variant="secondary" className="flex flex-col items-center space-y-2 p-4 h-auto">
            <BarChart3 className="w-6 h-6" />
            <span>Analyse Produits</span>
          </Button>
          <Button variant="secondary" className="flex flex-col items-center space-y-2 p-4 h-auto">
            <Users className="w-6 h-6" />
            <span>Rapport Clients</span>
          </Button>
          <Button variant="secondary" className="flex flex-col items-center space-y-2 p-4 h-auto">
            <PieChart className="w-6 h-6" />
            <span>Répartition CA</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
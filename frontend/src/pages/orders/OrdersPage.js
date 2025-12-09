import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Calendar,
  User,
  Package,
  Filter,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { orderService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useTheme } from '../../contexts/ThemeContext';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { triggerDashboardUpdate, onOrderDeleted } = useDataUpdate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorShown, setErrorShown] = useState(false);

  // Mock data for orders
  const mockOrders = [
    {
      id: 1,
      numero_commande: 'CMD-2025-001',
      client: {
        id: 1,
        nom: 'Restaurant Le Gourmet',
        contact: 'Jean Dupont'
      },
      date_commande: '2025-01-15T10:30:00',
      date_livraison_prevue: '2025-01-16T14:00:00',
      statut: 'confirmee',
      total: 27032.50, // 245.75 * 110 HTG
      notes: 'Livraison urgente pour événement',
      items: [
        {
          id: 1,
          produit: { nom: 'Eau Potable Premium', prix_unitaire: 165.00 },
          quantite: 100,
          prix_unitaire: 165.00, // 1.50 * 110 HTG
          total: 16500.00 // 150.00 * 110 HTG
        },
        {
          id: 2,
          produit: { nom: 'Glace Alimentaire', prix_unitaire: 82.50 },
          quantite: 80,
          prix_unitaire: 82.50, // 0.75 * 110 HTG
          total: 6600.00 // 60.00 * 110 HTG
        }
      ],
      created_by: 'admin@sygla-h2o.com',
      date_creation: '2025-01-15T10:30:00'
    },
    {
      id: 2,
      numero_commande: 'CMD-2025-002',
      client: {
        id: 2,
        nom: 'Hôtel Prestige',
        contact: 'Marie Martin'
      },
      date_commande: '2025-01-16T09:15:00',
      date_livraison_prevue: '2025-01-17T11:00:00',
      statut: 'en_livraison',
      total: 19855.00, // 180.50 * 110 HTG
      notes: 'Commande régulière hebdomadaire',
      items: [
        {
          id: 1,
          produit: { nom: 'Eau Minérale Naturelle', prix_unitaire: 2.00 },
          quantite: 75,
          prix_unitaire: 2.00,
          total: 150.00
        },
        {
          id: 2,
          produit: { nom: 'Glace Pilée', prix_unitaire: 1.20 },
          quantite: 25,
          prix_unitaire: 1.20,
          total: 30.00
        }
      ],
      created_by: 'vendeur@sygla-h2o.com',
      date_creation: '2025-01-16T09:15:00'
    },
    {
      id: 3,
      numero_commande: 'CMD-2025-003',
      client: {
        id: 3,
        nom: 'Café Central',
        contact: 'Pierre Durand'
      },
      date_commande: '2025-01-17T14:20:00',
      date_livraison_prevue: '2025-01-18T10:30:00',
      statut: 'en_attente',
      total: 10477.50, // 95.25 * 110 HTG
      notes: '',
      items: [
        {
          id: 1,
          produit: { nom: 'Eau Potable Premium', prix_unitaire: 1.50 },
          quantite: 50,
          prix_unitaire: 1.50,
          total: 75.00
        },
        {
          id: 2,
          produit: { nom: 'Glace Alimentaire', prix_unitaire: 0.75 },
          quantite: 27,
          prix_unitaire: 0.75,
          total: 20.25
        }
      ],
      created_by: 'vendeur@sygla-h2o.com',
      date_creation: '2025-01-17T14:20:00'
    }
  ];

  const mockClients = [
    { id: 1, nom: 'Restaurant Le Gourmet' },
    { id: 2, nom: 'Hôtel Prestige' },
    { id: 3, nom: 'Café Central' }
  ];

  const mockProducts = [
    { id: 1, nom: 'Eau Potable Premium', prix_unitaire: 1.50, unite_mesure: 'litre' },
    { id: 2, nom: 'Glace Alimentaire', prix_unitaire: 0.75, unite_mesure: 'kg' },
    { id: 3, nom: 'Eau Minérale Naturelle', prix_unitaire: 2.00, unite_mesure: 'litre' },
    { id: 4, nom: 'Glace Pilée', prix_unitaire: 1.20, unite_mesure: 'kg' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Récupérer les vraies données depuis l'API
      const response = await orderService.getAll();
      setOrders(response.results || response);
      setErrorShown(false); // Réinitialiser si succès
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      // En cas d'erreur, utiliser les données mock sans afficher d'erreur répétée
      if (!errorShown) {
        console.warn('⚠️ API non disponible, utilisation des données mock');
        setErrorShown(true);
      }
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = (order) => {
    navigate(`/orders/edit/${order.id}`);
  };

  const handleViewOrder = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        // Récupérer les données de la commande avant suppression
        const orderToDelete = orders.find(o => o.id === orderId);
        
        await orderService.delete(orderId);
        setOrders(orders.filter(o => o.id !== orderId));
        
        // Notifier la suppression pour mise à jour des autres composants
        onOrderDeleted(orderToDelete);
        
        // Déclencher la mise à jour du dashboard et de la sidebar
        triggerDashboardUpdate();
        
        toast.success('Commande supprimée avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression de la commande');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Cette fonction sera implémentée plus tard pour la création/édition de commandes
    toast.info('Fonctionnalité en cours de développement');
  };

  const handleInputChange = (e) => {
    // Cette fonction sera implémentée plus tard pour la création/édition de commandes
    const { name, value } = e.target;
    console.log('Input change:', name, value);
  };

  const addItem = () => {
    // Cette fonction sera implémentée plus tard pour la gestion des items
    toast.info('Fonctionnalité en cours de développement');
  };

  const removeItem = (index) => {
    // Cette fonction sera implémentée plus tard pour la gestion des items
    console.log('Remove item at index:', index);
  };

  const updateItem = (index, field, value) => {
    // Cette fonction sera implémentée plus tard pour la gestion des items
    console.log('Update item:', index, field, value);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, statut: newStatus } : o
    ));
    
    // Déclencher la mise à jour du dashboard et de la sidebar
    triggerDashboardUpdate();
    
    toast.success('Statut mis à jour avec succès');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-400/20 text-yellow-400';
      case 'confirmee': return 'bg-blue-400/20 text-blue-400';
      case 'en_preparation': return 'bg-purple-400/20 text-purple-400';
      case 'en_livraison': return 'bg-orange-400/20 text-orange-400';
      case 'livree': return 'bg-green-400/20 text-green-400';
      case 'annulee': return 'bg-red-400/20 text-red-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'en_attente': return Clock;
      case 'confirmee': return CheckCircle;
      case 'en_preparation': return Package;
      case 'en_livraison': return Truck;
      case 'livree': return CheckCircle;
      case 'annulee': return XCircle;
      default: return Clock;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.numero_commande.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.client?.raison_sociale || order.client?.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.statut === 'en_attente' || o.statut === 'attente').length;
  const completedOrders = orders.filter(o => o.statut === 'livree').length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.montant_total || 0), 0);

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
            <ShoppingCart className="w-8 h-8 mr-3 text-primary-400" />
            Gestion des Commandes
          </h2>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
            Suivez et gérez toutes vos commandes
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>Total Commandes</h3>
              <p className="text-3xl font-bold text-primary-400">{totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-primary-400/50" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>En Attente</h3>
              <p className="text-3xl font-bold text-yellow-400">{pendingOrders}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400/50" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>Livrées</h3>
              <p className="text-3xl font-bold text-green-400">{completedOrders}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400/50" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>CA Total</h3>
              <p className="text-3xl font-bold text-blue-400">
                {formatHTG(totalRevenue)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-400/50" />
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
            <input
              type="text"
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input pl-10 w-full ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`input w-48 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirmee">Confirmée</option>
            <option value="en_preparation">En préparation</option>
            <option value="en_livraison">En livraison</option>
            <option value="livree">Livrée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Commande</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Client</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Date</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Livraison</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Statut</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Paiement</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Total</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Chargement...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.statut);
                  
                  return (
                    <tr key={order.id} className={`border-b ${theme === 'light' ? 'border-slate-100 hover:bg-slate-50' : 'border-dark-800 hover:bg-dark-800/50'}`}>
                      <td className="py-4">
                        <div>
                          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{order.numero_commande}</p>
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{(order.items?.length || 0)} articles</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{order.client?.raison_sociale || order.client?.nom || 'Client non défini'}</p>
                          <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{order.client?.contact || 'Contact non défini'}</p>
                        </div>
                      </td>
                      <td className={`py-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                        {order.date_creation ? new Date(order.date_creation).toLocaleDateString('fr-FR') : 'Invalid Date'}
                      </td>
                      <td className={`py-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                        {/* Pour livraison à domicile, utiliser date_livraison_prevue, sinon utiliser date_creation */}
                        {(() => {
                          const dateToShow = order.date_livraison_prevue || order.date_creation;
                          return dateToShow ? new Date(dateToShow).toLocaleDateString('fr-FR') : 'Invalid Date';
                        })()}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center w-fit ${getStatusColor(order.statut)}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {order.statut.replace('_', ' ').charAt(0).toUpperCase() + order.statut.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="py-4">
                        {order.statut_paiement ? (
                          <div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.statut_paiement === 'paye' ? 'bg-green-500/20 text-green-400' :
                              order.statut_paiement === 'paye_partiel' ? 'bg-warning-500/20 text-warning-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {order.statut_paiement === 'paye' ? 'Payé' :
                               order.statut_paiement === 'paye_partiel' ? 'Partiel' : 'Impayé'}
                            </span>
                            {order.montant_paye > 0 && order.statut_paiement !== 'paye' && (
                              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                                {formatHTG(order.montant_paye)} / {formatHTG(order.montant_total)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>N/A</span>
                        )}
                      </td>
                      <td className="py-4 text-green-400 font-medium">
                        {formatHTG(order.montant_total)}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Boutons Modifier/Supprimer - uniquement pour les commandes en attente */}
                          {order.statut === 'en_attente' && (
                            <>
                              <button
                                onClick={() => handleEditOrder(order)}
                                className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrdersPage;
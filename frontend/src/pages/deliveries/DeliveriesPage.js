import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  User,
  Navigation,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deliveryService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext';

const DeliveriesPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    en_cours: 0,
    livrees: 0
  });

  // Vérifier si l'utilisateur connecté est un livreur
  const isDeliveryPerson = user?.role === 'livreur';
  const deliveryPersonName = isDeliveryPerson ? (user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username) : null;

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);

      // Récupérer les livraisons et les statistiques depuis l'API
      const [deliveriesResponse, statsResponse] = await Promise.all([
        deliveryService.getAll(),
        deliveryService.getStats()
      ]);

      console.log('📦 Données livraisons reçues:', deliveriesResponse);
      console.log('📊 Statistiques reçues:', statsResponse);

      // Normaliser la structure (supporter pagination ou liste simple)
      const deliveriesRaw = deliveriesResponse.results || deliveriesResponse;

      const mapStatus = (statut) => {
        if (statut === 'en_livraison') return 'en_cours';
        if (statut === 'livree') return 'livree';
        if (statut === 'annulee') return 'annulee';
        return statut || 'en_cours';
      };

      const mappedDeliveries = deliveriesRaw.map(order => ({
        id: order.id,
        // garder un numéro lisible pour l'UI
        numero_livraison: order.numero_commande ? `LIV-${order.id.toString().padStart(4, '0')}` : `LIV-${order.id.toString().padStart(4, '0')}`,
        commande: {
          numero_commande: order.numero_commande || `CMD-${order.id.toString().padStart(4, '0')}`,
          client: {
            nom: order.client?.raison_sociale || order.client?.nom || 'Client inconnu',
            adresse: order.client?.adresse || order.adresse_livraison || 'Adresse non spécifiée'
          }
        },
        date_livraison: order.date_livraison_prevue || order.date_creation,
        statut: mapStatus(order.statut),
        livreur: order.livreur?.nom || order.livreur || 'Non assigné',
        vehicule: order.vehicule || 'N/A',
        items: order.items || [],
        total: parseFloat(order.montant_total || order.montant_produits || 0),
        notes: order.notes || '',
        heure_depart: order.heure_depart || null,
        heure_arrivee_prevue: order.date_livraison_prevue || null,
        heure_arrivee_reelle: order.date_livraison_effective || null,
        adresse: order.adresse_livraison || order.client?.adresse || 'Adresse non spécifiée',
        signature_client: order.signature_client || null,
        type_livraison: order.type_livraison || 'retrait_magasin',
        isPrioritaire: order.notes?.includes('🎯 LIVRAISON PRIORITAIRE') || order.statut_paiement === 'paye'
      }));

      console.log('🚚 Livraisons mappées:', mappedDeliveries);
      setDeliveries(mappedDeliveries);
      
      // Utiliser les statistiques du backend avec valeurs par défaut
      setStats({
        total: statsResponse?.total || 0,
        en_cours: statsResponse?.en_cours || 0,
        livrees: statsResponse?.livrees || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons:', error);
      toast.error('Erreur lors du chargement des livraisons');
      
      // Valeurs par défaut en cas d'erreur
      setStats({
        total: 0,
        en_cours: 0,
        livrees: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Écouter les mises à jour du dashboard pour actualiser les livraisons
  useEffect(() => {
    const handleUpdate = () => {
      console.log('🔄 Mise à jour des livraisons après suppression de commande');
      fetchDeliveries();
    };

    // Écouter les événements de mise à jour du dashboard
    window.addEventListener('dashboard-update', handleUpdate);
    
    return () => {
      window.removeEventListener('dashboard-update', handleUpdate);
    };
  }, [fetchDeliveries]);

  const handleViewDelivery = (delivery) => {
    navigate(`/deliveries/${delivery.id}`);
  };

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      const response = await deliveryService.updateStatus(deliveryId, newStatus);
      console.log('✅ Statut mis à jour:', response);
      
      // Mettre à jour localement
      setDeliveries(deliveries.map(d => 
        d.id === deliveryId ? { ...d, statut: newStatus } : d
      ));
      
      // Message spécial pour les livreurs
      if (isDeliveryPerson && newStatus === 'en_livraison') {
        toast.success(`Livraison assignée à ${deliveryPersonName} et statut mis à jour`);
      } else {
        toast.success('Statut mis à jour avec succès');
      }
      
      // Recharger les données pour avoir les stats à jour
      fetchDeliveries();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_cours': return 'bg-orange-400/20 text-orange-400';
      case 'livree': return 'bg-green-400/20 text-green-400';
      case 'annulee': return 'bg-red-400/20 text-red-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'en_cours': return Truck;
      case 'livree': return CheckCircle;
      case 'annulee': return Clock;
      default: return Clock;
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.numero_livraison.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.commande.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.livreur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || delivery.statut === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Livraisons prioritaires en premier
    if (a.isPrioritaire && !b.isPrioritaire) return -1;
    if (!a.isPrioritaire && b.isPrioritaire) return 1;
    // Sinon tri par date
    return new Date(b.date_livraison) - new Date(a.date_livraison);
  });

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
            <Truck className="w-8 h-8 mr-3 text-primary-400" />
            Gestion des Livraisons
          </h2>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
            Suivez et gérez toutes vos livraisons en temps réel
          </p>
          {/* Badge pour les livreurs connectés */}
          {isDeliveryPerson && (
            <div className="mt-3 flex items-center">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2 flex items-center">
                <User className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-green-400 font-medium">
                  Connecté en tant que livreur: {deliveryPersonName}
                </span>
                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>Total Livraisons</h3>
              <p className="text-3xl font-bold text-primary-400">{stats.total}</p>
            </div>
            <Truck className="w-8 h-8 text-primary-400/50" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>En Cours</h3>
              <p className="text-3xl font-bold text-orange-400">{stats.en_cours}</p>
            </div>
            <Navigation className="w-8 h-8 text-orange-400/50" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`stat-card ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>Livrées</h3>
              <p className="text-3xl font-bold text-green-400">{stats.livrees}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400/50" />
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
              placeholder="Rechercher une livraison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input pl-10 w-full ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary flex items-center space-x-2 ${filterStatus !== 'all' ? 'ring-2 ring-primary-400' : ''}`}
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
              {filterStatus !== 'all' && (
                <span className="bg-primary-400 text-white text-xs px-2 py-0.5 rounded-full ml-1">1</span>
              )}
            </button>
            
            {/* Dropdown Filtres */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute right-0 top-full mt-2 w-64 rounded-lg shadow-xl z-50 border ${
                  theme === 'light' 
                    ? 'bg-white border-slate-200' 
                    : 'bg-dark-800 border-dark-700'
                }`}
              >
                <div className="p-4">
                  <h4 className={`font-semibold mb-3 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    Filtrer par statut
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Tous les statuts', icon: '📋' },
                      { value: 'en_cours', label: 'En cours', icon: '🚚' },
                      { value: 'livree', label: 'Livrée', icon: '✅' },
                      { value: 'annulee', label: 'Annulée', icon: '❌' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterStatus(option.value);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          filterStatus === option.value
                            ? 'bg-primary-500/20 text-primary-400'
                            : theme === 'light' 
                              ? 'hover:bg-slate-100 text-slate-700'
                              : 'hover:bg-dark-700 text-dark-200'
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                        {filterStatus === option.value && (
                          <span className="ml-auto text-primary-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {filterStatus !== 'all' && (
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setShowFilters(false);
                      }}
                      className={`w-full mt-3 text-center text-sm text-red-400 hover:text-red-300 py-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Deliveries Table */}
      <motion.div variants={itemVariants} className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Livraison</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Client</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Livreur</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Date/Heure</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Statut</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Adresse</th>
                <th className={`text-center py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Chargement...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Aucune livraison trouvée
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery, index) => {
                  const StatusIcon = getStatusIcon(delivery.statut);
                  
                  return (
                    <tr 
                      key={delivery.id} 
                      className={`border-b transition-colors ${
                        theme === 'light'
                          ? `border-slate-100 hover:bg-slate-50 ${delivery.isPrioritaire ? 'bg-green-50' : ''}`
                          : `border-dark-800 hover:bg-dark-800/50 ${delivery.isPrioritaire ? 'bg-green-500/5' : ''}`
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-4">
                        <div>
                          <p className={`font-medium flex items-center ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {delivery.isPrioritaire && <span className="mr-2">🎯</span>}
                            {delivery.numero_livraison}
                          </p>
                          <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{delivery.commande.numero_commande}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{delivery.commande.client.nom}</p>
                          <p className={`text-sm flex items-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                            <MapPin className="w-3 h-3 mr-1" />
                            {delivery.commande.client.adresse.split(',')[0]}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{delivery.livreur}</p>
                          <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{delivery.vehicule}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className={`text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {new Date(delivery.date_livraison).toLocaleDateString('fr-FR')}
                          </p>
                          <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                            {new Date(delivery.date_livraison).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center w-fit ${getStatusColor(delivery.statut)}`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {delivery.statut.replace('_', ' ').charAt(0).toUpperCase() + delivery.statut.replace('_', ' ').slice(1)}
                          </span>
                          {delivery.isPrioritaire && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit bg-green-500/20 text-green-400 border border-green-500/30">
                              <span className="mr-1">✓</span>
                              PRIORITAIRE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-4 max-w-xs truncate ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`} title={delivery.adresse}>
                        {delivery.adresse}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDelivery(delivery)}
                            className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

export default DeliveriesPage;
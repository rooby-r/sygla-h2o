import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Building, 
  Mail, 
  MapPin,
  Phone,
  User,
  FileText,
  Calendar,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Clock,
  Truck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { clientService } from '../../services/api';
import { formatHTG } from '../../utils/currency';

const ClientDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await fetchClient();
      await fetchOrderHistory();
    };
    
    fetchData();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await clientService.getById(id);
      setClient(response);
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error);
      toast.error('Erreur lors du chargement du client');
      navigate('/clients'); // Retourner à la liste si erreur
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await clientService.getOrderHistory(id);
      
      // Gérer les différentes structures de réponse
      let orders = [];
      if (Array.isArray(response)) {
        orders = response;
      } else if (response && Array.isArray(response.results)) {
        orders = response.results;
      } else if (response && response.data && Array.isArray(response.data)) {
        orders = response.data;
      }
      
      setOrderHistory(orders);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setOrderHistory([]); // S'assurer que c'est un tableau vide en cas d'erreur
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'attente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'validee': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'en_cours': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'livree': 'bg-green-500/20 text-green-400 border-green-500/30',
      'annulee': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'attente': return <Clock className="w-4 h-4" />;
      case 'validee': return <CheckCircle className="w-4 h-4" />;
      case 'en_cours': return <Truck className="w-4 h-4" />;
      case 'livree': return <CheckCircle className="w-4 h-4" />;
      case 'annulee': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleEdit = () => {
    navigate(`/clients/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientService.delete(id);
        toast.success('Client supprimé avec succès');
        navigate('/clients');
      } catch (error) {
        toast.error('Erreur lors de la suppression du client');
      }
    }
  };

  const handleBack = () => {
    navigate('/clients');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Client non trouvé</h2>
        <Button onClick={handleBack}>Retourner à la liste</Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Building className="w-8 h-8 mr-3 text-primary-400" />
              Détails du Client
            </h2>
            <p className="text-dark-300">
              Informations complètes du client
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={handleEdit}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Edit3 className="w-4 h-4" />
            <span>Modifier</span>
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            className="flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer</span>
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Informations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Building className="w-6 h-6 mr-3 text-primary-400" />
              Informations de l'entreprise
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Raison sociale
                </label>
                <p className="text-white text-lg font-medium">{client.nom_commercial}</p>
              </div>
              
              {client.nom_commercial && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom commercial
                  </label>
                  <p className="text-white text-lg">{client.nom_commercial}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informations de contact */}
          <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Mail className="w-6 h-6 mr-3 text-secondary-400" />
              Contact
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Personne de contact
                  </label>
                  <p className="text-white">{client.contact}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Téléphone
                  </label>
                  <p className="text-white">{client.telephone}</p>
                </div>
              </div>
              
              {client.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Email
                    </label>
                    <p className="text-white">{client.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-accent-400" />
              Adresse
            </h3>
            
            <p className="text-white leading-relaxed">{client.adresse}</p>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-yellow-400" />
                Notes
              </h3>
              
              <p className="text-white leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Colonne latérale - Statistiques et infos */}
        <div className="space-y-6">
          {/* Statut */}
          <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Statut</h3>
            
            <div className="flex items-center space-x-2">
              {client.is_active ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Actif</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Inactif</span>
                </>
              )}
            </div>
          </div>

          {/* Historique des dépenses */}
          <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-green-400" />
              Historique des dépenses
            </h3>
            
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
              </div>
            ) : !Array.isArray(orderHistory) || orderHistory.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {orderHistory.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-dark-700/50 border border-dark-600 rounded-lg p-4 hover:bg-dark-700/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{order.numero_commande}</span>
                        <span className={`px-2 py-1 rounded-full text-xs border flex items-center space-x-1 ${getStatusColor(order.statut)}`}>
                          {getStatusIcon(order.statut)}
                          <span>{order.statut_display}</span>
                        </span>
                      </div>
                      <span className="text-green-400 font-bold">
                        {formatHTG(order.montant_total)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(order.date_creation).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      {order.date_livraison_effective && (
                        <div className="flex items-center space-x-1">
                          <Truck className="w-4 h-4" />
                          <span>
                            Livré le {new Date(order.date_livraison_effective).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Résumé financier */}
                <div className="mt-4 pt-4 border-t border-dark-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-400">Total des achats</p>
                      <p className="text-green-400 font-bold text-lg">
                        {formatHTG(Array.isArray(orderHistory) ? orderHistory.reduce((sum, order) => sum + parseFloat(order.montant_total), 0) : 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Commandes livrées</p>
                      <p className="text-blue-400 font-bold text-lg">
                        {Array.isArray(orderHistory) ? orderHistory.filter(order => order.statut === 'livree').length : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-400" />
              Informations temporelles
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Date de création
                </label>
                <p className="text-white">
                  {new Date(client.date_creation).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Dernière modification
                </label>
                <p className="text-white">
                  {new Date(client.date_modification).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientDetailPage;
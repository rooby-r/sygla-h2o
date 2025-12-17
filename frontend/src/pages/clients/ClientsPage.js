import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Building, 
  Mail, 
  MapPin,
  Users as UsersIcon,
  Filter,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import Modal from '../../components/ui/Modal.js';
import { clientService } from '../../services/api';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatHTG } from '../../utils/currency';

const ClientsPage = () => {
  const navigate = useNavigate();
  const { onClientDeleted, triggerDashboardUpdate } = useDataUpdate();
  const { theme } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Récupérer les vraies données depuis l'API avec les dépenses incluses
      const response = await clientService.getAll();
      // L'API renvoie un objet avec pagination, les clients sont dans response.results
      const clientsList = response.results || [];
      setClients(clientsList);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    navigate('/clients/create');
  };

  const handleEditClient = (client) => {
    navigate(`/clients/${client.id}/edit`);
  };

  const handleViewClient = (client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ? Toutes ses commandes seront également supprimées.')) {
      try {
        // Récupérer les données du client avant suppression
        const clientToDelete = clients.find(c => c.id === clientId);
        
        await clientService.delete(clientId);
        setClients(clients.filter(c => c.id !== clientId));
        
        // Déclencher la mise à jour du tableau de bord
        onClientDeleted({
          id: clientId,
          name: clientToDelete?.nom_commercial || 'Client supprimé'
        });
        
        toast.success('Client et ses commandes supprimés avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du client');
      }
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.nom_commercial && client.nom_commercial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.contact && client.contact.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && client.is_active) ||
      (filterStatus === 'inactive' && !client.is_active);
    
    return matchesSearch && matchesStatus;
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
            <UsersIcon className="w-8 h-8 mr-3 text-primary-400" />
            Gestion des Clients
          </h2>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
            Gérez vos clients et leurs informations
          </p>
        </div>
        <Button onClick={handleCreateClient} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Nouveau Client</span>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>Total Clients</h3>
              <p className="text-3xl font-bold text-primary-400">{clients.length}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-primary-400/50" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>Clients Actifs</h3>
              <p className="text-3xl font-bold text-green-400">
                {clients.filter(c => c.is_active).length}
              </p>
            </div>
            <Building className="w-8 h-8 text-green-400/50" />
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
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
                      { value: 'all', label: 'Tous les clients', icon: '📋' },
                      { value: 'active', label: 'Clients actifs', icon: '✅' },
                      { value: 'inactive', label: 'Clients inactifs', icon: '❌' }
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
                      className="w-full mt-3 text-center text-sm text-red-400 hover:text-red-300 py-2 border-t border-dark-700"
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

      {/* Clients Table */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Client</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Contact</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Statut</th>
                <th className={`text-left py-3 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Chargement...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className={`border-b ${theme === 'light' ? 'border-slate-100 hover:bg-slate-50' : 'border-dark-800 hover:bg-dark-800/50'}`}>
                    <td className="py-4">
                      <div>
                        <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                          {client.nom_commercial || 'Nom non défini'}
                        </p>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{client.adresse || 'Adresse non définie'}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{client.contact || 'Contact non défini'}</p>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{client.email || 'Email non défini'}</p>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{client.telephone || 'Téléphone non défini'}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.is_active 
                          ? 'bg-green-400/20 text-green-600'
                          : 'bg-red-400/20 text-red-600'
                      }`}>
                        {client.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="p-2 text-blue-500 hover:bg-blue-400/20 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-2 text-yellow-500 hover:bg-yellow-400/20 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-2 text-red-500 hover:bg-red-400/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal for Create/Edit/View */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Détails du Client"
        size="lg"
      >
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-primary-400" />
                  Informations Entreprise
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-dark-300 text-sm">Nom</label>
                    <p className="text-white">{selectedClient?.nom}</p>
                  </div>
                  <div>
                    <label className="text-dark-300 text-sm">Contact principal</label>
                    <p className="text-white">{selectedClient?.contact_principal}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-secondary-400" />
                  Contact
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-dark-300 text-sm">Email</label>
                    <p className="text-white">{selectedClient?.email}</p>
                  </div>
                  <div>
                    <label className="text-dark-300 text-sm">Téléphone</label>
                    <p className="text-white">{selectedClient?.telephone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-accent-400" />
                Adresse
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-dark-300 text-sm">Adresse</label>
                  <p className="text-white">{selectedClient?.adresse}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm">Ville</label>
                  <p className="text-white">{selectedClient?.ville}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm">Code postal</label>
                  <p className="text-white">{selectedClient?.code_postal}</p>
                </div>
              </div>
            </div>

            {selectedClient?.notes && (
              <div>
                <label className="text-dark-300 text-sm">Notes</label>
                <p className="text-white">{selectedClient.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-dark-800 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {formatHTG(selectedClient?.ca_total)}
                </p>
                <p className="text-dark-300 text-sm">CA Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {selectedClient?.statut}
                </p>
                <p className="text-dark-300 text-sm">Statut</p>
              </div>
            </div>
          </div>
      </Modal>
    </motion.div>
  );
};

export default ClientsPage;
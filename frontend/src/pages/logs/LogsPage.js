import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { hasPermission } from '../../config/permissions';
import { logService } from '../../services/api';
import { toast } from 'react-hot-toast';

const LogsPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Types de logs
  const logTypes = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Info' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Succès' },
    warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Avertissement' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Erreur' }
  };

  useEffect(() => {
    fetchLogs();
    
    // Rafraîchir les logs toutes les 10 secondes
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, filterType, searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des logs...');
      
      // Appel API réel
      const response = await logService.getAll();
      console.log('📊 Réponse API:', response);
      
      const logsData = response.results || response;
      console.log('📝 Nombre de logs reçus:', logsData.length);
      
      // Transformer les données pour correspondre au format attendu
      const transformedLogs = logsData.map(log => ({
        id: log.id,
        type: log.type,
        message: log.message,
        user: log.user_email,
        module: log.module_display || log.module,
        timestamp: log.timestamp,
        details: log.details
      }));
      
      setLogs(transformedLogs);
      console.log('✅ Logs chargés avec succès:', transformedLogs.length);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des logs:', error);
      toast.error('Erreur lors du chargement des logs');
      setLoading(false);
    }
  };

  // Fonction de backup si l'API ne fonctionne pas (non utilisée actuellement)
  // eslint-disable-next-line no-unused-vars
  const fetchLogsMock = async () => {
    try {
      setLoading(true);
      // Simulation de logs - Backup si l'API ne fonctionne pas
      const mockLogs = [
        {
          id: 1,
          type: 'success',
          message: 'Nouvelle commande créée #CMD-001',
          user: 'admin@sygla-h2o.com',
          module: 'Commandes',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          details: 'Commande de 50 bidons d\'eau pour Client A'
        },
        {
          id: 2,
          type: 'info',
          message: 'Connexion utilisateur réussie',
          user: 'vendeur@sygla-h2o.com',
          module: 'Authentification',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          details: 'Connexion depuis 192.168.1.100'
        },
        {
          id: 3,
          type: 'warning',
          message: 'Stock faible détecté pour Eau Potable 20L',
          user: 'system',
          module: 'Stock',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          details: 'Quantité restante: 5 unités'
        },
        {
          id: 4,
          type: 'success',
          message: 'Client modifié: Entreprise ABC',
          user: 'vendeur@sygla-h2o.com',
          module: 'Clients',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          details: 'Mise à jour des informations de contact'
        },
        {
          id: 5,
          type: 'error',
          message: 'Échec de validation de commande #CMD-002',
          user: 'admin@sygla-h2o.com',
          module: 'Commandes',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          details: 'Stock insuffisant pour le produit demandé'
        },
        {
          id: 6,
          type: 'success',
          message: 'Livraison complétée #LIV-001',
          user: 'livreur@sygla-h2o.com',
          module: 'Livraisons',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          details: 'Livraison effectuée à Port-au-Prince'
        },
        {
          id: 7,
          type: 'info',
          message: 'Nouveau produit ajouté: Glace 5kg',
          user: 'stock@sygla-h2o.com',
          module: 'Produits',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          details: 'Prix: 150 HTG, Stock initial: 100'
        },
        {
          id: 8,
          type: 'success',
          message: 'Rapport généré et exporté en PDF',
          user: 'admin@sygla-h2o.com',
          module: 'Rapports',
          timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
          details: 'Rapport mensuel des ventes'
        }
      ];

      setLogs(mockLogs);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    // Implémenter l'export des logs
    console.log('Export des logs...');
  };

  const handleClearLogs = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
      try {
        await logService.clearAll();
        setLogs([]);
        toast.success('Tous les logs ont été effacés');
      } catch (error) {
        console.error('Erreur lors de l\'effacement des logs:', error);
        toast.error('Erreur lors de l\'effacement des logs');
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // différence en secondes

    if (diff < 60) return 'Il y a quelques secondes';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} heures`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Journal des Logs</h2>
          <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>
            Historique des activités et événements du système
          </p>
        </div>
        <div className="flex gap-3">
          {hasPermission(user, 'logs', 'export') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="btn btn-secondary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </motion.button>
          )}
          {hasPermission(user, 'logs', 'clear') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearLogs}
              className="btn btn-outline flex items-center text-red-400 border-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Effacer
            </motion.button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
              <input
                type="text"
                placeholder="Rechercher dans les logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'}`}
              />
            </div>
          </div>

          {/* Filtre par type */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : theme === 'light' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              Tous
            </button>
            {Object.entries(logTypes).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center ${
                    filterType === type
                      ? `${config.bg} ${config.color}`
                      : theme === 'light' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Liste des logs */}
      <div className={`rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={`p-12 text-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun log trouvé</p>
          </div>
        ) : (
          <div className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-dark-700'}`}>
            {filteredLogs.map((log) => {
              const config = logTypes[log.type];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/logs/${log.id}`)}
                  className={`p-6 transition-colors cursor-pointer ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-dark-800/30'}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-medium mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{log.message}</h3>
                          <p className={`text-sm mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{log.details}</p>
                          <div className={`flex flex-wrap items-center gap-4 text-xs ${theme === 'light' ? 'text-slate-400' : 'text-dark-500'}`}>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <span>Module: {log.module}</span>
                            <span>Utilisateur: {log.user}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.color} flex-shrink-0`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(logTypes).map(([type, config]) => {
            const count = logs.filter(log => log.type === type).length;
            const Icon = config.icon;
            
            return (
              <div key={type} className={`p-4 rounded-xl border ${config.bg} ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{config.label}</p>
                    <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${config.color} opacity-50`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogsPage;

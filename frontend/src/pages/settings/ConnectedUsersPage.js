import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Clock,
  MapPin,
  RefreshCw,
  Activity,
  LogOut,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

const ConnectedUsersPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConnectedUsers();
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchConnectedUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConnectedUsers = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const response = await api.get('/auth/sessions/connected_users/');

      setConnectedUsers(response.data.users || []);
      
      if (showToast) {
        toast.success('Liste actualisée');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs connectés:', error);
      if (error.response?.status === 403) {
        toast.error('Accès réservé aux administrateurs');
      } else {
        toast.error('Erreur lors du chargement des utilisateurs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchConnectedUsers(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'vendeur': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'stock': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'livreur': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDeviceIcon = (deviceInfo) => {
    if (deviceInfo?.includes('Mobile')) return Smartphone;
    if (deviceInfo?.includes('Tablette')) return Tablet;
    return Monitor;
  };

  const formatDuration = (loginTime) => {
    const now = new Date();
    const login = new Date(loginTime);
    const diff = Math.floor((now - login) / 1000); // en secondes

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    return `${Math.floor(diff / 86400)}j`;
  };

  const getStatusIndicator = (session) => {
    if (!session) return null;
    
    const lastActivity = new Date(session.last_activity);
    const now = new Date();
    const minutesAgo = Math.floor((now - lastActivity) / 60000);

    if (minutesAgo < 2) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">En ligne</span>
        </div>
      );
    } else if (minutesAgo < 5) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <span className="text-xs text-yellow-400">Inactif ({minutesAgo}m)</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span className="text-xs text-gray-400">Déconnecté</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Bouton Retour */}
      <button
        onClick={() => navigate('/settings')}
        className={`flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-slate-600 hover:text-slate-800' : 'text-dark-400 hover:text-white'}`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Retour aux paramètres</span>
      </button>

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold flex items-center space-x-3 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
            <Users className="w-8 h-8 text-blue-400" />
            <span>Utilisateurs Connectés</span>
          </h1>
          <p className={`mt-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
            {connectedUsers.length} utilisateur(s) actif(s) sur le système
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </motion.button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Total en ligne</p>
              <p className={`text-3xl font-bold mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                {connectedUsers.length}
              </p>
            </div>
            <Activity className="w-12 h-12 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Administrateurs</p>
              <p className={`text-3xl font-bold mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                {connectedUsers.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Vendeurs</p>
              <p className={`text-3xl font-bold mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                {connectedUsers.filter(u => u.role === 'vendeur').length}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Autres</p>
              <p className={`text-3xl font-bold mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                {connectedUsers.filter(u => u.role !== 'admin' && u.role !== 'vendeur').length}
              </p>
            </div>
            <Users className="w-12 h-12 text-orange-400" />
          </div>
        </motion.div>
      </div>

      {/* Liste des utilisateurs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
      >
        <div className={`p-6 border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
          <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Sessions Actives</h2>
        </div>

        {connectedUsers.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
            <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Aucun utilisateur connecté</p>
          </div>
        ) : (
          <div className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-dark-700'}`}>
            {connectedUsers.map((user, index) => {
              const DeviceIcon = getDeviceIcon(user.session?.device_info);
              
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-dark-700/50'}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Info utilisateur */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            {user.full_name || user.username}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                            {user.role_display}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{user.email}</p>
                      </div>
                    </div>

                    {/* Info session */}
                    <div className="flex items-center space-x-8">
                      {/* Statut */}
                      <div className="text-right">
                        {getStatusIndicator(user.session)}
                      </div>

                      {/* Appareil */}
                      <div className={`flex items-center space-x-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                        <DeviceIcon className="w-5 h-5" />
                        <span className="text-sm">
                          {user.session?.device_info || 'Navigateur Web'}
                        </span>
                      </div>

                      {/* IP */}
                      {user.session?.ip_address && (
                        <div className={`flex items-center space-x-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                          <MapPin className="w-5 h-5" />
                          <span className="text-sm font-mono">
                            {user.session.ip_address}
                          </span>
                        </div>
                      )}

                      {/* Durée */}
                      <div className={`flex items-center space-x-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                        <Clock className="w-5 h-5" />
                        <span className="text-sm">
                          {formatDuration(user.session?.login_time)}
                        </span>
                      </div>

                      {/* Sessions multiples */}
                      {user.total_active_sessions > 1 && (
                        <div className="flex items-center space-x-2 text-yellow-400">
                          <Monitor className="w-5 h-5" />
                          <span className="text-sm">
                            {user.total_active_sessions} sessions
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations détaillées */}
                  <div className={`mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                    <div>
                      <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Connexion</p>
                      <p className={`mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        {new Date(user.session?.login_time).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Dernière activité</p>
                      <p className={`mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        {new Date(user.session?.last_activity).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Durée de session</p>
                      <p className={`mt-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        {formatDuration(user.session?.login_time)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ConnectedUsersPage;

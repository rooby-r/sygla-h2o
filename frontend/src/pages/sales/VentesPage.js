import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
} from 'lucide-react';
import venteService from '../../services/venteService';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

const VentesPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [stats, setStats] = useState(null);
  
  // Les non-admins voient uniquement les stats du jour
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchVentes();
    fetchStatistiques();
  }, [filterStatut, isAdmin]);

  const fetchVentes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatut) params.statut_paiement = filterStatut;
      
      const data = await venteService.getVentes(params);
      setVentes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
      toast.error('Erreur lors du chargement des ventes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistiques = async () => {
    try {
      // Les non-admins voient uniquement les stats du jour
      const params = isAdmin ? {} : { periode: 'today' };
      const data = await venteService.getVentesStatistiques(params);
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      try {
        await venteService.deleteVente(id);
        toast.success('Vente supprimée avec succès');
        fetchVentes();
        fetchStatistiques();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filteredVentes = ventes.filter((vente) => {
    const matchSearch =
      vente.numero_vente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vente.client_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const getStatutBadge = (statut) => {
    const badges = {
      paye: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
        text: '✓ Payé - Prioritaire',
      },
      paye_partiel: {
        color: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
        icon: Clock,
        text: 'Payé Partiellement',
      },
      impaye: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
        text: 'Impayé',
      },
    };

    const badge = badges[statut] || badges.impaye;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        <span>{badge.text}</span>
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold text-gradient mb-2 ${theme === 'light' ? 'text-slate-900' : ''}`}>Ventes 🎯</h1>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-400'}>Transactions prioritaires - 100% payées</p>
        </div>
        <Button
          onClick={() => navigate('/sales/create')}
          variant="primary"
          leftIcon={<Plus className="w-5 h-5" />}
          className="mt-4 md:mt-0"
        >
          Nouvelle Vente
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>
                  {isAdmin ? 'Total Ventes' : 'Ventes du Jour'}
                </p>
                <p className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stats.total_ventes}</p>
              </div>
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>
                  {isAdmin ? "Chiffre d'Affaires Total" : "CA du Jour"}
                </p>
                <p className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {formatCurrency(stats.chiffre_affaires_encaisse)}
                </p>
                {stats.montant_paye_commandes > 0 && (
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    + {formatCurrency(stats.montant_paye_commandes)} HTG (commandes)
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>
                  {isAdmin ? 'Montant Payé' : 'Payé Aujourd\'hui'}
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(stats.montant_paye_ventes)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>
                  {isAdmin ? 'Montant Restant' : 'Restant du Jour'}
                </p>
                <p className="text-2xl font-bold text-warning-400">
                  {formatCurrency(stats.montant_restant_commandes)}
                </p>
                {stats.montant_restant_commandes > 0 && (
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    {formatCurrency(stats.montant_restant_commandes)} HTG (commandes)
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-warning-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning-500" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filtres et Recherche */}
      <div className={`card p-6 mb-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
            <input
              type="text"
              placeholder="Rechercher par numéro ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input pl-10 w-full ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
            />
          </div>

          <div className="relative">
            <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className={`input pl-10 w-full ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
            >
              <option value="">Tous les statuts</option>
              <option value="paye">Payé</option>
              <option value="paye_partiel">Payé Partiellement</option>
              <option value="impaye">Impayé</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <Button
              onClick={() => {
                setSearchTerm('');
                setFilterStatut('');
              }}
              variant="secondary"
              size="sm"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des ventes */}
      <div className={`card overflow-hidden ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredVentes.length === 0 ? (
          <div className="text-center py-12">
            <p className={`mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Aucune vente trouvée</p>
            <Button
              onClick={() => navigate('/sales/create')}
              variant="primary"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Créer une vente
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                  <th className={`text-left p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Numéro</th>
                  <th className={`text-left p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Client</th>
                  <th className={`text-left p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Vendeur</th>
                  <th className={`text-left p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Date</th>
                  <th className={`text-right p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Montant Total</th>
                  <th className={`text-right p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Montant Payé</th>
                  <th className={`text-center p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Statut</th>
                  <th className={`text-center p-4 font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVentes.map((vente, index) => (
                  <motion.tr
                    key={vente.id}
                    className={`border-b transition-colors ${
                      theme === 'light' 
                        ? `border-slate-100 hover:bg-slate-50 ${vente.statut_paiement === 'paye' ? 'bg-green-50' : ''}`
                        : `border-dark-700/50 hover:bg-dark-800/50 ${vente.statut_paiement === 'paye' ? 'bg-green-500/5' : ''}`
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {vente.statut_paiement === 'paye' && (
                          <span className="text-green-400 font-bold">🎯</span>
                        )}
                        <span className="font-mono text-primary-400">{vente.numero_vente}</span>
                      </div>
                    </td>
                    <td className={`p-4 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>{vente.client_nom}</td>
                    <td className={`p-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>{vente.vendeur_nom}</td>
                    <td className={`p-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                      {format(new Date(vente.date_vente), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className={`p-4 text-right font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      {formatCurrency(vente.montant_total)}
                    </td>
                    <td className="p-4 text-right text-green-400">
                      {formatCurrency(vente.montant_paye)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatutBadge(vente.statut_paiement)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigate(`/sales/${vente.id}`)}
                          className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-dark-700'}`}
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-primary-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(vente.id)}
                          className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-dark-700'}`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VentesPage;

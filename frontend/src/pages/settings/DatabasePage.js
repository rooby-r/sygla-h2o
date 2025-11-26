import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Upload, Trash2, AlertTriangle, HardDrive, FileText, Users, Package, ShoppingCart, Truck, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DatabasePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [backups, setBackups] = useState([]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, backupsRes] = await Promise.all([
        api.get('/auth/database/stats/'),
        api.get('/auth/database/backups/')
      ]);
      setStats(statsRes.data);
      setBackups(backupsRes.data.backups || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!window.confirm('Créer une nouvelle sauvegarde de la base de données ?')) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/auth/database/backup/');
      toast.success(`Sauvegarde créée: ${response.data.filename}`);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la création de la sauvegarde');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(
      `⚠️ ATTENTION ⚠️\n\nCette opération va remplacer TOUTES les données actuelles par celles de la sauvegarde "${filename}".\n\nCette action est IRRÉVERSIBLE.\n\nVoulez-vous vraiment continuer ?`
    )) {
      return;
    }

    try {
      setRestoring(true);
      await api.post('/auth/database/restore/', { filename });
      toast.success('Base de données restaurée avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration');
    } finally {
      setRestoring(false);
    }
  };

  const handleDownloadBackup = (filename) => {
    // Créer un lien de téléchargement avec authentification
    const token = localStorage.getItem('access_token');
    const url = `${api.defaults.baseURL}/auth/database/download/${filename}/`;
    
    // Utiliser fetch pour gérer l'authentification
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Erreur de téléchargement');
      return response.blob();
    })
    .then(blob => {
      // Créer un lien de téléchargement temporaire
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Téléchargement de ${filename} réussi`);
    })
    .catch(error => {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const dataStats = [
    { icon: Users, label: 'Utilisateurs', value: stats?.users || 0, color: 'blue' },
    { icon: Users, label: 'Clients', value: stats?.clients || 0, color: 'green' },
    { icon: Package, label: 'Produits', value: stats?.products || 0, color: 'purple' },
    { icon: ShoppingCart, label: 'Commandes', value: stats?.orders || 0, color: 'yellow' },
    { icon: Truck, label: 'Livraisons', value: stats?.deliveries || 0, color: 'orange' },
    { icon: FileText, label: 'Logs', value: stats?.logs || 0, color: 'cyan' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Base de Données</h2>
        <p className="text-dark-300">
          Gestion, sauvegarde et restauration de la base de données
        </p>
      </div>

      {/* Alerte de sécurité */}
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-300">
          <p className="font-medium mb-1">⚠️ Zone sensible - Admin uniquement</p>
          <p>Les opérations de sauvegarde et restauration affectent l'ensemble du système. Utilisez avec précaution.</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taille de la base */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <HardDrive className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Taille de la Base</h3>
              <p className="text-sm text-dark-400">Espace disque utilisé</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-primary-400">
            {stats?.database_size_mb || 0} MB
          </div>
        </motion.div>

        {/* Total enregistrements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Database className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Total Enregistrements</h3>
              <p className="text-sm text-dark-400">Nombre total d'entrées</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {stats?.total_records?.toLocaleString() || 0}
          </div>
        </motion.div>
      </div>

      {/* Répartition des données */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Répartition des Données</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {dataStats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-500/10 text-blue-400',
              green: 'bg-green-500/10 text-green-400',
              purple: 'bg-purple-500/10 text-purple-400',
              yellow: 'bg-yellow-500/10 text-yellow-400',
              orange: 'bg-orange-500/10 text-orange-400',
              cyan: 'bg-cyan-500/10 text-cyan-400'
            };

            return (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-lg ${colorClasses[stat.color]} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-dark-400">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions de sauvegarde */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Download className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Sauvegardes</h3>
              <p className="text-sm text-dark-400">Gérer les sauvegardes de la base</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateBackup}
            disabled={creating}
            className="btn btn-primary flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Création...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Créer une sauvegarde
              </>
            )}
          </motion.button>
        </div>

        {/* Liste des sauvegardes */}
        {backups.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune sauvegarde disponible</p>
            <p className="text-sm mt-1">Créez votre première sauvegarde ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup, index) => (
              <motion.div
                key={backup.timestamp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-5 h-5 text-primary-400" />
                      <p className="font-medium text-white">Sauvegarde du {backup.created_formatted}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                      {backup.json_file && (
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-blue-400" />
                          <span>{backup.json_size_mb} MB (JSON)</span>
                          <button
                            onClick={() => handleDownloadBackup(backup.json_file)}
                            className="text-primary-400 hover:text-primary-300 transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {backup.excel_file && (
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-green-400" />
                          <span>{backup.excel_size_mb} MB (Excel)</span>
                          <button
                            onClick={() => handleDownloadBackup(backup.excel_file)}
                            className="text-green-400 hover:text-green-300 transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="text-dark-500">•</div>
                      <div>Total: {backup.total_size_mb} MB</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.json_file && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestoreBackup(backup.json_file)}
                        disabled={restoring}
                        className="btn btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Restaurer
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {stats?.last_backup && (
          <div className="mt-6 pt-4 border-t border-dark-700">
            <p className="text-sm text-dark-400">
              <span className="font-medium">Dernière sauvegarde:</span> {stats.last_backup} 
              {stats.last_backup_size_mb && ` (${stats.last_backup_size_mb} MB)`}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DatabasePage;

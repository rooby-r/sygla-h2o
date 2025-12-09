import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, DollarSign, Users, Package, MapPin, Calendar, Clock, FileText, CheckCircle, Truck, Loader } from 'lucide-react';
import { formatHTG } from '../../utils/currency';
import notificationService from '../../services/notificationService';
import { useTheme } from '../../contexts/ThemeContext';

const NotificationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Chargement détails notification:', id);
      
      // Récupérer les détails complets depuis le backend
      const data = await notificationService.getNotificationDetails(id);
      console.log('✅ Détails reçus:', data);
      
      setDetails(data);
    } catch (err) {
      console.error('❌ Erreur chargement détails:', err);
      setError('Impossible de charger les détails de la notification');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      'en_attente': { label: 'En Attente', color: 'bg-yellow-500/20 text-yellow-400' },
      'validee': { label: 'Validée', color: 'bg-blue-500/20 text-blue-400' },
      'en_preparation': { label: 'En Préparation', color: 'bg-purple-500/20 text-purple-400' },
      'en_livraison': { label: 'En Livraison', color: 'bg-orange-500/20 text-orange-400' },
      'livree': { label: 'Livrée', color: 'bg-green-500/20 text-green-400' },
      'annulee': { label: 'Annulée', color: 'bg-red-500/20 text-red-400' },
      'completee': { label: 'Complétée', color: 'bg-green-500/20 text-green-400' },
    };

    const config = statusConfig[statut] || { label: statut, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (statut) => {
    const statusConfig = {
      'non_paye': { label: 'Non Payé', color: 'bg-red-500/20 text-red-400' },
      'partiellement_paye': { label: 'Partiellement Payé', color: 'bg-yellow-500/20 text-yellow-400' },
      'paye': { label: 'Payé', color: 'bg-green-500/20 text-green-400' },
    };

    const config = statusConfig[statut] || { label: statut, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderCommandeDetails = () => {
    if (!details || details.type !== 'commande') return null;

    const commande = details.data;

    return (
      <div className="space-y-6">
        {/* En-tête Commande */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{commande.numero_commande}</h3>
                <p className="text-sm text-dark-400">Commande</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              {getStatusBadge(commande.statut)}
              {getPaymentStatusBadge(commande.statut_paiement)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-dark-300">
              <Calendar className="w-4 h-4" />
              <span>Date: {formatDate(commande.created_at)}</span>
            </div>
            {commande.date_livraison_prevue && (
              <div className="flex items-center space-x-2 text-dark-300">
                <Clock className="w-4 h-4" />
                <span>Livraison prévue: {formatDate(commande.date_livraison_prevue)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Client */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h4 className="text-white font-semibold">Client</h4>
          </div>
          <div className="space-y-2 text-sm text-dark-300">
            <p><span className="text-dark-400">Nom:</span> <span className="text-white">{commande.client_nom || 'N/A'}</span></p>
            {commande.client_telephone && (
              <p><span className="text-dark-400">Téléphone:</span> <span className="text-white">{commande.client_telephone}</span></p>
            )}
            {commande.client_adresse && (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-dark-400" />
                <span className="text-white">{commande.client_adresse}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Produits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-5 h-5 text-orange-400" />
            <h4 className="text-white font-semibold">Produits</h4>
          </div>
          <div className="space-y-2">
            {commande.items && commande.items.length > 0 ? (
              commande.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-dark-750 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.produit_nom}</p>
                    <p className="text-sm text-dark-400">
                      Quantité: {item.quantite} × {formatHTG(item.prix_unitaire)}
                    </p>
                  </div>
                  <p className="text-primary-400 font-semibold">
                    {formatHTG(item.prix_total)}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-dark-400 text-sm text-center py-4">Aucun produit</p>
            )}
          </div>
        </motion.div>

        {/* Montants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h4 className="text-white font-semibold">Paiement</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Sous-total:</span>
              <span className="text-white font-medium">{formatHTG(commande.montant_total)}</span>
            </div>
            {commande.frais_livraison > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Frais de livraison:</span>
                <span className="text-white font-medium">{formatHTG(commande.frais_livraison)}</span>
              </div>
            )}
            <div className="flex justify-between text-base border-t border-dark-700 pt-3">
              <span className="text-white font-semibold">Total:</span>
              <span className="text-white font-bold text-lg">{formatHTG(commande.montant_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Payé:</span>
              <span className="text-green-400 font-semibold">{formatHTG(commande.montant_paye)}</span>
            </div>
            {commande.montant_restant > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Restant:</span>
                <span className="text-red-400 font-semibold">{formatHTG(commande.montant_restant)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Livraison */}
        {commande.type_livraison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Truck className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-semibold">Livraison</h4>
            </div>
            <div className="space-y-2 text-sm text-dark-300">
              <p>
                <span className="text-dark-400">Type:</span>{' '}
                <span className="text-white">
                  {commande.type_livraison === 'livraison_domicile' ? 'Livraison à domicile' : 'Retrait en magasin'}
                </span>
              </p>
              {commande.livreur_nom && (
                <p><span className="text-dark-400">Livreur:</span> <span className="text-white">{commande.livreur_nom}</span></p>
              )}
            </div>
          </motion.div>
        )}

        {/* Notes */}
        {commande.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
          >
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-yellow-400" />
              <h4 className="text-white font-semibold">Notes</h4>
            </div>
            <p className="text-sm text-dark-300">{commande.notes}</p>
          </motion.div>
        )}
      </div>
    );
  };

  const renderVenteDetails = () => {
    if (!details || details.type !== 'vente') return null;

    const vente = details.data;

    return (
      <div className="space-y-6">
        {/* En-tête Vente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{vente.numero_vente}</h3>
                <p className="text-sm text-dark-400">Vente</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Payée</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-dark-300">
              <Calendar className="w-4 h-4" />
              <span>Date: {formatDate(vente.created_at)}</span>
            </div>
            {vente.date_livraison_prevue && (
              <div className="flex items-center space-x-2 text-dark-300">
                <Clock className="w-4 h-4" />
                <span>Livraison prévue: {formatDate(vente.date_livraison_prevue)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Client */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h4 className="text-white font-semibold">Client</h4>
          </div>
          <div className="space-y-2 text-sm text-dark-300">
            <p><span className="text-dark-400">Nom:</span> <span className="text-white">{vente.client_nom || 'N/A'}</span></p>
            {vente.client_telephone && (
              <p><span className="text-dark-400">Téléphone:</span> <span className="text-white">{vente.client_telephone}</span></p>
            )}
            {vente.client_adresse && (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-dark-400" />
                <span className="text-white">{vente.client_adresse}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Produits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-5 h-5 text-orange-400" />
            <h4 className="text-white font-semibold">Produits</h4>
          </div>
          <div className="space-y-2">
            {vente.lignes && vente.lignes.length > 0 ? (
              vente.lignes.map((ligne, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-dark-750 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{ligne.produit_nom}</p>
                    <p className="text-sm text-dark-400">
                      Quantité: {ligne.quantite} × {formatHTG(ligne.prix_unitaire)}
                    </p>
                  </div>
                  <p className="text-primary-400 font-semibold">
                    {formatHTG(ligne.prix_total)}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-dark-400 text-sm text-center py-4">Aucun produit</p>
            )}
          </div>
        </motion.div>

        {/* Montants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h4 className="text-white font-semibold">Paiement</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Sous-total:</span>
              <span className="text-white font-medium">{formatHTG(vente.montant_total)}</span>
            </div>
            {vente.frais_livraison > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Frais de livraison:</span>
                <span className="text-white font-medium">{formatHTG(vente.frais_livraison)}</span>
              </div>
            )}
            <div className="flex justify-between text-base border-t border-dark-700 pt-3">
              <span className="text-white font-semibold">Total:</span>
              <span className="text-white font-bold text-lg">{formatHTG(vente.montant_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Payé:</span>
              <span className="text-green-400 font-bold">{formatHTG(vente.montant_paye)}</span>
            </div>
          </div>
        </motion.div>

        {/* Livraison */}
        {vente.type_livraison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Truck className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-semibold">Livraison</h4>
            </div>
            <div className="space-y-2 text-sm text-dark-300">
              <p>
                <span className="text-dark-400">Type:</span>{' '}
                <span className="text-white">
                  {vente.type_livraison === 'livraison_domicile' ? 'Livraison à domicile' : 'Retrait en magasin'}
                </span>
              </p>
              {vente.vendeur_nom && (
                <p><span className="text-dark-400">Vendeur:</span> <span className="text-white">{vente.vendeur_nom}</span></p>
              )}
            </div>
          </motion.div>
        )}

        {/* Méthode de paiement */}
        {vente.methode_paiement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
          >
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h4 className="text-white font-semibold">Méthode de paiement</h4>
            </div>
            <p className="text-sm text-white capitalize">{vente.methode_paiement.replace('_', ' ')}</p>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-dark-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Détails de la notification</h1>
              {details?.notification && (
                <p className="text-dark-400 mt-1">{details.notification.title}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="flex flex-col items-center space-y-4">
              <Loader className="w-12 h-12 text-primary-500 animate-spin" />
              <p className="text-dark-400">Chargement des détails...</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-xl p-12 border text-center ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 font-medium text-lg mb-2">Erreur</p>
            <p className="text-dark-400 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Retour
            </button>
          </motion.div>
        ) : (
          <>
            {renderCommandeDetails()}
            {renderVenteDetails()}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDetailPage;

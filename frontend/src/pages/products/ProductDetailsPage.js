import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, Box, TrendingUp, Calendar, AlertTriangle, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { productService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useTheme } from '../../contexts/ThemeContext';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mouvements, setMouvements] = useState([]);
  const [loadingMouvements, setLoadingMouvements] = useState(true);

  useEffect(() => {
    fetchProductDetails();
    fetchMouvements();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const data = await productService.getById(id);
      setProduct(data);
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMouvements = async () => {
    try {
      setLoadingMouvements(true);
      const data = await productService.getStockMovements(id);
      // Prendre les derniers mouvements (les plus récents d'abord)
      setMouvements(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error('Erreur lors du chargement des mouvements:', error);
      setMouvements([]);
    } finally {
      setLoadingMouvements(false);
    }
  };

  const getStockStatus = () => {
    if (!product) return { label: '', color: '', icon: AlertTriangle };
    
    const stockActuel = product.stock_actuel;
    const stockMin = product.stock_minimal;

    if (stockActuel <= 0) {
      return { 
        label: 'Rupture de Stock', 
        color: 'text-red-400 bg-red-400/20',
        icon: AlertTriangle 
      };
    } else if (stockActuel <= stockMin) {
      return { 
        label: 'Stock Critique', 
        color: 'text-red-400 bg-red-400/20',
        icon: AlertTriangle 
      };
    } else if (stockActuel <= stockMin * 2) {
      return { 
        label: 'Stock Bas', 
        color: 'text-orange-400 bg-orange-400/20',
        icon: TrendingUp 
      };
    } else {
      return { 
        label: 'Stock Normal', 
        color: 'text-blue-400 bg-blue-400/20',
        icon: Box 
      };
    }
  };

  const getStockPercentage = () => {
    if (!product) return 0;
    
    // Si stock_initial est défini, l'utiliser comme référence
    if (product.stock_initial > 0) {
      const percentage = (product.stock_actuel / product.stock_initial) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    }
    
    // Sinon, utiliser 3x le stock minimal comme référence (ancien comportement)
    if (product.stock_minimal > 0) {
      const referenceMax = product.stock_minimal * 3;
      const percentage = (product.stock_actuel / referenceMax) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    }
    
    return 50; // Valeur par défaut
  };

  const getProgressBarColor = () => {
    const percentage = getStockPercentage();
    if (percentage < 20) return 'bg-red-400';
    if (percentage < 50) return 'bg-orange-400';
    if (percentage < 80) return 'bg-blue-400';
    return 'bg-green-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Produit non trouvé</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;
  const ProductIcon = product.type_produit === 'eau' ? Package : Box;

  return (
    <div className={`min-h-screen p-6 ${theme === 'light' ? 'bg-slate-50' : 'bg-dark-950'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/products')}
            className={`flex items-center mb-4 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-dark-300 hover:text-white'}`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la liste des produits
          </button>
          <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Détails du Produit</h1>
        </div>

        {/* Main Content */}
        <div className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg' : 'bg-dark-900 border-dark-800'}`}>
          {/* Product Header */}
          <div className={`p-8 border-b ${theme === 'light' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-slate-200' : 'bg-gradient-to-r from-primary-600/20 to-primary-800/20 border-dark-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-xl ${
                  product.type_produit === 'eau' 
                    ? 'bg-blue-400/20' 
                    : 'bg-cyan-400/20'
                }`}>
                  <ProductIcon className={`w-12 h-12 ${
                    product.type_produit === 'eau' 
                      ? 'text-blue-400' 
                      : 'text-cyan-400'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{product.nom}</h2>
                  <p className={`mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>{product.description}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${stockStatus.color} flex items-center`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {stockStatus.label}
              </span>
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Informations Produit */}
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <Package className="w-5 h-5 mr-2 text-primary-400" />
                  Informations Produit
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                    <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Code Produit</label>
                    <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{product.code_produit}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                    <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Type</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      product.type_produit === 'eau' 
                        ? 'bg-blue-400/20 text-blue-400'
                        : 'bg-cyan-400/20 text-cyan-400'
                    }`}>
                      {product.type_produit?.charAt(0).toUpperCase() + product.type_produit?.slice(1)}
                    </span>
                  </div>

                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                    <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Unité de Mesure</label>
                    <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{product.unite_mesure}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                    <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Prix Unitaire</label>
                    <p className="text-green-400 font-bold text-2xl flex items-center">
                      <DollarSign className="w-6 h-6 mr-1" />
                      {formatHTG(parseFloat(product.prix_unitaire || 0))}
                      <span className={`text-sm ml-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>/ {product.unite_mesure}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Box className="w-5 h-5 mr-2 text-primary-400" />
                  Gestion du Stock
                </h3>

                <div className="space-y-4">
                  {/* Stock Actuel */}
                  <div className={`p-6 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                    <label className={`text-sm block mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Stock Actuel</label>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`font-bold text-4xl ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        {product.stock_actuel}
                      </p>
                      <span className={`text-lg ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{product.unite_mesure}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className={`w-full rounded-full h-3 mb-2 ${theme === 'light' ? 'bg-slate-200' : 'bg-dark-700'}`}>
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                        style={{ width: `${getStockPercentage()}%` }}
                      />
                    </div>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                      Niveau de stock : {getStockPercentage().toFixed(1)}%
                    </p>
                  </div>

                  {/* Stock Minimum */}
                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                    <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Stock Minimum</label>
                    <p className="text-orange-400 font-bold text-2xl">
                      {product.stock_minimal}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{product.unite_mesure}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des Mouvements */}
            <div className={`border-t pt-6 mb-6 ${theme === 'light' ? 'border-slate-200' : 'border-dark-800'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <History className="w-5 h-5 mr-2 text-primary-400" />
                Historique des Mouvements de Stock
              </h3>
              
              {loadingMouvements ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : mouvements.length === 0 ? (
                <div className={`p-6 rounded-lg text-center ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                  <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Aucun mouvement de stock enregistré</p>
                </div>
              ) : (
                <div className={`rounded-lg overflow-hidden ${theme === 'light' ? 'bg-white border border-slate-200 shadow-sm' : 'bg-dark-800'}`}>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full">
                      <thead className={`sticky top-0 ${theme === 'light' ? 'bg-slate-100' : 'bg-dark-700'}`}>
                        <tr>
                          <th className={`text-left text-sm font-medium px-4 py-3 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>Type</th>
                          <th className={`text-left text-sm font-medium px-4 py-3 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>Quantité</th>
                          <th className={`text-left text-sm font-medium px-4 py-3 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>Stock</th>
                          <th className={`text-left text-sm font-medium px-4 py-3 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>Motif</th>
                          <th className={`text-left text-sm font-medium px-4 py-3 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>Date</th>
                          <th className={`text-left text-sm font-medium px-4 py-3 ${theme === 'light' ? 'text-slate-600' : 'text-dark-400'}`}>Par</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-dark-700'}`}>
                        {mouvements.slice(0, 15).map((mouvement, index) => {
                          // Déterminer si c'est une entrée ou sortie basé sur stock_avant et stock_apres
                          const isEntree = mouvement.type_mouvement === 'entree' || 
                            (mouvement.stock_apres !== undefined && mouvement.stock_avant !== undefined && mouvement.stock_apres > mouvement.stock_avant);
                          const isSortie = mouvement.type_mouvement === 'sortie' || mouvement.type_mouvement === 'perte' ||
                            (mouvement.stock_apres !== undefined && mouvement.stock_avant !== undefined && mouvement.stock_apres < mouvement.stock_avant);
                          
                          // Labels pour les types
                          const typeLabels = {
                            'entree': 'Entrée',
                            'sortie': 'Sortie',
                            'ajustement': 'Ajustement',
                            'perte': 'Perte'
                          };
                          
                          // Couleurs pour les types
                          const getTypeColor = () => {
                            if (mouvement.type_mouvement === 'entree' || isEntree) return 'text-green-400';
                            if (mouvement.type_mouvement === 'perte') return 'text-orange-400';
                            if (mouvement.type_mouvement === 'ajustement') {
                              return isEntree ? 'text-green-400' : (isSortie ? 'text-red-400' : 'text-blue-400');
                            }
                            return 'text-red-400';
                          };
                          
                          return (
                            <tr key={mouvement.id || index} className={`transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-dark-700/50'}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  {isEntree ? (
                                    <ArrowUpCircle className="w-5 h-5 text-green-400 mr-2" />
                                  ) : isSortie ? (
                                    <ArrowDownCircle className="w-5 h-5 text-red-400 mr-2" />
                                  ) : (
                                    <Box className="w-5 h-5 text-blue-400 mr-2" />
                                  )}
                                  <span className={`font-medium ${getTypeColor()}`}>
                                    {typeLabels[mouvement.type_mouvement] || mouvement.type_mouvement}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-bold ${getTypeColor()}`}>
                                  {isEntree ? '+' : isSortie ? '-' : ''}{mouvement.quantite}
                                </span>
                                <span className={`text-sm ml-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{product?.unite_mesure}</span>
                              </td>
                              <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                                {mouvement.stock_avant !== undefined && mouvement.stock_apres !== undefined ? (
                                  <span>
                                    {mouvement.stock_avant} → <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{mouvement.stock_apres}</span>
                                  </span>
                                ) : '-'}
                              </td>
                              <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {mouvement.motif || mouvement.raison || '-'}
                              </td>
                              <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                                {(() => {
                                  const dateStr = mouvement.date_creation;
                                  if (!dateStr) return '-';
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return '-';
                                  return date.toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                })()}
                              </td>
                              <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                                {mouvement.utilisateur_nom || mouvement.utilisateur?.username || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {mouvements.length > 15 && (
                    <div className={`px-4 py-2 text-center ${theme === 'light' ? 'bg-slate-100' : 'bg-dark-700'}`}>
                      <span className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                        Affichage des 15 derniers mouvements sur {mouvements.length} au total
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className={`border-t pt-6 ${theme === 'light' ? 'border-slate-200' : 'border-dark-800'}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                Informations Supplémentaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                  <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Date de Création</label>
                  <p className={theme === 'light' ? 'text-slate-800' : 'text-white'}>
                    {new Date(product.date_creation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-slate-50 border border-slate-200' : 'bg-dark-800'}`}>
                  <label className={`text-sm block mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Dernière Modification</label>
                  <p className={theme === 'light' ? 'text-slate-800' : 'text-white'}>
                    {new Date(product.date_modification).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`border-t pt-6 mt-6 ${theme === 'light' ? 'border-slate-200' : 'border-dark-800'}`}>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/products')}
                  className={`px-6 py-3 rounded-lg transition-colors ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-dark-800 hover:bg-dark-700 text-white'}`}
                >
                  Retour
                </button>
                <button
                  onClick={() => navigate(`/products/edit/${product.id}`)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Modifier le Produit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;

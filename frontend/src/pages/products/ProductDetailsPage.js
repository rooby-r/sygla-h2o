import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, Box, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { productService } from '../../services/api';
import { formatHTG } from '../../utils/currency';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
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
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center text-dark-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la liste des produits
          </button>
          <h1 className="text-3xl font-bold text-white">Détails du Produit</h1>
        </div>

        {/* Main Content */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 p-8 border-b border-dark-800">
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
                  <h2 className="text-2xl font-bold text-white">{product.nom}</h2>
                  <p className="text-dark-300 mt-1">{product.description}</p>
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
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Package className="w-5 h-5 mr-2 text-primary-400" />
                  Informations Produit
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-dark-800 p-4 rounded-lg">
                    <label className="text-dark-400 text-sm block mb-1">Code Produit</label>
                    <p className="text-white font-medium">{product.code_produit}</p>
                  </div>

                  <div className="bg-dark-800 p-4 rounded-lg">
                    <label className="text-dark-400 text-sm block mb-1">Type</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      product.type_produit === 'eau' 
                        ? 'bg-blue-400/20 text-blue-400'
                        : 'bg-cyan-400/20 text-cyan-400'
                    }`}>
                      {product.type_produit?.charAt(0).toUpperCase() + product.type_produit?.slice(1)}
                    </span>
                  </div>

                  <div className="bg-dark-800 p-4 rounded-lg">
                    <label className="text-dark-400 text-sm block mb-1">Unité de Mesure</label>
                    <p className="text-white font-medium">{product.unite_mesure}</p>
                  </div>

                  <div className="bg-dark-800 p-4 rounded-lg">
                    <label className="text-dark-400 text-sm block mb-1">Prix Unitaire</label>
                    <p className="text-green-400 font-bold text-2xl flex items-center">
                      <DollarSign className="w-6 h-6 mr-1" />
                      {formatHTG(parseFloat(product.prix_unitaire || 0))}
                      <span className="text-dark-400 text-sm ml-2">/ {product.unite_mesure}</span>
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
                  <div className="bg-dark-800 p-6 rounded-lg">
                    <label className="text-dark-400 text-sm block mb-2">Stock Actuel</label>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold text-4xl">
                        {product.stock_actuel}
                      </p>
                      <span className="text-dark-400 text-lg">{product.unite_mesure}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-dark-700 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                        style={{ width: `${getStockPercentage()}%` }}
                      />
                    </div>
                    <p className="text-dark-400 text-xs">
                      Niveau de stock : {getStockPercentage().toFixed(1)}%
                    </p>
                  </div>

                  {/* Stock Minimum */}
                  <div className="bg-dark-800 p-4 rounded-lg">
                    <label className="text-dark-400 text-sm block mb-1">Stock Minimum</label>
                    <p className="text-orange-400 font-bold text-2xl">
                      {product.stock_minimal}
                    </p>
                    <p className="text-dark-400 text-xs mt-1">{product.unite_mesure}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t border-dark-800 pt-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                Informations Supplémentaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-800 p-4 rounded-lg">
                  <label className="text-dark-400 text-sm block mb-1">Date de Création</label>
                  <p className="text-white">
                    {new Date(product.date_creation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="bg-dark-800 p-4 rounded-lg">
                  <label className="text-dark-400 text-sm block mb-1">Dernière Modification</label>
                  <p className="text-white">
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
            <div className="border-t border-dark-800 pt-6 mt-6">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/products')}
                  className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-lg transition-colors"
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

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Package, 
  Droplets, 
  Snowflake,
  TrendingUp,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { productService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';

const ProductsPage = () => {
  const navigate = useNavigate();
  const { dashboardUpdateTrigger, onProductDeleted, triggerDashboardUpdate } = useDataUpdate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [dashboardUpdateTrigger]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Récupérer les vraies données depuis l'API
      const response = await productService.getAll();
      console.log('Products API Response:', response);
      
      // Les données sont paginées avec le format {count, results}
      if (response && response.results) {
        setProducts(response.results);
      } else if (response && Array.isArray(response)) {
        setProducts(response);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    navigate('/products/create');
  };
  const handleViewProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const productToDelete = products.find(p => p.id === productId);
        
        // Appeler l'API pour supprimer le produit
        await productService.delete(productId);
        
        // Mettre à jour l'état local
        setProducts(products.filter(p => p.id !== productId));
        
        // Notifier le contexte global
        if (onProductDeleted && productToDelete) {
          onProductDeleted({
            id: productId,
            nom: productToDelete.nom
          });
        }
        
        toast.success('Produit supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression du produit');
      }
    }
  };

  const getStockStatus = (product) => {
    if (product.stock_actuel <= 0) return { status: 'Rupture', color: 'red' };
    if (product.stock_actuel <= product.stock_minimal) return { status: 'Critique', color: 'orange' };
    return { status: 'Normal', color: 'green' };
  };

  const getProductIcon = (type) => {
    return type === 'eau' ? Droplets : Snowflake;
  };

  const filteredProducts = products.filter(product =>
    product.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = products.reduce((sum, p) => sum + (p.stock_actuel || 0), 0);
  const lowStockCount = products.filter(p => (p.stock_actuel || 0) <= (p.stock_minimal || 0)).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.stock_actuel || 0) * (p.prix_unitaire || 0)), 0);

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
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Package className="w-8 h-8 mr-3 text-primary-400" />
            Gestion des Produits
          </h2>
          <p className="text-dark-300">
            Gérez votre inventaire d'eau et de glace
          </p>
        </div>
        <Button onClick={handleCreateProduct} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Nouveau Produit</span>
        </Button>
      </motion.div>

      {/* Individual Products Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Skeleton loading cards
          [...Array(4)].map((_, index) => (
            <motion.div key={index} variants={itemVariants} className="stat-card animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-dark-600 rounded mb-2"></div>
                  <div className="h-8 bg-dark-600 rounded w-3/4"></div>
                </div>
                <div className="w-8 h-8 bg-dark-600 rounded"></div>
              </div>
            </motion.div>
          ))
        ) : filteredProducts.length === 0 ? (
          <motion.div variants={itemVariants} className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">Aucun produit trouvé</p>
            <Button onClick={handleCreateProduct} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Créer votre premier produit
            </Button>
          </motion.div>
        ) : (
          filteredProducts.slice(0, 8).map((product) => {
            const stockStatus = getStockStatus(product);
            const ProductIcon = getProductIcon(product.type_produit);
            
            return (
              <motion.div 
                key={product.id} 
                variants={itemVariants} 
                className="stat-card cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => handleViewProduct(product)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-dark-200 mb-1 truncate" title={product.nom}>
                      {product.nom}
                    </h3>
                    <p className="text-3xl font-bold text-primary-400">
                      {product.stock_actuel}
                      <span className="text-sm text-dark-400 ml-1">{product.unite_mesure}</span>
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    product.type_produit === 'eau' 
                      ? 'bg-blue-400/20' 
                      : 'bg-cyan-400/20'
                  }`}>
                    <ProductIcon className={`w-6 h-6 ${
                      product.type_produit === 'eau' ? 'text-blue-400' : 'text-cyan-400'
                    }`} />
                  </div>
                </div>
                
                {/* Stock Status Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-dark-400">Stock</span>
                    <span className={`text-xs font-medium ${
                      stockStatus.color === 'red' ? 'text-red-400' :
                      stockStatus.color === 'orange' ? 'text-orange-400' :
                      'text-green-400'
                    }`}>
                      {stockStatus.status}
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stockStatus.color === 'red' ? 'bg-red-400' :
                        stockStatus.color === 'orange' ? 'bg-orange-400' :
                        'bg-green-400'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(5, (product.stock_actuel / (product.stock_minimal * 3 || 100)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Price and Type */}
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-medium text-sm">
                    {formatHTG(product.prix_unitaire)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.type_produit === 'eau' 
                      ? 'bg-blue-400/20 text-blue-400'
                      : 'bg-cyan-400/20 text-cyan-400'
                  }`}>
                    {product.type_produit?.charAt(0).toUpperCase() + product.type_produit?.slice(1)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Show more products link if there are more than 8 */}
      {!loading && filteredProducts.length > 8 && (
        <motion.div variants={itemVariants} className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              // Scroll to products table
              document.querySelector('.card:last-of-type').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Voir tous les {filteredProducts.length} produits</span>
          </Button>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtres</span>
          </button>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 text-dark-300 font-medium">Produit</th>
                <th className="text-left py-3 text-dark-300 font-medium">Type</th>
                <th className="text-left py-3 text-dark-300 font-medium">Prix</th>
                <th className="text-left py-3 text-dark-300 font-medium">Stock Actuel</th>
                <th className="text-left py-3 text-dark-300 font-medium">Stock Min/Max</th>
                <th className="text-left py-3 text-dark-300 font-medium">Statut</th>
                <th className="text-left py-3 text-dark-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-dark-400">
                    Chargement...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-dark-400">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const ProductIcon = getProductIcon(product.type_produit);
                  
                  return (
                    <tr key={product.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                      <td className="py-4">
                        <div className="flex items-center">
                          <ProductIcon className={`w-8 h-8 mr-3 ${
                            product.type_produit === 'eau' ? 'text-blue-400' : 'text-cyan-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium">{product.nom}</p>
                            <p className="text-dark-400 text-sm">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.type_produit === 'eau' 
                            ? 'bg-blue-400/20 text-blue-400'
                            : 'bg-cyan-400/20 text-cyan-400'
                        }`}>
                          {product.type_produit?.charAt(0).toUpperCase() + product.type_produit?.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-green-400 font-medium">
                        {formatHTG(product.prix_unitaire)}/{product.unite_mesure}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="text-white font-bold text-lg">
                              {product.stock_actuel}
                            </p>
                            <p className="text-dark-400 text-xs">{product.unite_mesure}</p>
                          </div>
                          <div className="w-24 bg-dark-700 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                stockStatus.color === 'red' ? 'bg-red-400' :
                                stockStatus.color === 'orange' ? 'bg-orange-400' :
                                'bg-green-400'
                              }`}
                              style={{
                                width: `${Math.min(100, (product.stock_actuel / (product.stock_minimal * 3 || 100)) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-orange-400 font-medium">Min:</span>
                            <span className="text-white">{product.stock_minimal}</span>
                          </div>
                          {product.stock_maximum && (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400 font-medium">Max:</span>
                              <span className="text-white">{product.stock_maximum}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          stockStatus.color === 'red' ? 'bg-red-400/20 text-red-400' :
                          stockStatus.color === 'orange' ? 'bg-orange-400/20 text-orange-400' :
                          'bg-green-400/20 text-green-400'
                        }`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProduct(product);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/edit/${product.id}`);
                            }}
                            className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id);
                            }}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
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

export default ProductsPage;
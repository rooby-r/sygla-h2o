import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Package, 
  Droplets, 
  Snowflake,
  AlertCircle,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { productService } from '../../services/api';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useProductTypes } from '../../hooks/useProductTypes';
import { useMeasurementUnits } from '../../hooks/useMeasurementUnits';

const CreateProductPage = () => {
  const navigate = useNavigate();
  const { onProductCreated } = useDataUpdate();
  const { productTypes, addProductType } = useProductTypes();
  const { measurementUnits, addMeasurementUnit } = useMeasurementUnits();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    type_produit: 'eau',
    description: '',
    prix_unitaire: '',
    unite_mesure: 'litre',
    stock_actuel: '',
    stock_minimal: '10'
  });

  const [errors, setErrors] = useState({});
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeValue, setNewTypeValue] = useState('');
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);
  const [newUnitValue, setNewUnitValue] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du produit est requis';
    }
    
    if (!formData.prix_unitaire || parseFloat(formData.prix_unitaire) <= 0) {
      newErrors.prix_unitaire = 'Le prix unitaire doit être supérieur à 0';
    }
    
    if (!formData.stock_actuel || parseInt(formData.stock_actuel) < 0) {
      newErrors.stock_actuel = 'Le stock actuel doit être un nombre positif';
    }
    
    if (!formData.stock_minimal || parseInt(formData.stock_minimal) <= 0) {
      newErrors.stock_minimal = 'Le stock minimal doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddNewType = () => {
    if (newTypeValue.trim()) {
      const success = addProductType(newTypeValue.trim());
      if (success) {
        setFormData(prev => ({
          ...prev,
          type_produit: newTypeValue.toLowerCase().trim()
        }));
        setShowNewTypeInput(false);
        setNewTypeValue('');
        toast.success(`Type de produit "${newTypeValue.trim()}" ajouté avec succès !`);
      } else {
        toast.error('Ce type de produit existe déjà ou est invalide');
      }
    }
  };

  const handleCancelNewType = () => {
    setShowNewTypeInput(false);
    setNewTypeValue('');
    setFormData(prev => ({
      ...prev,
      type_produit: 'eau'
    }));
  };

  const handleAddNewUnit = () => {
    if (newUnitValue.trim()) {
      const success = addMeasurementUnit(newUnitValue.trim());
      if (success) {
        setFormData(prev => ({
          ...prev,
          unite_mesure: newUnitValue.toLowerCase().trim()
        }));
        setShowNewUnitInput(false);
        setNewUnitValue('');
        toast.success(`Unité de mesure "${newUnitValue.trim()}" ajoutée avec succès !`);
      } else {
        toast.error('Cette unité de mesure existe déjà ou est invalide');
      }
    }
  };

  const handleCancelNewUnit = () => {
    setShowNewUnitInput(false);
    setNewUnitValue('');
    setFormData(prev => ({
      ...prev,
      unite_mesure: 'litre'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        nom: formData.nom,
        type_produit: formData.type_produit,
        description: formData.description,
        prix_unitaire: parseFloat(formData.prix_unitaire),
        unite_mesure: formData.unite_mesure,
        stock_actuel: parseInt(formData.stock_actuel),
        stock_minimal: parseInt(formData.stock_minimal),
        is_active: true
      };

      const response = await productService.create(productData);
      
      // Notifier le contexte global de la création
      if (onProductCreated) {
        onProductCreated(response);
      }
      
      toast.success('Produit créé avec succès !');
      navigate('/products');
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la création du produit';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = () => {
    switch (formData.type_produit) {
      case 'eau':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'glace':
        return <Snowflake className="w-5 h-5 text-cyan-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              {getProductIcon()}
              <h1 className="text-3xl font-bold text-white">Nouveau Produit</h1>
            </div>
          </div>
          <p className="text-gray-300">Créer un nouveau produit dans l'inventaire</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-slate-700/50 border ${
                    errors.nom ? 'border-red-500' : 'border-slate-600'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ex: Eau potable premium 20L"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.nom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type de produit *
                </label>
                {!showNewTypeInput ? (
                  <div className="flex gap-2">
                    <select
                      name="type_produit"
                      value={formData.type_produit}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {productTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewTypeInput(true)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Ajouter un nouveau type"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newTypeValue}
                      onChange={(e) => setNewTypeValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewType()}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Boisson gazeuse, Jus de fruits..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddNewType}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelNewType}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description détaillée du produit..."
              />
            </div>

            {/* Prix et unité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prix unitaire (HTG) *
                </label>
                <input
                  type="number"
                  name="prix_unitaire"
                  value={formData.prix_unitaire}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 bg-slate-700/50 border ${
                    errors.prix_unitaire ? 'border-red-500' : 'border-slate-600'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="0.00"
                />
                {errors.prix_unitaire && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.prix_unitaire}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unité de mesure *
                </label>
                {!showNewUnitInput ? (
                  <div className="flex gap-2">
                    <select
                      name="unite_mesure"
                      value={formData.unite_mesure}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {measurementUnits.map(unit => (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewUnitInput(true)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      title="Ajouter une nouvelle unité"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newUnitValue}
                      onChange={(e) => setNewUnitValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewUnit()}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: carton, sac, gramme..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddNewUnit}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelNewUnit}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock actuel *
                </label>
                <input
                  type="number"
                  name="stock_actuel"
                  value={formData.stock_actuel}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-4 py-3 bg-slate-700/50 border ${
                    errors.stock_actuel ? 'border-red-500' : 'border-slate-600'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="0"
                />
                {errors.stock_actuel && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.stock_actuel}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock minimal *
                </label>
                <input
                  type="number"
                  name="stock_minimal"
                  value={formData.stock_minimal}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-3 bg-slate-700/50 border ${
                    errors.stock_minimal ? 'border-red-500' : 'border-slate-600'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="10"
                />
                {errors.stock_minimal && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.stock_minimal}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/products')}
                disabled={loading}
                className="text-gray-300 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Créer le produit
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateProductPage;
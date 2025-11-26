import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Save, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService } from '../../services/api';
import Button from '../../components/ui/Button';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useProductTypes } from '../../hooks/useProductTypes';
import { useMeasurementUnits } from '../../hooks/useMeasurementUnits';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerDashboardUpdate } = useDataUpdate();
  const { productTypes, addProductType } = useProductTypes();
  const { measurementUnits, addMeasurementUnit } = useMeasurementUnits();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeValue, setNewTypeValue] = useState('');
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);
  const [newUnitValue, setNewUnitValue] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    type_produit: 'eau',
    description: '',
    prix_unitaire: '',
    unite_mesure: 'litre',
    stock_actuel: '',
    stock_minimal: '',
    date_peremption: ''
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const product = await productService.getById(id);
      setFormData({
        nom: product.nom || '',
        type_produit: product.type_produit || 'eau',
        description: product.description || '',
        prix_unitaire: product.prix_unitaire || '',
        unite_mesure: product.unite_mesure || 'litre',
        stock_actuel: product.stock_actuel || '',
        stock_minimal: product.stock_minimal || '',
        date_peremption: product.date_peremption ? product.date_peremption.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      toast.error('Erreur lors du chargement du produit');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const updatedData = {
        nom: formData.nom,
        type_produit: formData.type_produit,
        description: formData.description,
        prix_unitaire: parseFloat(formData.prix_unitaire),
        unite_mesure: formData.unite_mesure,
        stock_actuel: parseInt(formData.stock_actuel),
        stock_minimal: parseInt(formData.stock_minimal),
        date_peremption: formData.date_peremption || null
      };

      await productService.update(id, updatedData);
      
      // Déclencher la mise à jour du dashboard et de la sidebar
      triggerDashboardUpdate();
      
      toast.success('Produit mis à jour avec succès');
      navigate('/products');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du produit');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center text-dark-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la liste des produits
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Package className="w-8 h-8 mr-3 text-primary-400" />
            Modifier le Produit
          </h1>
        </div>

        {/* Form */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Type *
                </label>
                {!showNewTypeInput ? (
                  <div className="flex gap-2">
                    <select
                      name="type_produit"
                      value={formData.type_produit}
                      onChange={handleChange}
                      className="input flex-1"
                      required
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
                      className="input w-full"
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

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input w-full h-20 resize-none"
                rows="3"
              />
            </div>

            {/* Prix et mesures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Prix unitaire (HTG) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="prix_unitaire"
                  value={formData.prix_unitaire}
                  onChange={handleChange}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Unité de mesure
                </label>
                {!showNewUnitInput ? (
                  <div className="flex gap-2">
                    <select
                      name="unite_mesure"
                      value={formData.unite_mesure}
                      onChange={handleChange}
                      className="input flex-1"
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
                      className="input w-full"
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

            {/* Gestion du stock */}
            <div className="border-t border-dark-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gestion du Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Stock actuel *
                  </label>
                  <input
                    type="number"
                    name="stock_actuel"
                    value={formData.stock_actuel}
                    onChange={handleChange}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Stock minimum
                  </label>
                  <input
                    type="number"
                    name="stock_minimal"
                    value={formData.stock_minimal}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Date de péremption */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Date de péremption
              </label>
              <input
                type="date"
                name="date_peremption"
                value={formData.date_peremption}
                onChange={handleChange}
                className="input w-full md:w-auto"
              />
            </div>

            {/* Actions */}
            <div className="border-t border-dark-800 pt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/products')}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage;
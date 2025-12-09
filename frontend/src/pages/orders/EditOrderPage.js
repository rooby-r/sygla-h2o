import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  User,
  Package,
  Search,
  AlertCircle,
  Calculator,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { orderService, clientService, productService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useTheme } from '../../contexts/ThemeContext';

const EditOrderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { triggerDashboardUpdate } = useDataUpdate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const clientSearchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    date_commande: '',
    date_livraison_prevue: '',
    type_livraison: 'retrait_magasin',
    frais_livraison: 0,
    statut: 'en_attente',
    notes: '',
    items: []
  });

  // Charger la commande existante et les données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Charger la commande existante
        const orderResponse = await orderService.getById(id);
        console.log('Order data:', orderResponse);
        
        // Charger les clients et produits
        const [clientsResponse, productsResponse] = await Promise.all([
          clientService.getAll(),
          productService.getAll()
        ]);

        setClients(clientsResponse.results || clientsResponse);
        setProducts(productsResponse.results || productsResponse);

        // Remplir le formulaire avec les données de la commande
        const order = orderResponse;
        console.log('📦 Structure complète de la commande:', order);
        console.log('📦 Structure des items reçus:', order.items);
        if (order.items && order.items.length > 0) {
          console.log('📦 Premier item détaillé:', JSON.stringify(order.items[0], null, 2));
        }
        
        setFormData({
          client_id: order.client?.id || '',
          date_commande: order.date_creation ? order.date_creation.split('T')[0] : '',
          date_livraison_prevue: order.date_livraison_prevue ? order.date_livraison_prevue.split('T')[0] : '',
          type_livraison: order.type_livraison || 'retrait_magasin',
          frais_livraison: parseFloat(order.frais_livraison) || 0,
          statut: order.statut || 'en_attente',
          notes: order.notes || '',
          items: order.items?.map(item => {
            console.log('🔍 Item individuel complet:', JSON.stringify(item, null, 2));
            
            // Essayer plusieurs façons de récupérer le produit_id
            let produit_id = item.produit_id || 
                           item.produit?.id || 
                           item.product_id || 
                           item.id_produit ||
                           null;
                           
            console.log('🔍 produit_id trouvé:', produit_id);
            
            const mappedItem = {
              produit_id: produit_id,
              produit_nom: item.produit_nom || item.produit?.nom || item.product_name || '',
              quantite: parseInt(item.quantite) || 1,
              prix_unitaire: parseFloat(item.prix_unitaire) || 0,
              sous_total: parseFloat(item.sous_total) || 0
            };
            console.log('✨ Item mappé:', mappedItem);
            return mappedItem;
          }) || []
        });

        // Mettre à jour la recherche client avec le nom du client sélectionné
        if (order.client) {
          setClientSearch(order.client.nom_commercial || order.client.raison_sociale || '');
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement de la commande');
        navigate('/orders');
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, navigate]);

  // Filtrer les clients selon la recherche
  const filteredClients = clients.filter(client =>
    (client.nom_commercial && client.nom_commercial.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.raison_sociale && client.raison_sociale.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.contact && client.contact.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  // Filtrer les produits selon la recherche
  const filteredProducts = products.filter(product =>
    product.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.code_produit && product.code_produit.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const handleClientSelect = (client) => {
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearch(client.nom_commercial || client.raison_sociale);
    setShowClientList(false);
  };

  const handleAddProduct = (product) => {
    const existingItem = formData.items.find(item => item.produit_id === product.id);
    
    if (existingItem) {
      toast.error('Ce produit est déjà dans la commande');
      return;
    }

    const newItem = {
      produit_id: product.id,
      produit_nom: product.nom,
      quantite: 1,
      prix_unitaire: parseFloat(product.prix_unitaire),
      sous_total: parseFloat(product.prix_unitaire)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setShowProductSelector(false);
    setProductSearch('');
    toast.success('Produit ajouté à la commande');
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculer le sous-total si quantité ou prix change
    if (field === 'quantite' || field === 'prix_unitaire') {
      const quantite = field === 'quantite' ? parseInt(value) : updatedItems[index].quantite;
      const prix = field === 'prix_unitaire' ? parseFloat(value) : updatedItems[index].prix_unitaire;
      updatedItems[index].sous_total = quantite * prix;
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    toast.success('Produit retiré de la commande');
  };

  const calculateTotal = () => {
    const montantProduits = formData.items.reduce((sum, item) => sum + item.sous_total, 0);
    const fraisLivraison = formData.type_livraison === 'livraison_domicile' 
      ? parseFloat(formData.frais_livraison) || 0 
      : 0;
    return {
      montantProduits,
      fraisLivraison,
      total: montantProduits + fraisLivraison
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_id) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    // Validation spéciale pour livraison à domicile
    if (formData.type_livraison === 'livraison_domicile' && !formData.date_livraison_prevue) {
      toast.error('La date de livraison est obligatoire pour une livraison à domicile');
      return;
    }

    try {
      setLoading(true);

      // Validation des données
      console.log('🔍 Données du formulaire avant envoi:', formData);
      
      if (!formData.client_id) {
        toast.error('Veuillez sélectionner un client');
        return;
      }

      if (formData.items.length === 0) {
        toast.error('Veuillez ajouter au moins un produit');
        return;
      }

      // Vérifier que tous les items ont des IDs de produit valides
      console.log('🔍 FormData complet avant validation:', JSON.stringify(formData, null, 2));
      console.log('🔍 Vérification des items:', formData.items);
      const invalidItems = formData.items.filter((item, index) => {
        const isValid = item.produit_id && item.quantite && item.prix_unitaire;
        if (!isValid) {
          console.log(`❌ Item ${index} invalide:`, {
            produit_id: item.produit_id,
            quantite: item.quantite,
            prix_unitaire: item.prix_unitaire,
            item: item
          });
        }
        return !isValid;
      });
      
      if (invalidItems.length > 0) {
        console.error('❌ Items invalides détaillés:');
        invalidItems.forEach((item, index) => {
          console.error(`Item ${index}:`, JSON.stringify(item, null, 2));
          console.error(`- produit_id: ${item.produit_id} (type: ${typeof item.produit_id})`);
          console.error(`- quantite: ${item.quantite} (type: ${typeof item.quantite})`);
          console.error(`- prix_unitaire: ${item.prix_unitaire} (type: ${typeof item.prix_unitaire})`);
        });
        toast.error(`${invalidItems.length} produit(s) ont des données manquantes - voir la console pour plus de détails`);
        return;
      }

      const orderData = {
        client_id: parseInt(formData.client_id),
        date_livraison_prevue: formData.date_livraison_prevue || null,
        type_livraison: formData.type_livraison,
        statut: formData.statut,
        notes: formData.notes || '',
        frais_livraison: formData.type_livraison === 'livraison_domicile' 
          ? parseFloat(formData.frais_livraison) || 0 
          : 0,
        items: formData.items.map(item => ({
          produit_id: parseInt(item.produit_id),
          quantite: parseInt(item.quantite),
          prix_unitaire: parseFloat(item.prix_unitaire)
        }))
      };

      console.log('📤 Données formatées pour l\'API:', orderData);

      console.log('Mise à jour de la commande:', orderData);

      const result = await orderService.update(id, orderData);
      console.log('✅ Résultat de la mise à jour:', result);
      
      triggerDashboardUpdate();
      toast.success('Commande mise à jour avec succès');
      
      // Attendre un petit délai pour s'assurer que la base de données est mise à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Naviguer avec un state pour forcer le rechargement
      navigate(`/orders/${id}`, { 
        replace: true,
        state: { forceReload: true, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('❌ Erreur complète lors de la mise à jour:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Status text:', error.response?.statusText);
      console.error('❌ Details complets:', error.response?.data?.details);
      
      let errorMessage = 'Erreur lors de la mise à jour de la commande';
      
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
          
          // Si on a des détails de validation, les afficher
          if (error.response.data.details) {
            console.error('❌ Détails de validation:', error.response.data.details);
            
            // Construire un message d'erreur plus informatif
            const detailsMessages = [];
            for (const [field, messages] of Object.entries(error.response.data.details)) {
              if (Array.isArray(messages)) {
                detailsMessages.push(`${field}: ${messages.join(', ')}`);
              } else {
                detailsMessages.push(`${field}: ${messages}`);
              }
            }
            
            if (detailsMessages.length > 0) {
              errorMessage += ` - ${detailsMessages.join('; ')}`;
            }
          }
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (typeof error.response.data === 'object') {
          // Si c'est un objet d'erreurs de validation
          const firstKey = Object.keys(error.response.data)[0];
          if (firstKey && error.response.data[firstKey]) {
            errorMessage = `${firstKey}: ${error.response.data[firstKey]}`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Message d\'erreur final:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/orders/${id}`);
  };

  const totals = calculateTotal();

  if (loadingData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-dark-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen p-6 ${theme === 'light' ? 'bg-slate-50' : 'bg-dark-900'}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Modifier la commande</h1>
              <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-400'}>Modifiez les détails de la commande existante</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleCancel} variant="secondary">
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || formData.items.length === 0}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations client */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
              >
                <h3 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <User className="w-5 h-5 mr-3 text-primary-400" />
                  Informations Client
                </h3>
                
                <div className="space-y-4">
                  {/* Recherche client */}
                  <div className="relative">
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                      Client *
                    </label>
                    <div className="relative">
                      <input
                        ref={clientSearchRef}
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientList(true);
                        }}
                        onFocus={() => setShowClientList(true)}
                        placeholder="Rechercher un client..."
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'}`}
                        required
                      />
                      <Search className={`absolute right-3 top-3 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                    </div>
                    
                    {/* Liste des clients */}
                    {showClientList && filteredClients.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-dark-800 border-dark-600'}`}>
                        {filteredClients.map(client => (
                          <div
                            key={client.id}
                            onClick={() => handleClientSelect(client)}
                            className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${theme === 'light' ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-dark-700 border-dark-600'}`}
                          >
                            <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                              {client.nom_commercial || client.raison_sociale}
                            </div>
                            <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                              {client.contact} • {client.telephone}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Détails de la commande */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
              >
                <h3 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <FileText className="w-5 h-5 mr-3 text-accent-400" />
                  Détails de la Commande
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                      Date de livraison prévue
                      {formData.type_livraison === 'livraison_domicile' && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.date_livraison_prevue}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_livraison_prevue: e.target.value }))}
                      required={formData.type_livraison === 'livraison_domicile'}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${theme === 'light' ? 'bg-white text-slate-800' : 'bg-dark-700 text-white'} ${formData.type_livraison === 'livraison_domicile' && !formData.date_livraison_prevue ? 'border-red-500' : theme === 'light' ? 'border-slate-300' : 'border-dark-600'}`}
                    />
                    {formData.type_livraison === 'livraison_domicile' && !formData.date_livraison_prevue && (
                      <p className="text-red-400 text-sm mt-1">
                        La date de livraison est obligatoire pour une livraison à domicile
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                      Type de livraison
                    </label>
                    <select
                      value={formData.type_livraison}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData(prev => {
                          const newData = { ...prev, type_livraison: newType };
                          
                          // Si on passe à livraison domicile et qu'il n'y a pas de date, mettre demain par défaut
                          if (newType === 'livraison_domicile' && !prev.date_livraison_prevue) {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            newData.date_livraison_prevue = tomorrow.toISOString().split('T')[0];
                          }
                          
                          // Réinitialiser les frais si retrait en magasin
                          if (newType === 'retrait_magasin') {
                            newData.frais_livraison = 0;
                          }
                          
                          return newData;
                        });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
                    >
                      <option value="retrait_magasin">Retrait en magasin (Gratuit)</option>
                      <option value="livraison_domicile">Livraison à domicile</option>
                    </select>
                  </div>
                </div>

                {/* Frais de livraison - visible seulement pour livraison à domicile */}
                {formData.type_livraison === 'livraison_domicile' && (
                  <div className="mt-4">
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                      Frais de livraison (HTG)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.frais_livraison}
                      onChange={(e) => setFormData(prev => ({ ...prev, frais_livraison: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'}`}
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="mt-6">
                  <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Notes supplémentaires..."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'}`}
                  />
                </div>
              </motion.div>

              {/* Articles de la commande */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    <Package className="w-5 h-5 mr-3 text-accent-400" />
                    Articles de la Commande ({formData.items.length})
                  </h3>
                  <Button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    variant="primary"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un produit
                  </Button>
                </div>

                {/* Liste des articles */}
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className={`rounded-lg p-4 border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-dark-700 border-dark-600'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className={`block text-xs mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Produit</label>
                            <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.produit_nom}</span>
                          </div>
                          <div>
                            <label className={`block text-xs mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Quantité</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantite}
                              onChange={(e) => handleItemChange(index, 'quantite', parseInt(e.target.value))}
                              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-600 border-dark-500 text-white'}`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Prix unitaire (HTG)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.prix_unitaire}
                              onChange={(e) => handleItemChange(index, 'prix_unitaire', parseFloat(e.target.value))}
                              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-600 border-dark-500 text-white'}`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Sous-total (HTG)</label>
                            <span className="text-green-400 font-bold text-lg">
                              {formatHTG(item.sous_total)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {formData.items.length === 0 && (
                    <div className={`text-center py-8 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`}>
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun article dans la commande</p>
                      <p className="text-sm">Cliquez sur "Ajouter un produit" pour commencer</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar - Résumé */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-xl p-6 border sticky top-6 ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
              >
                <h3 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <Calculator className="w-5 h-5 mr-3 text-primary-400" />
                  Résumé de la Commande
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>Nombre d'articles:</span>
                    <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{formData.items.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>Montant des produits:</span>
                    <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{formatHTG(totals.montantProduits)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>
                      Frais de livraison
                      {formData.type_livraison === 'retrait_magasin' ? ' (Gratuit)' : ''}:
                    </span>
                    <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{formatHTG(totals.fraisLivraison)}</span>
                  </div>
                  
                  <div className={`border-t pt-4 ${theme === 'light' ? 'border-slate-200' : 'border-dark-600'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Total:</span>
                      <span className="text-2xl font-bold text-green-400">{formatHTG(totals.total)}</span>
                    </div>
                  </div>
                  
                  {formData.items.length === 0 && (
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-yellow-400 text-sm">
                        <p className="font-medium">Commande vide</p>
                        <p>Ajoutez au moins un produit pour pouvoir sauvegarder.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </form>

        {/* Modal de sélection de produits */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden ${theme === 'light' ? 'bg-white shadow-xl' : 'bg-dark-800'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Sélectionner un produit</h3>
                <button
                  onClick={() => {
                    setShowProductSelector(false);
                    setProductSearch('');
                  }}
                  className={theme === 'light' ? 'text-slate-400 hover:text-slate-800' : 'text-dark-400 hover:text-white'}
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'}`}
                  />
                  <Search className={`absolute right-3 top-3 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className={`rounded-lg p-4 border hover:border-primary-500 cursor-pointer transition-colors ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-dark-700 border-dark-600'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{product.nom}</h4>
                        <span className="text-green-400 font-bold">{formatHTG(product.prix_unitaire)}</span>
                      </div>
                      <div className={`text-sm space-y-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                        <p>Code: {product.code_produit || 'N/A'}</p>
                        <p>Stock: {product.quantite_stock} {product.unite_mesure}</p>
                        {product.description && (
                          <p className="text-xs">{product.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-dark-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun produit trouvé</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EditOrderPage;
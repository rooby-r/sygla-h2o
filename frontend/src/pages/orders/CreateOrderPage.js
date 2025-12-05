import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  Package,
  ShoppingCart,
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

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const { triggerDashboardUpdate } = useDataUpdate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [clientInputFocused, setClientInputFocused] = useState(false);
  const clientSearchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    date_commande: new Date().toISOString().split('T')[0],
    date_livraison_prevue: '',
    date_echeance: '',
    type_livraison: 'retrait_magasin',
    statut: 'attente', // Corriger pour correspondre au backend
    notes: '',
    frais_livraison: '',  // Frais de livraison manuels (vide = auto 15%)
    items: []
  });

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        console.log('🔄 Chargement des données clients et produits...');
        
        // Vérifier l'authentification
        const token = localStorage.getItem('access_token');
        console.log('🔐 Token présent:', !!token);
        if (token) {
          console.log('🔑 Token:', token.substring(0, 20) + '...');
        }
        
        const [clientsResponse, productsResponse] = await Promise.all([
          clientService.getAll(),
          productService.getAll()
        ]);
        
        console.log('📋 Réponse clients:', clientsResponse);
        console.log('📦 Réponse produits:', productsResponse);
        
        // clientService.getAll() retourne déjà response.data, donc pas besoin de .data à nouveau
        const clientsData = clientsResponse?.results || clientsResponse || [];
        const productsData = productsResponse?.results || productsResponse || [];
        
        console.log('👥 Clients traités:', clientsData);
        console.log('📦 Produits traités:', productsData);
        
        setClients(clientsData);
        setProducts(productsData);
        
        console.log(`✅ Chargement terminé: ${clientsData.length} clients, ${productsData.length} produits`);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.error('❌ Détails de l\'erreur:', error.response?.data || error.message);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Gérer les clics en dehors pour fermer la liste des clients
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target)) {
        // Petit délai pour permettre aux clics sur les clients de s'exécuter d'abord
        setTimeout(() => {
          setShowClientList(false);
          setClientInputFocused(false);
        }, 150);
      }
    };

    // Utiliser 'click' au lieu de 'mousedown' pour éviter les conflits
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Ouvrir automatiquement la liste quand l'utilisateur tape ET que le champ a le focus
  useEffect(() => {
    console.log('🔍 useEffect clientSearch:', { 
      clientSearch, 
      length: clientSearch.length,
      clientInputFocused,
      currentShowClientList: showClientList 
    });
    
    if (clientSearch.length > 0 && clientInputFocused) {
      console.log('✅ Ouverture de la liste (clientSearch > 0 et focus)');
      setShowClientList(true);
    } else if (clientSearch.length === 0 && clientInputFocused) {
      console.log('✅ Ouverture de la liste (focus, tous les clients)');
      setShowClientList(true);
    }
  }, [clientSearch, clientInputFocused]);

  // Filtrer les clients selon la recherche
  const filteredClients = clientSearch === '' 
    ? clients // Afficher tous les clients si pas de recherche
    : clients.filter(client =>
        client.nom_commercial?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.contact?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.contact_principal?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.telephone?.includes(clientSearch) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase())
      );

  // Debug: Afficher les clients dans la console
  console.log('🔍 Debug clients:', {
    totalClients: clients.length,
    clientsData: clients,
    filteredClients: filteredClients.length,
    clientSearch,
    showClientList
  });

  // Filtrer les produits selon la recherche
  const filteredProducts = products.filter(product =>
    product.nom?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.type_produit?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Client sélectionné
  const selectedClient = clients.find(c => c.id === parseInt(formData.client_id));

  // Calculer le montant des produits
  const calculateProductsTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantite * item.prix_unitaire);
    }, 0);
  };

  // Calculer les frais de livraison (manuel ou 15% pour livraison à domicile)
  const calculateDeliveryFees = () => {
    if (formData.type_livraison !== 'livraison_domicile') return 0;
    
    // Si l'utilisateur a saisi des frais manuels, utiliser cette valeur
    if (formData.frais_livraison !== '' && formData.frais_livraison !== null) {
      return parseFloat(formData.frais_livraison) || 0;
    }
    
    // Sinon, calculer 15% automatiquement
    const productsTotal = calculateProductsTotal();
    return productsTotal * 0.15;
  };

  // Calculer le montant total (produits + livraison)
  const calculateTotal = () => {
    return calculateProductsTotal() + calculateDeliveryFees();
  };

  // Ajouter un produit à la commande
  const addProduct = (product) => {
    const existingItem = formData.items.find(item => item.produit_id === product.id);
    
    if (existingItem) {
      // Si le produit existe déjà, augmenter la quantité
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.produit_id === product.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        )
      }));
    } else {
      // Sinon, ajouter un nouvel élément
      const newItem = {
        produit_id: product.id,
        nom_produit: product.nom,
        quantite: 1,
        prix_unitaire: product.prix_unitaire,
        unite_mesure: product.unite_mesure,
        stock_disponible: product.stock_actuel
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
    
    setShowProductSelector(false);
    setProductSearch('');
    toast.success(`${product.nom} ajouté à la commande`);
  };

  // Modifier la quantité d'un produit
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }

    const item = formData.items.find(item => item.produit_id === productId);
    if (item && newQuantity > item.stock_disponible) {
      toast.error(`Stock insuffisant. Stock disponible: ${item.stock_disponible}`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.produit_id === productId
          ? { ...item, quantite: newQuantity }
          : item
      )
    }));
  };

  // Supprimer un produit de la commande
  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.produit_id !== productId)
    }));
    toast.success('Produit retiré de la commande');
  };

  // Valider le formulaire
  const validateForm = () => {
    console.log('🔍 Validation du formulaire...');
    console.log('🔍 Client ID:', formData.client_id, typeof formData.client_id);
    console.log('🔍 Date livraison:', formData.date_livraison_prevue);
    console.log('🔍 Items:', formData.items);
    
    if (!formData.client_id) {
      console.log('❌ Validation échouée: Aucun client sélectionné');
      toast.error('Veuillez sélectionner un client');
      return false;
    }

    // Vérifier la date de livraison seulement pour livraison à domicile
    if (formData.type_livraison === 'livraison_domicile' && !formData.date_livraison_prevue) {
      console.log('❌ Validation échouée: Date de livraison requise pour livraison à domicile');
      toast.error('Veuillez sélectionner une date de livraison pour la livraison à domicile');
      return false;
    }

    // Vérifier que la date d'échéance ne dépasse pas la date de livraison
    if (formData.date_echeance && formData.date_livraison_prevue) {
      const dateEcheance = new Date(formData.date_echeance);
      const dateLivraison = new Date(formData.date_livraison_prevue);
      if (dateEcheance > dateLivraison) {
        console.log('❌ Validation échouée: Date d\'échéance dépasse la date de livraison');
        toast.error('La date d\'échéance ne peut pas dépasser la date de livraison');
        return false;
      }
    }

    if (formData.items.length === 0) {
      console.log('❌ Validation échouée: Aucun produit');
      toast.error('Veuillez ajouter au moins un produit à la commande');
      return false;
    }

    // Vérifier les stocks
    for (const item of formData.items) {
      if (item.quantite > item.stock_disponible) {
        console.log(`❌ Validation échouée: Stock insuffisant pour ${item.nom_produit}`);
        toast.error(`Stock insuffisant pour ${item.nom_produit}`);
        return false;
      }
    }

    console.log('✅ Validation réussie');
    return true;
  };

  // Soumettre la commande
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Validation supplémentaire pour client_id
    if (!formData.client_id || formData.client_id === '') {
      toast.error('Veuillez sélectionner un client');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        client_id: parseInt(formData.client_id),
        date_livraison_prevue: formData.date_livraison_prevue ? formData.date_livraison_prevue : null,
        date_echeance: formData.date_echeance || null,
        type_livraison: formData.type_livraison || 'retrait_magasin',
        notes: formData.notes || '',
        // Inclure les frais de livraison si saisis manuellement
        ...(formData.type_livraison === 'livraison_domicile' && formData.frais_livraison !== '' && {
          frais_livraison: parseFloat(formData.frais_livraison) || 0
        }),
        items: formData.items.map(item => ({
          produit_id: parseInt(item.produit_id),
          quantite: parseInt(item.quantite),
          prix_unitaire: parseFloat(item.prix_unitaire)
        }))
      };

      console.log('📤 Données de commande à envoyer:');
      console.log('🔍 client_id:', formData.client_id, typeof formData.client_id);
      console.log('🔍 selectedClient:', selectedClient);
      console.log('🔍 orderData complet:', JSON.stringify(orderData, null, 2));

      const response = await orderService.create(orderData);
      console.log('✅ Réponse de création de commande:', response);
      
      toast.success('Commande créée avec succès !');
      triggerDashboardUpdate();
      navigate('/orders');
      
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      console.error('❌ Réponse d\'erreur:', error.response?.data);
      console.error('❌ Status de l\'erreur:', error.response?.status);
      console.error('❌ Message d\'erreur:', error.message);
      
      // Afficher un message d'erreur plus spécifique
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erreur lors de la création de la commande';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-dark-300">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-6 py-8"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/orders')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Retour</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <ShoppingCart className="text-primary-400" size={32} />
                <span>Nouvelle Commande</span>
              </h1>
              <p className="text-dark-300 mt-1">Créer une nouvelle commande client</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sélection du client */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-dark-700 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <User className="text-primary-400" size={20} />
                  <span>Informations Client</span>
                </h3>

                <div className="space-y-4">
                  <div ref={clientSearchRef}>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Rechercher un client
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 pointer-events-none" size={20} />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          console.log('📝 onChange clientSearch:', e.target.value);
                          setClientSearch(e.target.value);
                        }}
                        onFocus={() => {
                          console.log('🎯 onFocus - Ouverture de la liste');
                          setClientInputFocused(true);
                          setShowClientList(true);
                        }}
                        onBlur={() => {
                          console.log('👋 onBlur - Fermeture différée');
                          // Délai pour permettre le clic sur un client
                          setTimeout(() => setClientInputFocused(false), 200);
                        }}
                        placeholder="Nom, contact, téléphone ou email..."
                        className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-dark-400"
                      />
                    </div>
                  </div>

                  {showClientList && (
                    <div className="border border-dark-600 bg-dark-700 rounded-lg max-h-48 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <div
                            key={client.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🖱️ Client cliqué (mousedown):', client);
                              
                              setFormData(prev => ({ 
                                ...prev, 
                                client_id: client.id 
                              }));
                              setClientSearch(client.nom_commercial);
                              setShowClientList(false);
                              
                              console.log('✅ Client sélectionné:', client.nom_commercial);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="p-3 hover:bg-dark-600 cursor-pointer border-b border-dark-600 last:border-b-0 transition-colors select-none"
                          >
                            <div className="font-medium text-white">{client.nom_commercial}</div>
                            <div className="text-sm text-dark-300">{client.contact || client.contact_principal}</div>
                            <div className="text-sm text-dark-400">{client.telephone} • {client.email}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-dark-400">
                          {clientSearch ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedClient && (
                    <div className="bg-primary-900/20 border border-primary-700 rounded-lg p-4">
                      <h4 className="font-medium text-primary-300 mb-2">Client sélectionné</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium text-dark-200">Entreprise:</span> <span className="text-white">{selectedClient.nom_commercial}</span></div>
                        <div><span className="font-medium text-dark-200">Contact:</span> <span className="text-white">{selectedClient.contact || selectedClient.contact_principal}</span></div>
                        <div><span className="font-medium text-dark-200">Téléphone:</span> <span className="text-white">{selectedClient.telephone}</span></div>
                        <div><span className="font-medium text-dark-200">Email:</span> <span className="text-white">{selectedClient.email}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Type de livraison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-dark-700 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Package className="text-accent-400" size={20} />
                  <span>Type de livraison</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border-2 border-dark-600 rounded-lg cursor-pointer hover:bg-dark-700/50 transition-colors">
                      <input
                        type="radio"
                        name="type_livraison"
                        value="retrait_magasin"
                        checked={formData.type_livraison === 'retrait_magasin'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          type_livraison: e.target.value,
                          date_livraison_prevue: e.target.value === 'retrait_magasin' ? '' : prev.date_livraison_prevue
                        }))}
                        className="mr-3 text-green-400"
                      />
                      <div>
                        <div className="text-white font-medium">Retrait en magasin</div>
                        <div className="text-green-400 text-sm font-medium">Gratuit</div>
                        <div className="text-dark-300 text-sm">Récupérer votre commande sur place</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-dark-600 rounded-lg cursor-pointer hover:bg-dark-700/50 transition-colors">
                      <input
                        type="radio"
                        name="type_livraison"
                        value="livraison_domicile"
                        checked={formData.type_livraison === 'livraison_domicile'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_livraison: e.target.value }))}
                        className="mr-3 text-primary-400"
                      />
                      <div>
                        <div className="text-white font-medium">Livraison à domicile</div>
                        <div className="text-yellow-400 text-sm font-medium">+15% du montant</div>
                        <div className="text-dark-300 text-sm">Livraison directement chez vous</div>
                      </div>
                    </label>
                  </div>

                  {formData.type_livraison === 'livraison_domicile' && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
                      <div className="flex items-center space-x-2 text-blue-400">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">
                          Frais de livraison : {formatHTG(calculateDeliveryFees())}
                          {formData.frais_livraison === '' && ' (15% automatique)'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-2">
                          Frais de livraison personnalisés (HTG)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.frais_livraison}
                          onChange={(e) => setFormData(prev => ({ ...prev, frais_livraison: e.target.value }))}
                          placeholder={`Auto: ${formatHTG(calculateProductsTotal() * 0.15)} (15%)`}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-dark-400"
                        />
                        <p className="text-xs text-dark-400 mt-1">
                          Laissez vide pour appliquer automatiquement 15% du montant des produits
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Dates et priorité */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-dark-700 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Calendar className="text-primary-400" size={20} />
                  <span>Dates</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Date de commande
                    </label>
                    <input
                      type="date"
                      value={formData.date_commande}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_commande: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Date de livraison prévue {formData.type_livraison === 'livraison_domicile' ? '*' : '(optionnelle)'}
                    </label>
                    <input
                      type="date"
                      value={formData.date_livraison_prevue}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_livraison_prevue: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                      required={formData.type_livraison === 'livraison_domicile'}
                      disabled={formData.type_livraison === 'retrait_magasin'}
                    />
                    {formData.type_livraison === 'retrait_magasin' && (
                      <p className="text-xs text-dark-400 mt-1">
                        Pas de date nécessaire pour le retrait en magasin
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Date d'échéance (optionnelle)
                    </label>
                    <input
                      type="date"
                      value={formData.date_echeance}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                    />
                    <p className="text-xs text-dark-400 mt-1">
                      Date limite pour le paiement complet
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Produits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-dark-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Package className="text-primary-400" size={20} />
                    <span>Produits</span>
                  </h3>
                  <Button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Ajouter produit</span>
                  </Button>
                </div>

                {/* Sélecteur de produits */}
                {showProductSelector && (
                  <div className="mb-6 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">Sélectionner un produit</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowProductSelector(false);
                          setProductSearch('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                    
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 pointer-events-none" size={16} />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className="w-full pl-10 pr-4 py-2 bg-dark-600 border border-dark-500 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white placeholder-dark-400"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="p-3 bg-dark-600 border border-dark-500 rounded-lg hover:bg-primary-900/20 hover:border-primary-600 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-white">{product.nom}</div>
                              <div className="text-sm text-dark-300">{product.type_produit}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-white">{formatHTG(product.prix_unitaire)}</div>
                              <div className="text-sm text-dark-300">Stock: {product.stock_actuel}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des produits ajoutés */}
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <Package size={48} className="mx-auto mb-3 text-dark-600" />
                    <p>Aucun produit ajouté à la commande</p>
                    <p className="text-sm">Cliquez sur "Ajouter produit" pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item) => (
                      <div
                        key={item.produit_id}
                        className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg border border-dark-600"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.nom_produit}</div>
                          <div className="text-sm text-dark-300">
                            {formatHTG(item.prix_unitaire)} / {item.unite_mesure}
                          </div>
                          {item.quantite > item.stock_disponible && (
                            <div className="text-sm text-red-400 flex items-center space-x-1 mt-1">
                              <AlertCircle size={14} />
                              <span>Stock insuffisant ({item.stock_disponible} disponible)</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.produit_id, item.quantite - 1)}
                              className="w-8 h-8 rounded-full bg-dark-600 border border-dark-500 flex items-center justify-center hover:bg-dark-500 text-dark-300"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.stock_disponible}
                              value={item.quantite}
                              onChange={(e) => updateQuantity(item.produit_id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center py-1 bg-dark-600 border border-dark-500 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.produit_id, item.quantite + 1)}
                              className="w-8 h-8 rounded-full bg-dark-600 border border-dark-500 flex items-center justify-center hover:bg-dark-500 text-dark-300"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <div className="font-medium text-white">
                              {formatHTG(item.quantite * item.prix_unitaire)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeProduct(item.produit_id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-dark-700 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FileText className="text-primary-400" size={20} />
                  <span>Notes et Instructions</span>
                </h3>

                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Instructions spéciales, notes pour la livraison..."
                  rows={4}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none text-white placeholder-dark-400"
                />
              </motion.div>
            </div>

            {/* Résumé */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-dark-700 p-6 sticky top-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Calculator className="text-primary-400" size={20} />
                  <span>Résumé de la commande</span>
                </h3>

                <div className="space-y-4">
                  {/* Client */}
                  <div>
                    <div className="text-sm font-medium text-dark-200">Client</div>
                    <div className="text-white">
                      {selectedClient ? selectedClient.nom_commercial : 'Aucun client sélectionné'}
                    </div>
                  </div>

                  {/* Type de livraison */}
                  <div>
                    <div className="text-sm font-medium text-dark-200">Type de livraison</div>
                    <div className="text-white">
                      {formData.type_livraison === 'retrait_magasin' ? 
                        'Retrait en magasin (Gratuit)' : 
                        'Livraison à domicile (+15%)'
                      }
                    </div>
                  </div>

                  {/* Date de livraison */}
                  {formData.date_livraison_prevue && (
                    <div>
                      <div className="text-sm font-medium text-dark-200">Livraison prévue</div>
                      <div className="text-white">
                        {new Date(formData.date_livraison_prevue).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}

                  {/* Articles */}
                  <div>
                    <div className="text-sm font-medium text-dark-200 mb-2">Articles</div>
                    {formData.items.length === 0 ? (
                      <div className="text-dark-400 text-sm">Aucun article</div>
                    ) : (
                      <div className="space-y-2">
                        {formData.items.map((item) => (
                          <div key={item.produit_id} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <div className="text-white">{item.nom_produit}</div>
                              <div className="text-dark-300">{item.quantite} × {formatHTG(item.prix_unitaire)}</div>
                            </div>
                            <div className="font-medium text-white">
                              {formatHTG(item.quantite * item.prix_unitaire)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calculs */}
                  <div className="pt-4 border-t border-dark-600">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-300">Sous-total produits</span>
                        <span className="text-white">{formatHTG(calculateProductsTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-300">Frais de livraison</span>
                        <span className="text-white">
                          {formData.type_livraison === 'livraison_domicile' ? 
                            `${formatHTG(calculateDeliveryFees())} ${formData.frais_livraison === '' ? '(15%)' : '(personnalisé)'}` : 
                            'Gratuit'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold pt-2 border-t border-dark-600">
                        <span className="text-white">Total</span>
                        <span className="text-primary-400">{formatHTG(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      disabled={loading || formData.items.length === 0 || !formData.client_id || !formData.type_livraison}
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Créer la commande</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/orders')}
                      className="w-full"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateOrderPage;
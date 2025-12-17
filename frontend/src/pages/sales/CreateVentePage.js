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
  DollarSign,
  Search,
  AlertCircle,
  Calculator,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import venteService from '../../services/venteService';
import { clientService, productService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useTheme } from '../../contexts/ThemeContext';

const CreateVentePage = () => {
  const navigate = useNavigate();
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
  const [clientInputFocused, setClientInputFocused] = useState(false);
  const clientSearchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    methode_paiement: 'especes',
    montant_verse: '', // Montant saisi par le vendeur (remplace pourcentage_paiement)
    type_livraison: 'retrait_magasin',
    frais_livraison: 0,
    date_livraison_prevue: '',
    date_echeance: '',
    notes: '',
    items: [],
    frais_supplementaires: 0,
    raison_frais: ''
  });

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [clientsResponse, productsResponse] = await Promise.all([
          clientService.getAll(),
          productService.getAll()
        ]);
        
        const clientsData = clientsResponse?.results || clientsResponse || [];
        const productsData = productsResponse?.results || productsResponse || [];
        
        setClients(clientsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
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
        setTimeout(() => {
          setShowClientList(false);
          setClientInputFocused(false);
        }, 150);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Ouvrir automatiquement la liste quand l'utilisateur tape
  useEffect(() => {
    if (clientInputFocused) {
      setShowClientList(true);
    }
  }, [clientSearch, clientInputFocused]);

  // Filtrer les clients selon la recherche
  const filteredClients = clientSearch === '' 
    ? clients
    : clients.filter(client =>
        client.nom_commercial?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.contact?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.telephone?.includes(clientSearch) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase())
      );

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

  // Récupérer les frais de livraison manuels
  const calculateDeliveryFees = () => {
    return formData.type_livraison === 'livraison_domicile' 
      ? parseFloat(formData.frais_livraison) || 0 
      : 0;
  };

  // Calculer le montant total (produits + livraison)
  const calculateTotal = () => {
    const frais = parseFloat(formData.frais_supplementaires) || 0;
    return calculateProductsTotal() + calculateDeliveryFees() + frais;
  };

  // Calculer le montant payé (montant saisi par le vendeur)
  const calculateMontantPaye = () => {
    const montantVerse = parseFloat(formData.montant_verse) || 0;
    const total = calculateTotal();
    // Ne pas dépasser le montant total
    return Math.min(montantVerse, total);
  };

  // Calculer le pourcentage automatiquement
  const calculatePourcentage = () => {
    const total = calculateTotal();
    if (total <= 0) return 0;
    const montantVerse = parseFloat(formData.montant_verse) || 0;
    return Math.min((montantVerse / total) * 100, 100);
  };

  // Calculer le minimum 60%
  const calculateMinimum60 = () => {
    return calculateTotal() * 0.60;
  };

  // Calculer le montant restant
  const calculateMontantRestant = () => {
    return calculateTotal() - calculateMontantPaye();
  };

  // Ajouter un produit
  const addProduct = (product) => {
    const existingItem = formData.items.find(item => item.produit_id === product.id);
    
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.produit_id === product.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        )
      }));
    } else {
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
    toast.success(`${product.nom} ajouté`);
  };

  // Modifier la quantité
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

  // Supprimer un produit
  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.produit_id !== productId)
    }));
    toast.success('Produit retiré');
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.client_id) {
      toast.error('Veuillez sélectionner un client');
      return false;
    }

    if (formData.items.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return false;
    }

    if (!formData.methode_paiement) {
      toast.error('Veuillez sélectionner une méthode de paiement');
      return false;
    }

    // Vérifier que la date d'échéance ne dépasse pas la date de livraison
    if (formData.date_echeance && formData.date_livraison_prevue) {
      const dateEcheance = new Date(formData.date_echeance);
      const dateLivraison = new Date(formData.date_livraison_prevue);
      if (dateEcheance > dateLivraison) {
        toast.error('La date d\'\u00e9ch\u00e9ance ne peut pas d\u00e9passer la date de livraison');
        return false;
      }
    }

    // Vérifier le minimum 60% si paiement partiel
    const montantVerse = parseFloat(formData.montant_verse) || 0;
    const total = calculateTotal();
    const minimum60 = total * 0.60;
    
    if (montantVerse > 0 && montantVerse < total && montantVerse < minimum60) {
      toast.error(`Le premier paiement doit \u00eatre d'au moins 60% du montant total (${formatHTG(minimum60)})`);
      return false;
    }

    // Vérifier les stocks
    for (const item of formData.items) {
      if (item.quantite > item.stock_disponible) {
        toast.error(`Stock insuffisant pour ${item.nom_produit}`);
        return false;
      }
    }

    return true;
  };

  // Soumettre la vente
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const montantTotal = calculateTotal();
      const montantVerse = parseFloat(formData.montant_verse) || 0;
      const pourcentage = calculatePourcentage();
      const montantPaye = calculateMontantPaye();

      // Si paiement < 100%, créer une commande
      if (montantVerse < montantTotal) {
        const pourcentageNote = pourcentage > 0 ? `Paiement initial: ${pourcentage.toFixed(0)}% (${montantPaye.toFixed(2)} HTG sur ${montantTotal.toFixed(2)} HTG)` : 'Aucun paiement initial';
        const commandeData = {
          client_id: parseInt(formData.client_id),
          type_livraison: formData.type_livraison || 'retrait_magasin',
          frais_livraison: parseFloat(formData.frais_livraison) || 0,
          date_livraison_prevue: formData.date_livraison_prevue || null,
          date_echeance: formData.date_echeance || null,
          notes: formData.notes || pourcentageNote,
          items: formData.items.map(item => ({
            produit_id: parseInt(item.produit_id),
            quantite: parseInt(item.quantite),
            prix_unitaire: parseFloat(item.prix_unitaire)
          }))
        };

        // Utiliser l'URL dynamique basée sur l'hostname actuel
        const apiBaseUrl = `http://${window.location.hostname}:8000/api`;
        
        const commandeResponse = await fetch(`${apiBaseUrl}/orders/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(commandeData)
        });

        if (!commandeResponse.ok) {
          throw new Error('Erreur lors de la création de la commande');
        }

        const commandeCreated = await commandeResponse.json();

        // Ajouter le paiement si > 0%
        if (montantPaye > 0) {
          const paiementResponse = await fetch(`${apiBaseUrl}/orders/${commandeCreated.id}/paiement/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
              montant: montantPaye,
              methode: formData.methode_paiement || 'especes',
              notes: `Paiement initial: ${pourcentage.toFixed(0)}% du montant total`
            })
          });

          if (!paiementResponse.ok) {
            console.error('Erreur lors de l\'enregistrement du paiement');
            toast.error('Commande créée mais erreur lors de l\'enregistrement du paiement');
          }
        }

        toast.success(`Commande créée avec succès (${pourcentage}% payé)`);
        navigate('/orders');
        return;
      }

      // Si paiement = 100%, créer une vente normale
      const venteData = {
        client: parseInt(formData.client_id),
        methode_paiement: formData.methode_paiement || 'especes',
        montant_total: montantTotal,
        montant_paye: montantTotal,
        type_livraison: formData.type_livraison || 'retrait_magasin',
        frais_livraison: parseFloat(formData.frais_livraison) || 0,
        date_livraison_prevue: formData.date_livraison_prevue || null,
        notes: formData.notes || '',
        date_echeance: formData.date_echeance || null,
        remise_pourcentage: 0,
        remise_montant: 0,
        frais_supplementaires: parseFloat(formData.frais_supplementaires) || 0,
        raison_frais: formData.raison_frais || '',
        lignes: formData.items.map(item => ({
          produit: parseInt(item.produit_id),
          quantite: parseFloat(item.quantite),
          prix_unitaire: parseFloat(item.prix_unitaire),
        })),
      };

      await venteService.createVente(venteData);
      toast.success('Vente créée avec succès (100% payé)');
      triggerDashboardUpdate();
      navigate('/sales');
    } catch (error) {
      console.error('Erreur création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
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
              onClick={() => navigate('/sales')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Retour</span>
            </Button>
            <div>
              <h1 className={`text-3xl font-bold flex items-center space-x-3 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <DollarSign className="text-primary-400" size={32} />
                <span>Nouvelle Vente</span>
              </h1>
              <p className={`mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Créer une nouvelle vente client</p>
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
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <User className="text-primary-400" size={20} />
                  <span>Informations Client</span>
                </h3>

                <div className="space-y-4">
                  <div ref={clientSearchRef}>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>
                      Rechercher un client
                    </label>
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} size={20} />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onFocus={() => {
                          setClientInputFocused(true);
                          setShowClientList(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setClientInputFocused(false), 200);
                        }}
                        placeholder="Nom, contact, téléphone ou email..."
                        className={`w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border border-dark-600 text-white placeholder-dark-400'}`}
                      />
                    </div>
                  </div>

                  {showClientList && (
                    <div className={`rounded-lg max-h-48 overflow-y-auto ${theme === 'light' ? 'border border-slate-200 bg-white' : 'border border-dark-600 bg-dark-700'}`}>
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <div
                            key={client.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData(prev => ({ 
                                ...prev, 
                                client_id: client.id 
                              }));
                              setClientSearch(client.nom_commercial);
                              setShowClientList(false);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={`p-3 cursor-pointer last:border-b-0 transition-colors select-none ${theme === 'light' ? 'hover:bg-slate-100 border-b border-slate-200' : 'hover:bg-dark-600 border-b border-dark-600'}`}
                          >
                            <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{client.nom_commercial}</div>
                            <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>{client.contact}</div>
                            <div className={`text-sm ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`}>{client.telephone} • {client.email}</div>
                          </div>
                        ))
                      ) : (
                        <div className={`p-3 text-center ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`}>
                          {clientSearch ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Rien ici, la fiche client sera affichée en dehors */}
                </div>
              </motion.div>

              {/* Fiche Client après la section Informations Client */}
              {selectedClient && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-primary-50 border border-primary-200' : 'bg-primary-900/20 border border-primary-700'}`}
                >
                  <h4 className="font-medium text-primary-300 mb-2">Client sélectionné</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-dark-200'}`}>Entreprise:</span> <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{selectedClient.nom_commercial}</span></div>
                    <div><span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-dark-200'}`}>Contact:</span> <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{selectedClient.contact}</span></div>
                    <div><span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-dark-200'}`}>Téléphone:</span> <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{selectedClient.telephone}</span></div>
                    <div><span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-dark-200'}`}>Email:</span> <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{selectedClient.email}</span></div>
                  </div>
                </motion.div>
              )}

              {/* Produits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
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
                  <div className={`mb-6 p-4 rounded-lg border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-dark-700/50 border-dark-600'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Sélectionner un produit</h4>
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
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} size={16} />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-600 border border-dark-500 text-white placeholder-dark-400'}`}
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${theme === 'light' ? 'bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300' : 'bg-dark-600 border border-dark-500 hover:bg-primary-900/20 hover:border-primary-600'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{product.nom}</div>
                              <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>{product.type_produit}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{formatHTG(product.prix_unitaire)}</div>
                              <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Stock: {product.stock_actuel}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des produits ajoutés */}
                {formData.items.length === 0 ? (
                  <div className={`text-center py-8 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`}>
                    <Package size={48} className={`mx-auto mb-3 ${theme === 'light' ? 'text-slate-300' : 'text-dark-600'}`} />
                    <p>Aucun produit ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter produit" pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item) => (
                      <div
                        key={item.produit_id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-dark-700/50 border-dark-600'}`}
                      >
                        <div className="flex-1">
                          <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.nom_produit}</div>
                          <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
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
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-200 border border-slate-300 hover:bg-slate-300 text-slate-600' : 'bg-dark-600 border border-dark-500 hover:bg-dark-500 text-dark-300'}`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.stock_disponible}
                              value={item.quantite}
                              onChange={(e) => updateQuantity(item.produit_id, parseInt(e.target.value) || 1)}
                              className={`w-16 text-center py-1 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-dark-600 border border-dark-500 text-white'}`}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.produit_id, item.quantite + 1)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-200 border border-slate-300 hover:bg-slate-300 text-slate-600' : 'bg-dark-600 border border-dark-500 hover:bg-dark-500 text-dark-300'}`}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
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

              {/* Méthode de paiement et pourcentage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <DollarSign className="text-accent-400" size={20} />
                  <span>Paiement</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>
                      Méthode de paiement *
                    </label>
                    <select
                      value={formData.methode_paiement}
                      onChange={(e) => setFormData(prev => ({ ...prev, methode_paiement: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-dark-700 border border-dark-600 text-white'}`}
                      required
                    >
                      <option value="especes">Espèces</option>
                      <option value="carte">Carte bancaire</option>
                      <option value="virement">Virement</option>
                      <option value="cheque">Chèque</option>
                      <option value="mobile">Paiement mobile</option>
                      <option value="credit">Crédit</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>
                      Montant versé (HTG) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={calculateTotal()}
                      value={formData.montant_verse}
                      onChange={(e) => setFormData(prev => ({ ...prev, montant_verse: e.target.value }))}
                      placeholder={`Total: ${formatHTG(calculateTotal())}`}
                      className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-dark-700 border border-dark-600 text-white'}`}
                    />
                    <div className="mt-2 space-y-1">
                      <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                        Pourcentage: <span className="text-primary-400 font-bold">{calculatePourcentage().toFixed(0)}%</span>
                        {calculatePourcentage() < 100 && calculatePourcentage() > 0 && (
                          <span className="text-warning-400 ml-2">
                            (Minimum 60%: {formatHTG(calculateMinimum60())})
                          </span>
                        )}
                      </p>
                      <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                        {parseFloat(formData.montant_verse || 0) >= calculateTotal()
                          ? <span className="text-green-400">✓ Sera créée comme vente (100% payé)</span>
                          : parseFloat(formData.montant_verse || 0) > 0
                            ? <span className="text-warning-400">⚠ Sera créée comme commande (paiement partiel)</span>
                            : <span className="text-red-400">⚠ Aucun paiement - Sera créée comme commande impayée</span>
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {parseFloat(formData.montant_verse || 0) < calculateTotal() && parseFloat(formData.montant_verse || 0) > 0 && (
                  <div className="mt-4 p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-warning-400">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">
                        Paiement partiel ({calculatePourcentage().toFixed(0)}%) - Cette transaction sera enregistrée comme commande
                      </span>
                    </div>
                    {parseFloat(formData.montant_verse || 0) < calculateMinimum60() && (
                      <p className="text-red-400 text-xs mt-2">
                        ⚠ Le premier paiement doit être d'au moins 60% ({formatHTG(calculateMinimum60())})
                      </p>
                    )}
                  </div>
                )}

                {parseFloat(formData.montant_verse || 0) === 0 && calculateTotal() > 0 && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">
                        Aucun paiement initial - Le client devra verser au moins 60% pour valider
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Type de livraison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <Package className="text-accent-400" size={20} />
                  <span>Type de livraison</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${theme === 'light' ? 'border-slate-200 hover:bg-slate-50' : 'border-dark-600 hover:bg-dark-700/50'}`}>
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
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Retrait en magasin</div>
                        <div className="text-green-400 text-sm font-medium">Gratuit</div>
                        <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Récupérer votre commande sur place</div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${theme === 'light' ? 'border-slate-200 hover:bg-slate-50' : 'border-dark-600 hover:bg-dark-700/50'}`}>
                      <input
                        type="radio"
                        name="type_livraison"
                        value="livraison_domicile"
                        checked={formData.type_livraison === 'livraison_domicile'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_livraison: e.target.value }))}
                        className="mr-3 text-primary-400"
                      />
                      <div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Livraison à domicile</div>
                        <div className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Livraison directement chez vous</div>
                      </div>
                    </label>
                  </div>

                  {formData.type_livraison === 'livraison_domicile' && (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>
                          Frais de livraison (HTG) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.frais_livraison}
                          onChange={(e) => setFormData(prev => ({ ...prev, frais_livraison: e.target.value }))}
                          placeholder="0.00"
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-dark-700 border border-dark-600 text-white'}`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>
                          Date de livraison prévue *
                        </label>
                        <input
                          type="date"
                          value={formData.date_livraison_prevue}
                          onChange={(e) => setFormData(prev => ({ ...prev, date_livraison_prevue: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Date d'échéance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <Calendar className="text-primary-400" size={20} />
                  <span>Date d'échéance</span>
                </h3>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>
                    Date d'échéance (optionnelle)
                  </label>
                  <input
                    type="date"
                    value={formData.date_echeance}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-dark-700 border border-dark-600 text-white'}`}
                  />
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <FileText className="text-primary-400" size={20} />
                  <span>Notes</span>
                </h3>

                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes, instructions spéciales..."
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none ${theme === 'light' ? 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-dark-700 border border-dark-600 text-white placeholder-dark-400'}`}
                />
              </motion.div>
            </div>

            {/* Résumé */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`backdrop-blur-sm rounded-xl shadow-lg p-6 sticky top-6 ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-dark-800/50 border border-dark-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  <Calculator className="text-primary-400" size={20} />
                  <span>Résumé</span>
                </h3>

                <div className="space-y-4">
                  {/* Client */}
                  <div>
                    <div className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>Client</div>
                    <div className={theme === 'light' ? 'text-slate-800' : 'text-white'}>
                      {selectedClient ? selectedClient.nom_commercial : 'Aucun client sélectionné'}
                    </div>
                  </div>

                  {/* Méthode de paiement */}
                  <div>
                    <div className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>Méthode de paiement</div>
                    <div className={`capitalize ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                      {formData.methode_paiement || 'Non définie'}
                    </div>
                  </div>

                  {/* Articles */}
                  <div>
                    <div className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-200'}`}>Articles</div>
                    {formData.items.length === 0 ? (
                      <div className={`text-sm ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`}>Aucun article</div>
                    ) : (
                      <div className="space-y-2">
                        {formData.items.map((item) => (
                          <div key={item.produit_id} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <div className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{item.nom_produit}</div>
                              <div className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>{item.quantite} × {formatHTG(item.prix_unitaire)}</div>
                            </div>
                            <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                              {formatHTG(item.quantite * item.prix_unitaire)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calculs */}
                  <div className={`pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-dark-600'}`}>
                    <div className="space-y-2">
                      {/* Sous-total et frais de livraison */}
                      <div className="flex justify-between text-sm">
                        <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>Sous-total produits</span>
                        <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{formatHTG(calculateProductsTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>Frais de livraison</span>
                        <span className={formData.type_livraison === 'livraison_domicile' ? "text-warning-400" : "text-green-400"}>
                          {formData.type_livraison === 'livraison_domicile' 
                            ? formatHTG(calculateDeliveryFees())
                            : 'Gratuit'}
                        </span>
                      </div>
                      
                      {/* Total */}
                      <div className={`flex justify-between text-lg font-semibold pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
                        <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>Total</span>
                        <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{formatHTG(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>Montant payé ({calculatePourcentage().toFixed(0)}%)</span>
                        <span className="text-green-400">{formatHTG(calculateMontantPaye())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>Montant restant</span>
                        <span className="text-warning-400">{formatHTG(calculateMontantRestant())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      disabled={loading || formData.items.length === 0 || !formData.client_id || !formData.methode_paiement}
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Créer {parseFloat(formData.montant_verse || 0) < calculateTotal() ? 'la commande' : 'la vente'}</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/sales')}
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

export default CreateVentePage;

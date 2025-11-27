import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Clock, 
  User, 
  Package, 
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deliveryService } from '../../services/api.js';

const DeliveryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [id]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getById(id);
      console.log('📦 Détails de la livraison:', response);
      
      // Mapper les données pour correspondre à la structure attendue
      const mappedDelivery = {
        id: response.id,
        numero_livraison: `LIV-${response.id.toString().padStart(4, '0')}`,
        numero_commande: response.numero_commande || `CMD-${response.id.toString().padStart(4, '0')}`,
        client: {
          nom: response.client?.raison_sociale || response.client?.nom || 'Client inconnu',
          contact: response.client?.contact || 'Non spécifié',
          telephone: response.client?.telephone || 'Non spécifié',
          email: response.client?.email || 'Non spécifié',
          adresse: response.client?.adresse || 'Adresse non spécifiée'
        },
        date_livraison: response.date_livraison_prevue || response.date_creation,
        date_livraison_effective: response.date_livraison_effective,
        statut: response.statut,
        livreur: response.livreur || 'Non assigné',
        vehicule: 'N/A', // À ajouter au modèle si nécessaire
        items: response.items || [],
        total: parseFloat(response.montant_total || response.montant_produits || 0),
        notes: response.notes || '',
        adresse: response.adresse_livraison || response.client?.adresse || 'Adresse non spécifiée',
        type_livraison: response.type_livraison || 'retrait_magasin',
        vendeur_nom: response.vendeur_nom_complet || response.vendeur_nom || 'Système'
      };
      
      setDelivery(mappedDelivery);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast.error('Erreur lors du chargement des détails de la livraison');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'livree': return 'text-green-400 bg-green-400/20';
      case 'en_livraison': return 'text-orange-400 bg-orange-400/20';
      case 'en_preparation': return 'text-blue-400 bg-blue-400/20';
      case 'validee': return 'text-purple-400 bg-purple-400/20';
      case 'annulee': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'livree': return 'Livrée';
      case 'en_livraison': return 'En livraison';
      case 'en_preparation': return 'En préparation';
      case 'validee': return 'Validée';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleContactClient = () => {
    console.log('🔔 Bouton Contacter le client cliqué');
    console.log('📦 Delivery data:', delivery);
    console.log('👤 Client data:', delivery?.client);
    
    if (!delivery?.client?.telephone || delivery.client.telephone === 'Non spécifié') {
      console.log('❌ Pas de numéro de téléphone');
      toast.error('Aucun numéro de téléphone pour ce client');
      return;
    }

    const phoneNumber = delivery.client.telephone.replace(/[^0-9]/g, '');
    console.log('📱 Numéro formaté:', phoneNumber);
    
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Numéro de téléphone invalide');
      return;
    }
    
    // Message personnalisé
    const clientName = delivery.client.nom || delivery.client.contact || 'Client';
    const message = `Bonjour ${clientName},

Concernant votre livraison #${delivery.numero_livraison}:
- Commande: ${delivery.numero_commande}
- Statut: ${getStatusLabel(delivery.statut)}
- Date prévue: ${formatDate(delivery.date_livraison)}
${delivery.livreur !== 'Non assigné' ? `- Livreur: ${delivery.livreur}` : ''}

Merci de votre confiance.
SYGLA-H2O`;
    
    console.log('💬 Message préparé:', message);
    
    // Créer un menu pour choisir WhatsApp ou SMS
    const choice = window.confirm('Choisir le moyen de contact:\n\nOK = WhatsApp\nAnnuler = SMS');
    console.log('✅ Choix utilisateur:', choice ? 'WhatsApp' : 'SMS');
    
    if (choice) {
      // WhatsApp - format international sans le +
      let whatsappNumber = phoneNumber;
      if (!phoneNumber.startsWith('509')) {
        whatsappNumber = '509' + phoneNumber; // Ajouter le code pays Haïti
      }
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      console.log('🔗 WhatsApp URL:', whatsappUrl);
      window.open(whatsappUrl, '_blank');
      toast.success('Ouverture de WhatsApp...');
    } else {
      // SMS
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      console.log('🔗 SMS URL:', smsUrl);
      window.location.href = smsUrl;
      toast.success('Ouverture de l\'application SMS...');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-dark-300">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Livraison non trouvée</h2>
          <p className="text-dark-300 mb-4">Cette livraison n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate('/deliveries')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retour aux livraisons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec bouton retour */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate('/deliveries')}
              className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Truck className="w-8 h-8 mr-3 text-primary-400" />
                Détails de la Livraison
              </h1>
              <p className="text-dark-300 mt-1">{delivery.numero_livraison}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.statut)}`}>
            {getStatusLabel(delivery.statut)}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de la commande */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-primary-400" />
                Informations de la Commande
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dark-300 text-sm">Numéro de commande</label>
                  <p className="text-white font-medium">{delivery.numero_commande}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm">Type de livraison</label>
                  <p className="text-white font-medium">
                    {delivery.type_livraison === 'livraison_domicile' ? 'Livraison à domicile' : 'Retrait en magasin'}
                  </p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm">Vendeur</label>
                  <p className="text-white font-medium">{delivery.vendeur_nom}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm">Montant total</label>
                  <p className="text-white font-medium">{delivery.total.toLocaleString()} HTG</p>
                </div>
              </div>
            </motion.div>

            {/* Informations client */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-400" />
                Informations Client
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dark-300 text-sm">Nom du client</label>
                  <p className="text-white font-medium">{delivery.client.nom}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm">Contact</label>
                  <p className="text-white font-medium">{delivery.client.contact}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Téléphone
                  </label>
                  <p className="text-white font-medium">{delivery.client.telephone}</p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="text-white font-medium">{delivery.client.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-dark-300 text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Adresse de livraison
                  </label>
                  <p className="text-white font-medium">{delivery.adresse}</p>
                </div>
              </div>
            </motion.div>

            {/* Articles de la commande */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-primary-400" />
                Articles Commandés
              </h2>
              
              {delivery.items && delivery.items.length > 0 ? (
                <div className="space-y-3">
                  {delivery.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-dark-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.produit_nom || 'Produit'}</p>
                        <p className="text-dark-300 text-sm">Quantité: {item.quantite}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{item.prix_unitaire} HTG/unité</p>
                        <p className="text-primary-400 font-semibold">{item.sous_total} HTG</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-300 text-center py-4">Aucun article disponible</p>
              )}
            </motion.div>

            {/* Notes */}
            {delivery.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Notes</h2>
                <p className="text-dark-300">{delivery.notes}</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations de livraison */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-primary-400" />
                Livraison
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-dark-300 text-sm">Livreur</label>
                  <p className="text-white font-medium">{delivery.livreur}</p>
                </div>
                
                <div>
                  <label className="text-dark-300 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Date prévue
                  </label>
                  <p className="text-white font-medium">{formatDate(delivery.date_livraison)}</p>
                </div>
                
                {delivery.date_livraison_effective && (
                  <div>
                    <label className="text-dark-300 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Date effective
                    </label>
                    <p className="text-white font-medium">{formatDate(delivery.date_livraison_effective)}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions rapides */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={handleContactClient}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contacter le client
                </button>
                <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  Mettre à jour le statut
                </button>
                <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Marquer comme livrée
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailPage;

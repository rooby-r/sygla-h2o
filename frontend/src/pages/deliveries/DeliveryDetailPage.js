import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  User, 
  Package, 
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Navigation,
  MessageSquare,
  RefreshCw,
  X,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deliveryService } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const DeliveryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        // Informations de vente si la commande a été convertie
        convertie_en_vente: response.convertie_en_vente || false,
        numero_vente: response.numero_vente_associee || null,
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
        frais_livraison: parseFloat(response.frais_livraison || 0),
        montant_produits: parseFloat(response.montant_produits || 0),
        montant_paye: parseFloat(response.montant_paye || 0),
        montant_restant: parseFloat(response.montant_restant || 0),
        statut_paiement: response.statut_paiement || 'impaye',
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

  // Marquer comme livrée
  const handleMarkAsDelivered = async () => {
    if (!window.confirm('Confirmer que cette livraison a été effectuée ?')) {
      return;
    }
    
    try {
      setUpdating(true);
      console.log('✅ Marquage comme livrée...');
      
      // Utiliser l'endpoint spécifique pour marquer comme livrée
      const response = await deliveryService.markAsDelivered(id, {
        date_livraison_effective: new Date().toISOString()
      });
      console.log('✅ Réponse:', response);
      
      // Mettre à jour localement
      setDelivery(prev => ({ 
        ...prev, 
        statut: 'livree',
        date_livraison_effective: new Date().toISOString()
      }));
      
      toast.success('🎉 Livraison terminée avec succès !');
      
      // Recharger les données
      fetchDeliveryDetails();
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme livrée:', error);
      // Fallback: utiliser updateStatus directement si markAsDelivered échoue
      try {
        await deliveryService.updateStatus(id, 'livree');
        setDelivery(prev => ({ ...prev, statut: 'livree' }));
        toast.success('Livraison terminée avec succès !');
        fetchDeliveryDetails();
      } catch (fallbackError) {
        toast.error('Erreur lors de la finalisation de la livraison');
      }
    } finally {
      setUpdating(false);
    }
  };

  // Imprimer le reçu de livraison
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Reçu de Livraison - ${delivery.numero_livraison}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            color: black;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 12px;
            color: #666;
          }
          .receipt-info {
            text-align: center;
            margin-bottom: 15px;
          }
          .receipt-number {
            font-size: 16px;
            font-weight: bold;
          }
          .date {
            font-size: 11px;
            color: #666;
          }
          .section {
            margin-bottom: 15px;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 10px;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .info-row .label {
            color: #666;
          }
          .info-row .value {
            font-weight: bold;
            text-align: right;
            max-width: 50%;
          }
          .items-table {
            width: 100%;
            font-size: 11px;
          }
          .items-table th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            font-size: 10px;
          }
          .items-table td {
            padding: 5px 0;
            vertical-align: top;
          }
          .items-table .qty {
            text-align: center;
            width: 30px;
          }
          .items-table .price {
            text-align: right;
            width: 70px;
          }
          .total-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .grand-total {
            font-size: 18px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
          }
          .status-livree { background: #d4edda; color: #155724; }
          .status-en_livraison { background: #fff3cd; color: #856404; }
          .status-validee { background: #e2d5f1; color: #5a2d82; }
          .status-en_preparation { background: #cce5ff; color: #004085; }
          .status-annulee { background: #f8d7da; color: #721c24; }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #000;
            font-size: 10px;
          }
          .footer .thanks {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .signature-area {
            margin-top: 20px;
            border-top: 1px dashed #ccc;
            padding-top: 15px;
          }
          .signature-line {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 10px;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">💧 SYGLA-H2O</div>
          <div class="subtitle">Eau Potable & Glace de Qualité</div>
        </div>

        <div class="receipt-info">
          <div class="receipt-number">${delivery.numero_livraison}</div>
          <div class="date">Imprimé le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <span class="status-badge status-${delivery.statut}">${getStatusLabel(delivery.statut)}</span>
        </div>

        ${delivery.convertie_en_vente && delivery.numero_vente ? `
        <div class="section">
          <div class="section-title">🧾 VENTE</div>
          <div class="info-row">
            <span class="label">N° Vente:</span>
            <span class="value">${delivery.numero_vente}</span>
          </div>
          <div class="info-row">
            <span class="label">N° Commande origine:</span>
            <span class="value">${delivery.numero_commande}</span>
          </div>
          <div class="info-row">
            <span class="label">Type:</span>
            <span class="value">${delivery.type_livraison === 'livraison_domicile' ? 'Livraison' : 'Retrait'}</span>
          </div>
          <div class="info-row">
            <span class="label">Vendeur:</span>
            <span class="value">${delivery.vendeur_nom}</span>
          </div>
          <div class="info-row">
            <span class="label">Statut paiement:</span>
            <span class="value" style="color: #155724;">✓ PAYÉ</span>
          </div>
        </div>
        ` : `
        <div class="section">
          <div class="section-title">📦 COMMANDE</div>
          <div class="info-row">
            <span class="label">N° Commande:</span>
            <span class="value">${delivery.numero_commande}</span>
          </div>
          <div class="info-row">
            <span class="label">Type:</span>
            <span class="value">${delivery.type_livraison === 'livraison_domicile' ? 'Livraison' : 'Retrait'}</span>
          </div>
          <div class="info-row">
            <span class="label">Vendeur:</span>
            <span class="value">${delivery.vendeur_nom}</span>
          </div>
          <div class="info-row">
            <span class="label">Statut paiement:</span>
            <span class="value" style="color: ${delivery.statut_paiement === 'paye' ? '#155724' : delivery.statut_paiement === 'paye_partiel' ? '#856404' : '#721c24'};">
              ${delivery.statut_paiement === 'paye' ? '✓ PAYÉ' : delivery.statut_paiement === 'paye_partiel' ? '⏳ PARTIEL' : '✗ IMPAYÉ'}
            </span>
          </div>
        </div>
        `}

        <div class="section">
          <div class="section-title">👤 Client</div>
          <div class="info-row">
            <span class="label">Nom:</span>
            <span class="value">${delivery.client.nom}</span>
          </div>
          <div class="info-row">
            <span class="label">Tél:</span>
            <span class="value">${delivery.client.telephone}</span>
          </div>
          <div class="info-row">
            <span class="label">Adresse:</span>
            <span class="value">${delivery.adresse}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🚚 Livraison</div>
          <div class="info-row">
            <span class="label">Livreur:</span>
            <span class="value">${delivery.livreur && delivery.livreur !== 'Non assigné' ? delivery.livreur : (user?.role === 'livreur' ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email) : 'Non assigné')}</span>
          </div>
          <div class="info-row">
            <span class="label">Date prévue:</span>
            <span class="value">${formatDate(delivery.date_livraison)}</span>
          </div>
          ${delivery.date_livraison_effective ? `
          <div class="info-row">
            <span class="label">Date effective:</span>
            <span class="value">${formatDate(delivery.date_livraison_effective)}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">📋 Articles</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th class="qty">Qté</th>
                <th class="price">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${delivery.items && delivery.items.length > 0 
                ? delivery.items.map(item => `
                  <tr>
                    <td>${item.produit_nom || 'Produit'}</td>
                    <td class="qty">${item.quantite}</td>
                    <td class="price">${Number(item.sous_total).toLocaleString()} HTG</td>
                  </tr>
                `).join('')
                : '<tr><td colspan="3" style="text-align:center">Aucun article</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="total-section">
          ${delivery.frais_livraison > 0 ? `
          <div class="info-row" style="font-size: 12px;">
            <span>Sous-total produits:</span>
            <span>${delivery.montant_produits.toLocaleString()} HTG</span>
          </div>
          <div class="info-row" style="font-size: 12px;">
            <span>Frais de livraison:</span>
            <span>${delivery.frais_livraison.toLocaleString()} HTG</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${delivery.total.toLocaleString()} HTG</span>
          </div>
          ${!delivery.convertie_en_vente ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;">
            <div class="info-row" style="font-size: 11px; color: #155724;">
              <span>✓ Payé:</span>
              <span>${delivery.montant_paye.toLocaleString()} HTG</span>
            </div>
            <div class="info-row" style="font-size: 11px; color: ${delivery.montant_restant > 0 ? '#721c24' : '#155724'};">
              <span>${delivery.montant_restant > 0 ? '⏳' : '✓'} Restant:</span>
              <span>${delivery.montant_restant.toLocaleString()} HTG</span>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="signature-area">
          <div class="info-row">
            <span>Reçu par:</span>
            <span>_____________________</span>
          </div>
          <div class="signature-line">Signature du client</div>
        </div>

        <div class="footer">
          <div class="thanks">Merci de votre confiance ! 🙏</div>
          <div>SYGLA-H2O - Votre partenaire en eau potable</div>
          <div>Pour toute question, contactez-nous</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print();
    };
    
    toast.success('Préparation de l\'impression...');
  };

  // Vérifier si on peut marquer comme livrée ou annuler
  // Le livreur ne peut modifier que les commandes avec statut "en_livraison"
  const canModifyStatus = () => {
    const currentStatus = delivery?.statut;
    // On peut modifier seulement si la livraison est en cours de livraison
    return currentStatus === 'en_livraison';
  };

  // Annuler la livraison
  const handleCancelDelivery = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) {
      return;
    }
    
    try {
      setUpdating(true);
      console.log('❌ Annulation de la livraison...');
      
      await deliveryService.updateStatus(id, 'annulee');
      
      setDelivery(prev => ({ ...prev, statut: 'annulee' }));
      toast.success('Livraison annulée');
      fetchDeliveryDetails();
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      toast.error('Erreur lors de l\'annulation de la livraison');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900'}`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Livraison non trouvée</h2>
          <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Cette livraison n'existe pas ou a été supprimée.</p>
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

  const canModify = canModifyStatus();

  return (
    <div className={`min-h-screen p-6 ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900'}`}>
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
              className={`p-2 rounded-lg transition-colors mr-4 ${theme === 'light' ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-200' : 'text-dark-300 hover:text-white hover:bg-dark-700'}`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <Truck className="w-8 h-8 mr-3 text-primary-400" />
                Détails de la Livraison
              </h1>
              <p className={`mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>{delivery.numero_livraison}</p>
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
              className={`backdrop-blur-sm rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800/50 border-dark-700'}`}
            >
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <Package className="w-5 h-5 mr-2 text-primary-400" />
                Informations de la Commande
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Numéro de commande</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.numero_commande}</p>
                </div>
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Type de livraison</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    {delivery.type_livraison === 'livraison_domicile' ? 'Livraison à domicile' : 'Retrait en magasin'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Vendeur</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.vendeur_nom}</p>
                </div>
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Montant total</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.total.toLocaleString()} HTG</p>
                </div>
              </div>
            </motion.div>

            {/* Informations client */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800/50 border-dark-700'}`}
            >
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <User className="w-5 h-5 mr-2 text-primary-400" />
                Informations Client
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Nom du client</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.client.nom}</p>
                </div>
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Contact</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.client.contact}</p>
                </div>
                <div>
                  <label className={`text-sm flex items-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                    <Phone className="w-4 h-4 mr-1" />
                    Téléphone
                  </label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.client.telephone}</p>
                </div>
                <div>
                  <label className={`text-sm flex items-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.client.email}</p>
                </div>
                <div className="md:col-span-2">
                  <label className={`text-sm flex items-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                    <MapPin className="w-4 h-4 mr-1" />
                    Adresse de livraison
                  </label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.adresse}</p>
                </div>
              </div>
            </motion.div>

            {/* Articles de la commande */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800/50 border-dark-700'}`}
            >
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <Package className="w-5 h-5 mr-2 text-primary-400" />
                Articles Commandés
              </h2>
              
              {delivery.items && delivery.items.length > 0 ? (
                <div className="space-y-3">
                  {delivery.items.map((item, index) => (
                    <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${theme === 'light' ? 'bg-slate-100' : 'bg-dark-700/50'}`}>
                      <div>
                        <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.produit_nom || 'Produit'}</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Quantité: {item.quantite}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{item.prix_unitaire} HTG/unité</p>
                        <p className="text-primary-400 font-semibold">{item.sous_total} HTG</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-4 ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Aucun article disponible</p>
              )}
            </motion.div>

            {/* Notes */}
            {delivery.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`backdrop-blur-sm rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800/50 border-dark-700'}`}
              >
                <h2 className={`text-xl font-semibold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Notes</h2>
                <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>{delivery.notes}</p>
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
              className={`backdrop-blur-sm rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800/50 border-dark-700'}`}
            >
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <Navigation className="w-5 h-5 mr-2 text-primary-400" />
                Livraison
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>Livreur</label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{delivery.livreur}</p>
                </div>
                
                <div>
                  <label className={`text-sm flex items-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                    <Calendar className="w-4 h-4 mr-1" />
                    Date prévue
                  </label>
                  <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{formatDate(delivery.date_livraison)}</p>
                </div>
                
                {delivery.date_livraison_effective && (
                  <div>
                    <label className={`text-sm flex items-center ${theme === 'light' ? 'text-slate-500' : 'text-dark-300'}`}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Date effective
                    </label>
                    <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{formatDate(delivery.date_livraison_effective)}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions rapides */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800/50 border-dark-700'}`}
            >
              <h2 className={`text-xl font-semibold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Actions</h2>
              
              <div className="space-y-3">
                {/* Bouton Imprimer le reçu - seulement si livraison effectuée */}
                {delivery.statut === 'livree' && (
                  <button 
                    onClick={handlePrintReceipt}
                    className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer le reçu
                  </button>
                )}

                <button 
                  onClick={handleContactClient}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contacter le client
                </button>
                
                {/* Bouton Marquer comme livrée - masqué pour le rôle stock */}
                {canModify && user?.role !== 'stock' && (
                  <button 
                    onClick={handleMarkAsDelivered}
                    disabled={updating}
                    className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Marquer comme livrée
                  </button>
                )}
                
                {/* Bouton Annuler la livraison - masqué une fois la commande validée/en préparation */}
                {/* Les commandes validées ou en préparation ne peuvent plus être annulées */}

                {/* Message si livraison terminée ou annulée */}
                {(delivery.statut === 'livree' || delivery.statut === 'annulee') && (
                  <div className={`p-3 rounded-lg text-center ${
                    delivery.statut === 'livree' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {delivery.statut === 'livree' ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Livraison terminée</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <X className="w-5 h-5" />
                        <span>Livraison annulée</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailPage;

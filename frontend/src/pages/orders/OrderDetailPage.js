import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  User, 
  Package, 
  FileText,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Phone,
  Mail,
  Printer,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { orderService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useAuth } from '../../hooks/useAuth';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerDashboardUpdate, updateTrigger } = useDataUpdate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementData, setPaiementData] = useState({
    montant: '',
    methode: 'especes',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    console.log('OrderDetailPage useEffect triggered:', {
      id,
      updateTrigger,
      locationKey: location.key,
      locationState: location.state
    });
    
    // Réinitialiser l'état local avant le rechargement
    setOrder(null);
    setLoading(true);
    setError(null);
    
    // Vérifier que l'ID est valide
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ ID de commande invalide:', id);
      setError('ID de commande invalide');
      setLoading(false);
      return;
    }
    
    fetchOrderDetails(true); // Force reload toujours
  }, [id, updateTrigger, location.key, location.state?.timestamp]); // Ajouter timestamp pour recharger après modification

  const fetchOrderDetails = async (forceReload = false) => {
    try {
      setLoading(true);
      if (forceReload) {
        console.log('🔄 Rechargement forcé des données de commande avec cache-busting');
      }
      
      // Cache busting - ajouter un timestamp à la requête
      const timestamp = Date.now();
      const response = await orderService.getById(id, { _t: timestamp });
      console.log('✅ Order data received:', response);
      console.log('✅ Order total should be:', response.total_ht, 'HTG');
      setOrder(response);
      setError(null); // Réinitialiser l'erreur en cas de succès
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la commande:', error);
      console.error('❌ Détails erreur:', error.response?.data);
      setError('Erreur lors du chargement de la commande');
      // Ne pas afficher de toast ici - l'erreur sera gérée par l'affichage conditionnel
      console.warn('⚠️ Commande introuvable ou API non disponible');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await orderService.delete(id);
        triggerDashboardUpdate();
        toast.success('Commande supprimée avec succès');
        navigate('/orders');
      } catch (error) {
        toast.error('Erreur lors de la suppression de la commande');
      }
    }
  };

  const handleEdit = () => {
    navigate(`/orders/${id}/edit`);
  };

  const handleContactClient = () => {
    console.log('🔔 Bouton Contacter le client cliqué');
    console.log('📦 Order data:', order);
    console.log('👤 Client data:', order?.client);
    
    if (!order?.client?.telephone) {
      console.log('❌ Pas de numéro de téléphone');
      toast.error('Aucun numéro de téléphone pour ce client');
      return;
    }

    const phoneNumber = order.client.telephone.replace(/[^0-9]/g, '');
    console.log('📱 Numéro formaté:', phoneNumber);
    
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Numéro de téléphone invalide');
      return;
    }
    
    // Message personnalisé
    const clientName = order.client.nom_commercial || order.client.nom_contact || 'Client';
    const message = `Bonjour ${clientName},

Concernant votre commande #${order.numero_commande}:
- Montant total: ${formatHTG(order.montant_total)}
- Montant payé: ${formatHTG(order.montant_paye)}
- Montant restant: ${formatHTG(order.montant_restant)}

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

  const handleAddPaiement = async (e) => {
    e.preventDefault();

    if (!paiementData.montant || paiementData.montant <= 0) {
      toast.error('Montant invalide');
      return;
    }

    const montant = parseFloat(paiementData.montant);
    const montantTotal = parseFloat(order.montant_total);
    const montantRestant = parseFloat(order.montant_restant);
    const montantDejaPaye = parseFloat(order.montant_paye || 0);
    const penalite = parseFloat(order.penalite_applicable || 0);
    const montantTotalAPayer = parseFloat(order.montant_total_a_payer || montantRestant);
    
    // Vérifier minimum 60% au premier paiement
    if (montantDejaPaye === 0) {
      const minimumRequis = montantTotal * 0.60;
      if (montant < minimumRequis) {
        toast.error(`Le premier paiement doit être d'au moins 60% (${formatHTG(minimumRequis)})`);
        return;
      }
    }
    
    // Vérifier si pénalité applicable (après échéance)
    if (order.est_apres_echeance && montantRestant > 0) {
      if (montant < montantTotalAPayer) {
        toast.error(`Montant insuffisant. Vous devez payer le solde restant + pénalité (${formatHTG(montantTotalAPayer)})`);
        return;
      }
    } else {
      if (montant > montantRestant) {
        toast.error('Le montant dépasse le montant restant');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Calculer le nouveau pourcentage après ce paiement
      const nouveauMontantPaye = montantDejaPaye + Math.min(montant, montantRestant);
      const nouveauPourcentage = (nouveauMontantPaye / montantTotal) * 100;
      
      // Générer une note dynamique si aucune note n'est fournie
      let notePaiement = paiementData.notes || `Paiement: ${nouveauPourcentage.toFixed(0)}% (${nouveauMontantPaye.toFixed(2)} HTG sur ${montantTotal.toFixed(2)} HTG)`;
      
      // Ajouter info pénalité dans les notes si applicable
      if (order.est_apres_echeance && penalite > 0) {
        notePaiement += ` - Inclut pénalité de retard: ${penalite.toFixed(2)} HTG`;
      }
      
      const response = await orderService.addPaiement(id, {
        ...paiementData,
        notes: notePaiement,
        include_penalite: order.est_apres_echeance && penalite > 0
      });
      
      if (response.convertie_en_vente) {
        toast.success('Paiement complet ! La commande a été convertie en vente automatiquement 🎉');
        setTimeout(() => {
          navigate('/sales');
        }, 2000);
      } else {
        toast.success('Paiement ajouté avec succès');
        setShowPaiementModal(false);
        setPaiementData({ montant: '', methode: 'especes', reference: '', notes: '' });
        await fetchOrderDetails(true);
      }
    } catch (error) {
      console.error('Erreur ajout paiement:', error);
      const errorData = error.response?.data;
      
      // Gérer les erreurs spécifiques du backend
      if (errorData?.require_penalite) {
        toast.error(`Pénalité requise: ${formatHTG(errorData.penalite)}. Total à payer: ${formatHTG(errorData.montant_total_a_payer)}`);
      } else if (errorData?.montant_minimum) {
        toast.error(`Minimum 60% requis: ${formatHTG(errorData.montant_minimum)}`);
      } else {
        toast.error(errorData?.error || 'Erreur lors de l\'ajout du paiement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir valider cette commande ? Cette action est irréversible.')) {
      try {
        setLoading(true);
        console.log('🔄 Début validation commande:', id);
        console.log('🔑 Token présent:', !!localStorage.getItem('access_token'));
        
        const result = await orderService.validate(id);
        console.log('✅ Validation réussie:', result);
        
        triggerDashboardUpdate();
        toast.success('Commande validée avec succès');
        // Recharger les données de la commande pour afficher le nouveau statut
        await fetchOrderDetails();
      } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        console.error('❌ Détails de l\'erreur:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // Utiliser le message d'erreur amélioré du service
        let errorMessage = error.message || 'Erreur lors de la validation de la commande';
        
        // Si le message contient "Request failed", c'est un message Axios générique
        if (errorMessage.includes('Request failed with status code')) {
          if (error.response?.status === 400) {
            errorMessage = error.response?.data?.error || 'Données de commande invalides';
          } else if (error.response?.status === 500) {
            errorMessage = 'Erreur interne du serveur. Veuillez réessayer.';
          } else {
            errorMessage = `Erreur ${error.response?.status}: ${error.response?.statusText || 'Erreur inconnue'}`;
          }
        }
        
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    const statusLabels = {
      'en_attente': 'En attente',
      'annulee': 'Annulée',
      'validee': 'Validée',
      'en_preparation': 'En préparation', 
      'en_livraison': 'En livraison',
      'livree': 'Livrée'
    };

    const confirmMessage = `Êtes-vous sûr de vouloir changer le statut vers "${statusLabels[newStatus]}" ?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        // Appeler l'API pour mettre à jour le statut
        const updatedOrder = await orderService.update(id, { statut: newStatus });
        console.log('✅ Statut mis à jour:', updatedOrder);
        
        triggerDashboardUpdate();
        toast.success(`Statut changé vers "${statusLabels[newStatus]}" avec succès`);
        
        // Recharger les données de la commande
        await fetchOrderDetails();
      } catch (error) {
        console.error('❌ Erreur lors du changement de statut:', error);
        toast.error('Erreur lors du changement de statut');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrintOrder = () => {
    const printWindow = window.open('', '_blank');
    
    const currentDate = new Date().toLocaleString('fr-FR');
    const orderDate = order.date_creation ? new Date(order.date_creation).toLocaleString('fr-FR') : 'N/A';
    const deliveryDate = (() => {
      const dateToShow = order.date_livraison_prevue || order.date_creation;
      return dateToShow ? new Date(dateToShow).toLocaleString('fr-FR') : 'N/A';
    })();

    const getStatusClass = (status) => {
      switch(status) {
        case 'livree': return 'status-livree';
        case 'validee': return 'status-validee';
        case 'en_preparation': return 'status-en_preparation';
        case 'en_livraison': return 'status-en_livraison';
        case 'annulee': return 'status-annulee';
        default: return 'status-attente';
      }
    };

    const getStatusLabel = (status) => {
      switch(status) {
        case 'livree': return 'LIVRÉE';
        case 'validee': return 'VALIDÉE';
        case 'en_preparation': return 'EN PRÉPARATION';
        case 'en_livraison': return 'EN LIVRAISON';
        case 'annulee': return 'ANNULÉE';
        case 'en_attente': case 'attente': return 'EN ATTENTE';
        default: return status.toUpperCase();
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche de Commande - ${order.numero_commande}</title>
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
            font-size: 12px;
            margin-bottom: 5px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
          .payment-info {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 3px;
          }
          .payment-row.paid {
            color: #16a34a;
          }
          .payment-row.remaining {
            color: #dc2626;
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
          .status-attente { background: #fff3cd; color: #856404; }
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
          .paiements-list {
            margin-top: 10px;
            font-size: 10px;
          }
          .paiement-item {
            padding: 5px;
            margin-bottom: 5px;
            background: #f5f5f5;
            border-left: 3px solid #16a34a;
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
          <div class="receipt-number">${order.numero_commande}</div>
          <div class="date">Imprimé le: ${currentDate}</div>
          <span class="status-badge ${getStatusClass(order.statut)}">${getStatusLabel(order.statut)}</span>
        </div>

        <div class="section">
          <div class="section-title">📦 Commande</div>
          <div class="info-row">
            <span class="label">Date création:</span>
            <span class="value">${orderDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Date livraison:</span>
            <span class="value">${deliveryDate}</span>
          </div>
          ${order.date_echeance ? `
          <div class="info-row">
            <span class="label">Échéance:</span>
            <span class="value">${new Date(order.date_echeance).toLocaleDateString('fr-FR')}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="label">Type:</span>
            <span class="value">${order.type_livraison === 'livraison_domicile' ? 'Livraison' : 'Retrait'}</span>
          </div>
          <div class="info-row">
            <span class="label">Vendeur:</span>
            <span class="value">${order.vendeur_nom_complet || order.vendeur_nom || 'Système'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">👤 Client</div>
          <div class="info-row">
            <span class="label">Nom:</span>
            <span class="value">${order.client?.raison_sociale || order.client?.nom || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Contact:</span>
            <span class="value">${order.client?.contact || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Tél:</span>
            <span class="value">${order.client?.telephone || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Adresse:</span>
            <span class="value">${order.client?.adresse || 'N/A'}</span>
          </div>
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
              ${order.items?.map(item => `
                <tr>
                  <td>${item.produit_nom}</td>
                  <td class="qty">${item.quantite}</td>
                  <td class="price">${formatHTG(item.sous_total)}</td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="text-align:center">Aucun article</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Sous-total produits:</span>
            <span>${formatHTG(order.montant_produits || 0)}</span>
          </div>
          <div class="total-row">
            <span>Frais de livraison:</span>
            <span>${formatHTG(order.frais_livraison || 0)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatHTG(order.montant_total)}</span>
          </div>
          
          ${order.montant_paye > 0 || order.montant_restant > 0 ? `
          <div class="payment-info">
            <div class="payment-row paid">
              <span>✓ Payé:</span>
              <span>${formatHTG(order.montant_paye || 0)}</span>
            </div>
            <div class="payment-row ${order.montant_restant > 0 ? 'remaining' : 'paid'}">
              <span>${order.montant_restant > 0 ? '⏳' : '✓'} Restant:</span>
              <span>${formatHTG(order.montant_restant || 0)}</span>
            </div>
          </div>
          ` : ''}
        </div>

        ${order.paiements_commande && order.paiements_commande.length > 0 ? `
        <div class="section" style="margin-top: 15px;">
          <div class="section-title">💳 Paiements</div>
          <div class="paiements-list">
            ${order.paiements_commande.map(p => `
              <div class="paiement-item">
                <div style="display:flex;justify-content:space-between;">
                  <span>${new Date(p.date_paiement).toLocaleDateString('fr-FR')}</span>
                  <strong>${formatHTG(p.montant)}</strong>
                </div>
                <div style="color:#666;font-size:9px;">
                  ${p.methode === 'especes' ? 'Espèces' : p.methode === 'carte' ? 'Carte' : p.methode === 'virement' ? 'Virement' : p.methode === 'mobile' ? 'Mobile' : p.methode}
                  ${p.reference ? ` - Réf: ${p.reference}` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${order.notes ? `
        <div class="section" style="margin-top: 15px;">
          <div class="section-title">📝 Notes</div>
          <p style="font-size: 11px;">${order.notes}</p>
        </div>
        ` : ''}

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

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente':
      case 'attente':
        return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 'confirmee':
        return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
      case 'validee':
        return 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30';
      case 'en_preparation':
        return 'bg-purple-400/20 text-purple-400 border-purple-400/30';
      case 'en_livraison':
        return 'bg-orange-400/20 text-orange-400 border-orange-400/30';
      case 'livree':
        return 'bg-green-400/20 text-green-400 border-green-400/30';
      case 'annulee':
        return 'bg-red-400/20 text-red-400 border-red-400/30';
      default:
        return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'en_attente':
      case 'attente':
        return Clock;
      case 'confirmee':
        return CheckCircle;
      case 'validee':
        return CheckCircle;
      case 'en_preparation':
        return Package;
      case 'en_livraison':
        return Truck;
      case 'livree':
        return CheckCircle;
      case 'annulee':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente':
      case 'attente':
        return 'En attente';
      case 'confirmee':
        return 'Confirmée';
      case 'validee':
        return 'Validée';
      case 'en_preparation':
        return 'En préparation';
      case 'en_livraison':
        return 'En livraison';
      case 'livree':
        return 'Livrée';
      case 'annulee':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Commande introuvable</h2>
          <p className="text-dark-400 mb-6">{error || 'Cette commande n\'existe pas ou a été supprimée.'}</p>
          <Button onClick={() => navigate('/orders')} variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux commandes
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.statut);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-dark-900 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Détails de la commande</h1>
              <p className="text-dark-400">{order.numero_commande}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap">
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center border ${getStatusColor(order.statut)}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {getStatusLabel(order.statut)}
            </span>
            
            {/* Boutons de changement de statut - masqués pour le vendeur */}
            {order.statut === 'en_attente' && user?.role !== 'vendeur' && (
              <button
                onClick={() => handleStatusChange('validee')}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider</span>
              </button>
            )}
            
            {order.statut === 'validee' && user?.role !== 'vendeur' && (
              <button
                onClick={() => handleStatusChange('en_preparation')}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                <span>Préparer</span>
              </button>
            )}
            
            {order.statut === 'en_preparation' && user?.role !== 'vendeur' && (
              <button
                onClick={() => handleStatusChange('en_livraison')}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>Livrer</span>
              </button>
            )}
            
            {/* Bouton Livrée - masqué pour le rôle stock et vendeur */}
            {order.statut === 'en_livraison' && user?.role !== 'stock' && user?.role !== 'vendeur' && (
              <button
                onClick={() => handleStatusChange('livree')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Livrée</span>
              </button>
            )}
            
            {/* Bouton d'annulation - disponible seulement pour les commandes en attente */}
            {order.statut === 'en_attente' && (
              <button
                onClick={() => handleStatusChange('annulee')}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            )}
            
            {/* Boutons d'action généraux - masquer si commande annulée */}
            {order.montant_restant > 0 && !order.convertie_en_vente && order.statut !== 'annulee' && (
              <button
                onClick={() => setShowPaiementModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>Ajouter paiement</span>
              </button>
            )}
            
            {/* Boutons Modifier et Supprimer - masqués si commande validée ou au-delà */}
            {!['validee', 'en_preparation', 'en_livraison', 'livree', 'annulee'].includes(order.statut) && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations client */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-3 text-primary-400" />
                Informations Client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-dark-300 text-sm font-medium">Nom/Raison Sociale</label>
                  <p className="text-white text-lg font-medium mt-1">
                    {order.client?.raison_sociale || order.client?.nom || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm font-medium">Contact</label>
                  <p className="text-white text-lg mt-1">
                    {order.client?.contact || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm font-medium">Téléphone</label>
                  <p className="text-white text-lg mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-secondary-400" />
                    {order.client?.telephone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm font-medium">Email</label>
                  <p className="text-white text-lg mt-1 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-secondary-400" />
                    {order.client?.email || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-dark-300 text-sm font-medium">Adresse</label>
                  <p className="text-white text-lg mt-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-secondary-400" />
                    {order.client?.adresse || 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Articles commandés */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 mr-3 text-accent-400" />
                Articles Commandés ({order.items?.length || 0})
              </h3>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="bg-dark-700 rounded-lg p-4 border border-dark-600"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-lg">{item.produit_nom}</h4>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-dark-300">Quantité:</span>
                            <span className="text-white font-medium ml-2">{item.quantite}</span>
                          </div>
                          <div>
                            <span className="text-dark-300">Prix unitaire:</span>
                            <span className="text-white font-medium ml-2">{formatHTG(item.prix_unitaire)}</span>
                          </div>
                          <div>
                            <span className="text-dark-300">Sous-total:</span>
                            <span className="text-green-400 font-bold ml-2">{formatHTG(item.sous_total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total avec détails */}
              <div className="mt-6 pt-4 border-t border-dark-600">
                {/* Montant des produits */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-dark-300">Montant des produits:</span>
                  <span className="text-white">{formatHTG(order.montant_produits || 0)}</span>
                </div>
                
                {/* Frais de livraison */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-dark-300">
                    Frais de livraison
                    {order.type_livraison === 'retrait_magasin' ? ' (Gratuit)' : ''}:
                  </span>
                  <span className="text-white">{formatHTG(order.frais_livraison || 0)}</span>
                </div>
                
                {/* Total final */}
                <div className="flex justify-between items-center pt-2 border-t border-dark-600">
                  <span className="text-xl font-semibold text-white">Total de la commande:</span>
                  <span className="text-2xl font-bold text-green-400">{formatHTG(order.montant_total)}</span>
                </div>
                
                {/* Montants payé et restant */}
                {order.montant_paye > 0 && (
                  <>
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-dark-700">
                      <span className="text-base font-medium text-dark-300">Montant payé:</span>
                      <span className="text-xl font-semibold text-green-400">{formatHTG(order.montant_paye)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-medium text-dark-300">Montant restant:</span>
                      <span className={`text-xl font-semibold ${order.montant_restant > 0 ? 'text-warning-400' : 'text-green-400'}`}>
                        {formatHTG(order.montant_restant)}
                      </span>
                    </div>
                    <div className="mt-4 p-3 rounded-lg ${order.statut_paiement === 'paye' ? 'bg-green-500/10 border border-green-500/20' : 'bg-warning-500/10 border border-warning-500/20'}">
                      <div className="flex items-center space-x-2">
                        {order.statut_paiement === 'paye' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-warning-400" />
                        )}
                        <span className={`text-sm font-medium ${order.statut_paiement === 'paye' ? 'text-green-400' : 'text-warning-400'}`}>
                          {order.statut_paiement === 'paye' ? 'Entièrement payé' : 
                           order.statut_paiement === 'paye_partiel' ? `Payé à ${((order.montant_paye / order.montant_total) * 100).toFixed(0)}%` : 
                           'Non payé'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Historique des paiements */}
            {order.paiements_commande && order.paiements_commande.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-800 rounded-xl p-6 border border-dark-700"
              >
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-3 text-green-400" />
                  Historique des paiements
                </h3>
                <div className="space-y-3">
                  {order.paiements_commande.map((paiement, index) => (
                    <div key={paiement.id || index} className="p-3 bg-dark-700/50 rounded-lg border border-dark-600">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm text-dark-300">
                            {new Date(paiement.date_paiement).toLocaleString('fr-FR')}
                          </span>
                          <div className="mt-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 rounded">
                              {paiement.methode === 'especes' ? 'Espèces' :
                               paiement.methode === 'carte' ? 'Carte bancaire' :
                               paiement.methode === 'virement' ? 'Virement' :
                               paiement.methode === 'cheque' ? 'Chèque' :
                               paiement.methode === 'mobile' ? 'Paiement mobile' :
                               paiement.methode}
                            </span>
                          </div>
                        </div>
                        <span className="text-lg font-semibold text-green-400">
                          {formatHTG(paiement.montant)}
                        </span>
                      </div>
                      {paiement.notes && (
                        <p className="text-xs text-dark-400 mt-2">{paiement.notes}</p>
                      )}
                      {paiement.reference && (
                        <p className="text-xs text-dark-400 mt-1">Réf: {paiement.reference}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notes - Affichage dynamique du statut de paiement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-3 text-secondary-400" />
                Notes
              </h3>
              <div className="space-y-2">
                {/* Statut de paiement actuel */}
                <p className="text-dark-300 leading-relaxed">
                  {order.statut_paiement === 'paye_complet' ? (
                    <span className="text-green-400 font-semibold">✓ Paiement complet (100%)</span>
                  ) : order.statut_paiement === 'paye_partiel' ? (
                    <span className="text-orange-400 font-semibold">
                      Paiement: {((parseFloat(order.montant_paye) / parseFloat(order.montant_total)) * 100).toFixed(0)}% 
                      ({parseFloat(order.montant_paye).toFixed(2)} HTG sur {parseFloat(order.montant_total).toFixed(2)} HTG)
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold">Aucun paiement (0%)</span>
                  )}
                </p>
                
                {/* Notes additionnelles de la commande si elles existent */}
                {order.notes && order.notes.trim() !== '' && !order.notes.includes('Paiement') && (
                  <p className="text-dark-400 text-sm mt-2 pt-2 border-t border-dark-700">
                    {order.notes}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Informations sur les dates et statut */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-primary-400" />
                Chronologie
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-dark-300 text-sm font-medium">Date de création</label>
                  <p className="text-white text-lg mt-1">
                    {order.date_creation ? new Date(order.date_creation).toLocaleString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-dark-300 text-sm font-medium">Livraison prévue</label>
                  <p className="text-white text-lg mt-1">
                    {(() => {
                      // Pour livraison à domicile, utiliser date_livraison_prevue, sinon utiliser date_creation
                      const dateToShow = order.date_livraison_prevue || order.date_creation;
                      return dateToShow ? new Date(dateToShow).toLocaleString('fr-FR') : 'Non définie';
                    })()}
                  </p>
                </div>
                {order.date_echeance && (
                  <div>
                    <label className="text-dark-300 text-sm font-medium">Date d'échéance</label>
                    <p className={`text-lg mt-1 ${order.est_apres_echeance && order.montant_restant > 0 ? 'text-red-400 font-bold' : 'text-white'}`}>
                      {new Date(order.date_echeance).toLocaleDateString('fr-FR')}
                      {order.est_apres_echeance && order.montant_restant > 0 && (
                        <span className="text-xs ml-2">⚠️ Dépassée</span>
                      )}
                    </p>
                  </div>
                )}
                
                {/* Avertissement pénalité si échéance passée */}
                {order.est_apres_echeance && order.montant_restant > 0 && order.statut !== 'annulee' && (
                  <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <div className="flex items-center text-red-400 mb-2">
                      <XCircle className="w-5 h-5 mr-2" />
                      <span className="font-bold">Échéance dépassée</span>
                    </div>
                    <p className="text-red-300 text-sm mb-2">
                      Une pénalité de 1.5% s'applique sur le montant restant.
                    </p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-dark-300">Montant restant:</span>
                        <span className="text-white">{formatHTG(order.montant_restant)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-300">Pénalité (1.5%):</span>
                        <span className="text-red-400">+{formatHTG(order.penalite_applicable || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-red-500/30 pt-1 mt-1">
                        <span className="text-dark-300 font-bold">Total à payer:</span>
                        <span className="text-red-400 font-bold">{formatHTG(order.montant_total_a_payer || order.montant_restant)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {order.date_validation && (
                  <div>
                    <label className="text-dark-300 text-sm font-medium">Date de validation</label>
                    <p className="text-white text-lg mt-1">
                      {new Date(order.date_validation).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
                {order.date_livraison_effective && (
                  <div>
                    <label className="text-dark-300 text-sm font-medium">Livraison effective</label>
                    <p className="text-white text-lg mt-1">
                      {new Date(order.date_livraison_effective).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions rapides */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                {order.statut === 'en_attente' && (
                  <Button 
                    onClick={handleValidate} 
                    variant="success" 
                    className="w-full"
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {loading ? 'Validation en cours...' : 'Valider la commande'}
                  </Button>
                )}
                <Button 
                  onClick={handleContactClient} 
                  variant="primary" 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contacter le client
                </Button>
                <Button onClick={handlePrintOrder} variant="warning" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer la fiche
                </Button>
                {/* Boutons de modification/suppression uniquement pour les commandes en attente */}
                {order.statut === 'en_attente' && (
                  <>
                    <Button onClick={handleEdit} variant="primary" className="w-full">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier la commande
                    </Button>
                    <Button onClick={handleDelete} variant="danger" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer la commande
                    </Button>
                  </>
                )}
                <Button onClick={() => navigate('/orders')} variant="secondary" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la liste
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Modal Paiement */}
        {showPaiementModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-dark-800 p-6 rounded-xl max-w-md w-full border border-dark-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-400" />
                Ajouter un Paiement
              </h2>
              
              <div className="mb-4 p-4 bg-dark-700 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-300">Montant total:</span>
                  <span className="text-white font-semibold">{formatHTG(order.montant_total)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-300">Déjà payé:</span>
                  <span className="text-green-400 font-semibold">{formatHTG(order.montant_paye)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">Montant restant:</span>
                  <span className="text-warning-400 font-bold text-lg">{formatHTG(order.montant_restant)}</span>
                </div>
                
                {/* Afficher info minimum 60% si premier paiement */}
                {parseFloat(order.montant_paye) === 0 && (
                  <div className="mt-3 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-300 text-xs">
                      <span className="font-bold">⚡ Premier paiement:</span> Minimum 60% requis
                    </p>
                    <p className="text-blue-400 text-sm font-bold mt-1">
                      Minimum: {formatHTG(parseFloat(order.montant_total) * 0.60)}
                    </p>
                  </div>
                )}
                
                {/* Afficher pénalité si échéance dépassée */}
                {order.est_apres_echeance && order.montant_restant > 0 && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-xs font-bold">
                      ⚠️ Échéance dépassée - Pénalité applicable
                    </p>
                    <div className="text-sm space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span className="text-dark-300">Pénalité (1.5%):</span>
                        <span className="text-red-400">+{formatHTG(order.penalite_applicable || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-red-500/30 pt-1">
                        <span className="text-dark-300 font-bold">Total à payer:</span>
                        <span className="text-red-400 font-bold">{formatHTG(order.montant_total_a_payer || order.montant_restant)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleAddPaiement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Montant *
                  </label>
                  <input
                    type="number"
                    min={parseFloat(order.montant_paye) === 0 ? (parseFloat(order.montant_total) * 0.60).toFixed(2) : "0.01"}
                    step="0.01"
                    max={order.est_apres_echeance ? order.montant_total_a_payer : order.montant_restant}
                    value={paiementData.montant}
                    onChange={(e) => setPaiementData({ ...paiementData, montant: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                    placeholder={order.est_apres_echeance ? `Total avec pénalité: ${formatHTG(order.montant_total_a_payer)}` : `Max: ${formatHTG(order.montant_restant)}`}
                    required
                  />
                  {parseFloat(order.montant_paye) === 0 && (
                    <p className="text-xs text-blue-400 mt-1">
                      Minimum 60%: {formatHTG(parseFloat(order.montant_total) * 0.60)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Méthode de paiement *
                  </label>
                  <select
                    value={paiementData.methode}
                    onChange={(e) => setPaiementData({ ...paiementData, methode: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                    required
                  >
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="mobile">Paiement mobile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={paiementData.reference}
                    onChange={(e) => setPaiementData({ ...paiementData, reference: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                    placeholder="Numéro de transaction, chèque..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paiementData.notes}
                    onChange={(e) => setPaiementData({ ...paiementData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                    rows="3"
                    placeholder="Notes additionnelles..."
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => setShowPaiementModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;
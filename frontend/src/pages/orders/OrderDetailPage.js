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
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { orderService } from '../../services/api';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerDashboardUpdate, updateTrigger } = useDataUpdate();
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
      console.log('Order data received:', response);
      console.log('Order total should be:', response.total_ht, 'HTG');
      setOrder(response);
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
      setError('Erreur lors du chargement de la commande');
      toast.error('Erreur lors du chargement de la commande');
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

  const handleAddPaiement = async (e) => {
    e.preventDefault();

    if (!paiementData.montant || paiementData.montant <= 0) {
      toast.error('Montant invalide');
      return;
    }

    if (parseFloat(paiementData.montant) > parseFloat(order.montant_restant)) {
      toast.error('Le montant dépasse le montant restant');
      return;
    }

    try {
      setLoading(true);
      
      // Calculer le nouveau pourcentage après ce paiement
      const nouveauMontantPaye = parseFloat(order.montant_paye || 0) + parseFloat(paiementData.montant);
      const nouveauPourcentage = (nouveauMontantPaye / parseFloat(order.montant_total)) * 100;
      
      // Générer une note dynamique si aucune note n'est fournie
      const notePaiement = paiementData.notes || `Paiement: ${nouveauPourcentage.toFixed(0)}% (${nouveauMontantPaye.toFixed(2)} HTG sur ${parseFloat(order.montant_total).toFixed(2)} HTG)`;
      
      const response = await orderService.addPaiement(id, {
        ...paiementData,
        notes: notePaiement
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
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout du paiement');
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

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche de Commande - ${order.numero_commande}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
          }
          .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 5px; 
          }
          .company-subtitle { 
            font-size: 14px; 
            color: #666; 
            margin-bottom: 20px; 
          }
          .document-title { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-top: 10px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
          }
          .info-section { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #2563eb; 
          }
          .info-section h3 { 
            font-size: 16px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 15px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 5px 0; 
          }
          .info-label { 
            font-weight: 600; 
            color: #4b5563; 
            flex: 1; 
          }
          .info-value { 
            color: #1f2937; 
            flex: 1; 
            text-align: right; 
          }
          .status-badge { 
            display: inline-block; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .status-en-attente { background: #fef3c7; color: #d97706; }
          .status-validee { background: #dcfce7; color: #16a34a; }
          .status-en-preparation { background: #e0e7ff; color: #7c3aed; }
          .status-en-livraison { background: #fed7aa; color: #ea580c; }
          .status-livree { background: #dcfce7; color: #16a34a; }
          .status-annulee { background: #fecaca; color: #dc2626; }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            background: white; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          }
          .items-table th { 
            background: #2563eb; 
            color: white; 
            padding: 12px; 
            text-align: left; 
            font-weight: bold; 
            text-transform: uppercase; 
            font-size: 12px; 
            letter-spacing: 0.5px; 
          }
          .items-table td { 
            padding: 12px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .items-table tr:nth-child(even) { 
            background: #f9fafb; 
          }
          .total-section { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border: 2px solid #2563eb; 
            margin-top: 20px; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 5px 0; 
          }
          .total-final { 
            font-size: 20px; 
            font-weight: bold; 
            color: #2563eb; 
            border-top: 2px solid #2563eb; 
            padding-top: 15px; 
            margin-top: 15px; 
          }
          .notes-section { 
            background: #fffbeb; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #f59e0b; 
            margin-top: 20px; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #6b7280; 
            border-top: 1px solid #e5e7eb; 
            padding-top: 20px; 
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">SYGLA-H2O</div>
          <div class="company-subtitle">Système de Gestion d'Eau Potable et Glace</div>
          <div class="document-title">FICHE DE COMMANDE</div>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <h3>Informations Commande</h3>
            <div class="info-row">
              <span class="info-label">N° Commande:</span>
              <span class="info-value">${order.numero_commande}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de création:</span>
              <span class="info-value">${orderDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de livraison:</span>
              <span class="info-value">${deliveryDate}</span>
            </div>
            ${order.date_echeance ? `
            <div class="info-row">
              <span class="info-label">Date d'échéance:</span>
              <span class="info-value">${new Date(order.date_echeance).toLocaleDateString('fr-FR')}</span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">Type de livraison:</span>
              <span class="info-value">${order.type_livraison === 'retrait_magasin' ? 'Retrait en magasin' : 'Livraison à domicile'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Créée par:</span>
              <span class="info-value">${order.vendeur_nom_complet || order.vendeur_nom || 'Système'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Statut:</span>
              <span class="info-value">
                <span class="status-badge status-${order.statut}">
                  ${order.statut.replace('_', ' ').toUpperCase()}
                </span>
              </span>
            </div>
          </div>

          <div class="info-section">
            <h3>Informations Client</h3>
            <div class="info-row">
              <span class="info-label">Nom/Raison sociale:</span>
              <span class="info-value">${order.client?.raison_sociale || order.client?.nom || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact:</span>
              <span class="info-value">${order.client?.contact || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone:</span>
              <span class="info-value">${order.client?.telephone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${order.client?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Adresse:</span>
              <span class="info-value">${order.client?.adresse || 'N/A'}</span>
            </div>
          </div>
        </div>

        <h3 style="color: #2563eb; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Articles Commandés</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Sous-total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td><strong>${item.produit_nom}</strong></td>
                <td style="text-align: center;">${item.quantite}</td>
                <td style="text-align: right;">${formatHTG(item.prix_unitaire)}</td>
                <td style="text-align: right; font-weight: bold;">${formatHTG(item.sous_total)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align: center; font-style: italic;">Aucun article</td></tr>'}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Montant des produits:</span>
            <span>${formatHTG(order.montant_produits || 0)}</span>
          </div>
          <div class="total-row">
            <span>Frais de livraison ${order.type_livraison === 'retrait_magasin' ? '(Gratuit)' : '(+15%)'}:</span>
            <span>${formatHTG(order.frais_livraison || 0)}</span>
          </div>
          <div class="total-row total-final">
            <span>TOTAL DE LA COMMANDE:</span>
            <span>${formatHTG(order.montant_total)}</span>
          </div>
          ${order.montant_paye > 0 ? `
          <div class="total-row" style="color: #10b981; margin-top: 10px;">
            <span>Montant payé:</span>
            <span>${formatHTG(order.montant_paye)}</span>
          </div>
          <div class="total-row" style="color: ${order.montant_restant > 0 ? '#f59e0b' : '#10b981'};">
            <span>Montant restant:</span>
            <span>${formatHTG(order.montant_restant)}</span>
          </div>
          ` : ''}
        </div>

        ${order.paiements_commande && order.paiements_commande.length > 0 ? `
          <div class="notes-section">
            <h3 style="color: #10b981; margin-bottom: 10px;">Historique des paiements</h3>
            ${order.paiements_commande.map(paiement => `
              <div style="padding: 10px; margin-bottom: 8px; background: #f3f4f6; border-radius: 5px; border-left: 3px solid #10b981;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 0.9em; color: #6b7280;">${new Date(paiement.date_paiement).toLocaleString('fr-FR')}</span>
                    <br/>
                    <span style="font-size: 0.85em; padding: 2px 6px; background: #3b82f6; color: white; border-radius: 3px; margin-top: 4px; display: inline-block;">
                      ${paiement.methode === 'especes' ? 'Espèces' :
                        paiement.methode === 'carte' ? 'Carte bancaire' :
                        paiement.methode === 'virement' ? 'Virement' :
                        paiement.methode === 'cheque' ? 'Chèque' :
                        paiement.methode === 'mobile' ? 'Paiement mobile' :
                        paiement.methode}
                    </span>
                  </div>
                  <strong style="color: #10b981; font-size: 1.1em;">${formatHTG(paiement.montant)}</strong>
                </div>
                ${paiement.notes ? `<p style="font-size: 0.85em; color: #6b7280; margin-top: 5px;">${paiement.notes}</p>` : ''}
                ${paiement.reference ? `<p style="font-size: 0.85em; color: #6b7280; margin-top: 3px;">Réf: ${paiement.reference}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${order.notes ? `
          <div class="notes-section">
            <h3 style="color: #f59e0b; margin-bottom: 10px;">Notes</h3>
            <p>${order.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Document généré le ${currentDate}</p>
          <p>SYGLA-H2O - Système de Gestion d'Eau Potable et Glace</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
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
            
            {/* Boutons de changement de statut */}
            {order.statut === 'en_attente' && (
              <button
                onClick={() => handleStatusChange('validee')}
                disabled={loading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider</span>
              </button>
            )}
            
            {order.statut === 'validee' && (
              <button
                onClick={() => handleStatusChange('en_preparation')}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                <span>Préparer</span>
              </button>
            )}
            
            {order.statut === 'en_preparation' && (
              <button
                onClick={() => handleStatusChange('en_livraison')}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>Livrer</span>
              </button>
            )}
            
            {order.statut === 'en_livraison' && (
              <button
                onClick={() => handleStatusChange('livree')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Livrée</span>
              </button>
            )}
            
            {/* Bouton d'annulation (toujours disponible sauf si déjà livrée ou annulée) */}
            {!['livree', 'annulee'].includes(order.statut) && (
              <button
                onClick={() => handleStatusChange('annulee')}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            )}
            
            {/* Boutons d'action généraux */}
            {order.montant_restant > 0 && !order.convertie_en_vente && (
              <button
                onClick={() => setShowPaiementModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>Ajouter paiement</span>
              </button>
            )}
            
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
                    {order.type_livraison === 'retrait_magasin' ? ' (Gratuit)' : ' (+15%)'}:
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

            {/* Notes */}
            {order.notes && (
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
                <p className="text-dark-300 leading-relaxed">{order.notes}</p>
              </motion.div>
            )}
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
                    <p className="text-white text-lg mt-1">
                      {new Date(order.date_echeance).toLocaleDateString('fr-FR')}
                    </p>
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
                <Button onClick={handlePrintOrder} variant="warning" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer la fiche
                </Button>
                <Button onClick={handleEdit} variant="primary" className="w-full">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier la commande
                </Button>
                <Button onClick={handleDelete} variant="danger" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer la commande
                </Button>
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
              </div>
              
              <form onSubmit={handleAddPaiement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Montant *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={order.montant_restant}
                    value={paiementData.montant}
                    onChange={(e) => setPaiementData({ ...paiementData, montant: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-white"
                    placeholder={`Max: ${formatHTG(order.montant_restant)}`}
                    required
                  />
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
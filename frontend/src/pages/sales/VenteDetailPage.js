import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  Package,
  FileText,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Printer,
} from 'lucide-react';
import venteService from '../../services/venteService';
import Button from '../../components/ui/Button';
import { formatHTG } from '../../utils/currency';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const VenteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vente, setVente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementData, setPaiementData] = useState({
    montant: '',
    methode: 'especes',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchVente();
  }, [id]);

  const fetchVente = async () => {
    try {
      setLoading(true);
      const data = await venteService.getVenteById(id);
      setVente(data);
    } catch (error) {
      console.error('Erreur chargement vente:', error);
      toast.error('Erreur lors du chargement');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaiement = async (e) => {
    e.preventDefault();

    if (!paiementData.montant || paiementData.montant <= 0) {
      toast.error('Montant invalide');
      return;
    }

    if (parseFloat(paiementData.montant) > vente.montant_restant) {
      toast.error('Le montant dépasse le montant restant');
      return;
    }

    try {
      await venteService.ajouterPaiement(id, paiementData);
      toast.success('Paiement ajouté avec succès');
      setShowPaiementModal(false);
      setPaiementData({ montant: '', methode: 'especes', reference: '', notes: '' });
      fetchVente();
    } catch (error) {
      console.error('Erreur ajout paiement:', error);
      toast.error('Erreur lors de l\'ajout du paiement');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleString('fr-FR');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de Vente - ${vente.numero_vente}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 5px;
          }
          .document-title {
            font-size: 28px;
            font-weight: bold;
            margin: 15px 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-section {
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 8px;
          }
          .info-section h3 {
            color: #3b82f6;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
          }
          .info-label {
            color: #6b7280;
          }
          .info-value {
            font-weight: 600;
            color: #111827;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-paye {
            background: #d1fae5;
            color: #065f46;
          }
          .status-paye_partiel {
            background: #fef3c7;
            color: #92400e;
          }
          .status-impaye {
            background: #fee2e2;
            color: #991b1b;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          .items-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-size: 14px;
            color: #374151;
            border-bottom: 2px solid #3b82f6;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .items-table tbody tr:last-child td {
            border-bottom: 2px solid #e5e7eb;
          }
          .total-section {
            margin-top: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 16px;
          }
          .total-final {
            font-size: 20px;
            font-weight: bold;
            color: #3b82f6;
            padding-top: 15px;
            border-top: 2px solid #3b82f6;
            margin-top: 15px;
          }
          .paiements-section {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .paiements-section h3 {
            color: #10b981;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .paiement-item {
            padding: 12px;
            margin-bottom: 10px;
            background: #f3f4f6;
            border-radius: 6px;
            border-left: 4px solid #10b981;
          }
          .notes-section {
            margin-top: 30px;
            padding: 20px;
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
          }
          .footer {
            margin-top: 50px;
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
          <div class="company-name">Système de Gestion d'Eau Potable et Glace</div>
          <div class="document-title">REÇU DE VENTE</div>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <h3>INFORMATIONS VENTE</h3>
            <div class="info-row">
              <span class="info-label">N° Vente:</span>
              <span class="info-value">${vente.numero_vente}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date de vente:</span>
              <span class="info-value">${format(new Date(vente.date_vente), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Vendeur:</span>
              <span class="info-value">${vente.vendeur_details?.full_name || vente.vendeur_details?.email || 'Système'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Statut:</span>
              <span class="info-value">
                <span class="status-badge status-${vente.statut_paiement}">
                  ${vente.statut_paiement === 'paye' ? 'PAYÉ' : vente.statut_paiement === 'paye_partiel' ? 'PAYÉ PARTIELLEMENT' : 'IMPAYÉ'}
                </span>
              </span>
            </div>
          </div>

          <div class="info-section">
            <h3>INFORMATIONS CLIENT</h3>
            <div class="info-row">
              <span class="info-label">Nom/Raison sociale:</span>
              <span class="info-value">${vente.client_details?.nom_commercial || vente.client_details?.raison_sociale || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact:</span>
              <span class="info-value">${vente.client_details?.contact || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone:</span>
              <span class="info-value">${vente.client_details?.telephone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${vente.client_details?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Adresse:</span>
              <span class="info-value">${vente.client_details?.adresse || 'N/A'}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${vente.lignes?.map(ligne => `
              <tr>
                <td><strong>${ligne.produit_details?.nom || 'N/A'}</strong></td>
                <td style="text-align: center;">${ligne.quantite}</td>
                <td style="text-align: right;">${formatHTG(ligne.prix_unitaire)}</td>
                <td style="text-align: right; font-weight: bold;">${formatHTG(ligne.montant)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align: center; font-style: italic;">Aucun article</td></tr>'}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row total-final">
            <span>TOTAL DE LA VENTE:</span>
            <span>${formatHTG(vente.montant_total)}</span>
          </div>
          <div class="total-row" style="color: #10b981; margin-top: 10px;">
            <span>Montant payé:</span>
            <span>${formatHTG(vente.montant_paye)}</span>
          </div>
          <div class="total-row" style="color: ${vente.montant_restant > 0 ? '#f59e0b' : '#10b981'};">
            <span>Montant restant:</span>
            <span>${formatHTG(vente.montant_restant)}</span>
          </div>
        </div>

        ${vente.paiements && vente.paiements.length > 0 ? `
          <div class="paiements-section">
            <h3>Historique des paiements</h3>
            ${vente.paiements.map(paiement => `
              <div class="paiement-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 0.9em; color: #6b7280;">${format(new Date(paiement.date_paiement), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
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

        ${vente.notes ? `
          <div class="notes-section">
            <h3 style="color: #f59e0b; margin-bottom: 10px;">Notes</h3>
            <p>${vente.notes}</p>
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
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const getStatutBadge = (statut) => {
    const badges = {
      paye: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
        text: 'Payé',
      },
      paye_partiel: {
        color: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
        icon: Clock,
        text: 'Payé Partiellement',
      },
      impaye: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
        text: 'Impayé',
      },
    };

    const badge = badges[statut] || badges.impaye;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        <span>{badge.text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!vente) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/sales')}
            className="mr-4 p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Vente {vente.numero_vente}</h1>
            <p className="text-dark-400">Détails de la vente</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {getStatutBadge(vente.statut_paiement)}
          <Button
            onClick={handlePrint}
            variant="secondary"
            leftIcon={<Printer className="w-5 h-5" />}
          >
            Imprimer
          </Button>
          {vente.statut_paiement !== 'paye' && (
            <Button
              onClick={() => setShowPaiementModal(true)}
              variant="primary"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Ajouter Paiement
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations client */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Informations Client</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-sm mb-1">Client</p>
                <p className="text-white font-medium">{vente.client_details?.nom_commercial || vente.client_details?.raison_sociale || vente.client_details?.contact}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm mb-1">Téléphone</p>
                <p className="text-white">{vente.client_details?.telephone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm mb-1">Email</p>
                <p className="text-white">{vente.client_details?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm mb-1">Adresse</p>
                <p className="text-white">{vente.client_details?.adresse || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Produits</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left p-3 text-dark-300">Produit</th>
                    <th className="text-center p-3 text-dark-300">Quantité</th>
                    <th className="text-right p-3 text-dark-300">Prix unitaire</th>
                    <th className="text-right p-3 text-dark-300">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {vente.lignes?.map((ligne) => (
                    <tr key={ligne.id} className="border-b border-dark-700/50">
                      <td className="p-3 text-white">{ligne.produit_details?.nom}</td>
                      <td className="p-3 text-center text-dark-200">{ligne.quantite}</td>
                      <td className="p-3 text-right text-dark-200">{formatHTG(ligne.prix_unitaire)}</td>
                      <td className="p-3 text-right font-semibold">{formatHTG(ligne.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historique des paiements */}
          {vente.paiements && vente.paiements.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Historique des Paiements</h2>
              <div className="space-y-3">
                {vente.paiements.map((paiement) => (
                  <div key={paiement.id} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{formatHTG(paiement.montant)}</p>
                        <p className="text-dark-400 text-sm">
                          {format(new Date(paiement.date_paiement), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-dark-300 text-sm">{paiement.methode}</p>
                      {paiement.reference && (
                        <p className="text-dark-400 text-xs">Réf: {paiement.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {vente.notes && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <p className="text-dark-300 whitespace-pre-wrap">{vente.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Résumé financier */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Résumé</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-400">Montant total:</span>
                <span className="font-semibold">{formatHTG(vente.montant_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Montant payé:</span>
                <span className="font-semibold text-green-400">{formatHTG(vente.montant_paye)}</span>
              </div>
              <div className="flex justify-between border-t border-dark-700 pt-3">
                <span className="text-dark-400">Montant restant:</span>
                <span className="font-bold text-warning-400 text-lg">{formatHTG(vente.montant_restant)}</span>
              </div>
              
              {/* Barre de progression */}
              <div className="pt-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-400">Progression</span>
                  <span className="text-primary-400">{vente.taux_paiement?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all"
                    style={{ width: `${vente.taux_paiement}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Informations</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-dark-300">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-xs text-dark-400">Date de vente</p>
                  <p className="text-sm text-white">
                    {format(new Date(vente.date_vente), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-dark-300">
                <User className="w-5 h-5" />
                <div>
                  <p className="text-xs text-dark-400">Vendeur</p>
                  <p className="text-sm text-white">{vente.vendeur_details?.full_name || vente.vendeur_details?.email}</p>
                </div>
              </div>
              
              {vente.methode_paiement && (
                <div className="flex items-center space-x-3 text-dark-300">
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-dark-400">Méthode de paiement</p>
                    <p className="text-sm text-white capitalize">{vente.methode_paiement}</p>
                  </div>
                </div>
              )}
              
              {vente.date_echeance && (
                <div className="flex items-center space-x-3 text-dark-300">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-dark-400">Date d'échéance</p>
                    <p className="text-sm text-white">
                      {format(new Date(vente.date_echeance), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Paiement */}
      {showPaiementModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            className="card p-6 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold mb-4">Ajouter un Paiement</h2>
            
            <form onSubmit={handleAddPaiement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Montant *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={vente.montant_restant}
                  value={paiementData.montant}
                  onChange={(e) => setPaiementData({ ...paiementData, montant: e.target.value })}
                  className="input w-full"
                  placeholder={`Max: ${formatHTG(vente.montant_restant)}`}
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
                  className="input w-full"
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
                  className="input w-full"
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
                  className="input w-full"
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
                >
                  Enregistrer
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VenteDetailPage;

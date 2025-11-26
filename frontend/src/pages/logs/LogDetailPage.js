import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  Clock,
  User,
  Package as PackageIcon,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Server,
  MapPin,
  Globe,
  Copy,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logService } from '../../services/api';

const LogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Types de logs
  const logTypes = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Info' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Succès' },
    warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Avertissement' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Erreur' }
  };

  useEffect(() => {
    fetchLogDetail();
  }, [id]);

  const fetchLogDetail = async () => {
    try {
      setLoading(true);
      
      // Appel API réel
      const logData = await logService.getById(id);
      
      // Transformer les données pour correspondre au format attendu
      const transformedLog = {
        id: logData.id,
        type: logData.type,
        message: logData.message,
        user: logData.user_email,
        module: logData.module_display || logData.module,
        timestamp: logData.timestamp,
        details: logData.details,
        ipAddress: logData.ip_address || 'N/A',
        userAgent: logData.user_agent || 'N/A',
        requestMethod: logData.request_method || 'N/A',
        endpoint: logData.endpoint || 'N/A',
        statusCode: logData.status_code || 0,
        responseTime: logData.response_time || 'N/A',
        metadata: logData.metadata || {}
      };
      
      setLog(transformedLog);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du log:', error);
      toast.error('Log introuvable');
      navigate('/logs');
      setLoading(false);
    }
  };

  const fetchLogDetailMock = async () => {
    try {
      setLoading(true);
      
      // Simulation de données - Backup si l'API ne fonctionne pas
      const mockLogs = [
        {
          id: 1,
          type: 'success',
          message: 'Nouvelle commande créée #CMD-001',
          user: 'admin@sygla-h2o.com',
          module: 'Commandes',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          details: 'Commande de 50 bidons d\'eau pour Client A',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestMethod: 'POST',
          endpoint: '/api/orders/',
          statusCode: 201,
          responseTime: '145ms',
          metadata: {
            orderId: 'CMD-001',
            clientId: 1,
            clientName: 'Client A',
            totalAmount: 2500,
            itemsCount: 50,
            productName: 'Eau Potable 20L'
          }
        },
        {
          id: 2,
          type: 'info',
          message: 'Connexion utilisateur réussie',
          user: 'vendeur@sygla-h2o.com',
          module: 'Authentification',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          details: 'Connexion depuis 192.168.1.100',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestMethod: 'POST',
          endpoint: '/api/auth/login/',
          statusCode: 200,
          responseTime: '89ms',
          metadata: {
            sessionId: 'sess_abc123',
            role: 'vendeur',
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
          }
        },
        {
          id: 3,
          type: 'warning',
          message: 'Stock faible détecté pour Eau Potable 20L',
          user: 'system',
          module: 'Stock',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          details: 'Quantité restante: 5 unités',
          ipAddress: 'system',
          userAgent: 'System Alert',
          requestMethod: 'SYSTEM',
          endpoint: '/internal/stock/check',
          statusCode: 200,
          responseTime: '12ms',
          metadata: {
            productId: 1,
            productName: 'Eau Potable 20L',
            currentStock: 5,
            minimumStock: 10,
            alertLevel: 'warning'
          }
        },
        {
          id: 4,
          type: 'success',
          message: 'Client modifié: Entreprise ABC',
          user: 'vendeur@sygla-h2o.com',
          module: 'Clients',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          details: 'Mise à jour des informations de contact',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestMethod: 'PUT',
          endpoint: '/api/clients/3/',
          statusCode: 200,
          responseTime: '234ms',
          metadata: {
            clientId: 3,
            clientName: 'Entreprise ABC',
            fieldsUpdated: ['telephone', 'email', 'adresse'],
            previousPhone: '+509 1234 5678',
            newPhone: '+509 8765 4321'
          }
        },
        {
          id: 5,
          type: 'error',
          message: 'Échec de validation de commande #CMD-002',
          user: 'admin@sygla-h2o.com',
          module: 'Commandes',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          details: 'Stock insuffisant pour le produit demandé',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestMethod: 'POST',
          endpoint: '/api/orders/2/validate/',
          statusCode: 400,
          responseTime: '98ms',
          metadata: {
            orderId: 'CMD-002',
            productId: 2,
            productName: 'Glace 10kg',
            requestedQuantity: 100,
            availableQuantity: 50,
            errorCode: 'INSUFFICIENT_STOCK'
          }
        },
        {
          id: 6,
          type: 'success',
          message: 'Livraison complétée #LIV-001',
          user: 'livreur@sygla-h2o.com',
          module: 'Livraisons',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          details: 'Livraison effectuée à Port-au-Prince',
          ipAddress: '192.168.1.110',
          userAgent: 'Mozilla/5.0 (Android 11; Mobile) AppleWebKit/537.36',
          requestMethod: 'PATCH',
          endpoint: '/api/deliveries/1/complete/',
          statusCode: 200,
          responseTime: '167ms',
          metadata: {
            deliveryId: 'LIV-001',
            orderId: 'CMD-001',
            deliveryAddress: '123 Rue de la Paix, Port-au-Prince',
            deliveryTime: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            signature: 'received',
            gpsCoordinates: '18.5944, -72.3074'
          }
        },
        {
          id: 7,
          type: 'info',
          message: 'Nouveau produit ajouté: Glace 5kg',
          user: 'stock@sygla-h2o.com',
          module: 'Produits',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          details: 'Prix: 150 HTG, Stock initial: 100',
          ipAddress: '192.168.1.108',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestMethod: 'POST',
          endpoint: '/api/products/',
          statusCode: 201,
          responseTime: '203ms',
          metadata: {
            productId: 10,
            productName: 'Glace 5kg',
            category: 'Glace',
            price: 150,
            initialStock: 100,
            unit: 'kg'
          }
        },
        {
          id: 8,
          type: 'success',
          message: 'Rapport généré et exporté en PDF',
          user: 'admin@sygla-h2o.com',
          module: 'Rapports',
          timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
          details: 'Rapport mensuel des ventes',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestMethod: 'GET',
          endpoint: '/api/reports/export-pdf/',
          statusCode: 200,
          responseTime: '2.3s',
          metadata: {
            reportType: 'monthly_sales',
            period: 'October 2025',
            totalOrders: 45,
            totalRevenue: 125000,
            fileSize: '234 KB',
            format: 'PDF'
          }
        }
      ];

      const foundLog = mockLogs.find(l => l.id === parseInt(id));
      
      if (foundLog) {
        setLog(foundLog);
      } else {
        toast.error('Log introuvable');
        navigate('/logs');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du log:', error);
      toast.error('Erreur lors du chargement du log');
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!log) {
    return null;
  }

  const config = logTypes[log.type];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/logs')}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </motion.button>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Détails du Log</h2>
            <p className="text-dark-300">Log ID: #{log.id}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg ${config.bg} ${config.color} flex items-center font-medium`}>
          <Icon className="w-5 h-5 mr-2" />
          {config.label}
        </span>
      </div>

      {/* Informations principales */}
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-4 rounded-xl ${config.bg}`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">{log.message}</h3>
            <p className="text-dark-300 text-lg">{log.details}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dark-700">
          {/* Timestamp */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-800">
              <Clock className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">Date et heure</p>
              <p className="text-white font-medium">{formatTimestamp(log.timestamp)}</p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-800">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">Utilisateur</p>
              <p className="text-white font-medium">{log.user}</p>
            </div>
          </div>

          {/* Module */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-800">
              <PackageIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">Module</p>
              <p className="text-white font-medium">{log.module}</p>
            </div>
          </div>

          {/* IP Address */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-dark-800">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400 mb-1">Adresse IP</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{log.ipAddress}</p>
                <button
                  onClick={() => copyToClipboard(log.ipAddress)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-dark-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Détails techniques */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Server className="w-5 h-5 mr-2 text-cyan-400" />
          Détails Techniques
        </h3>
        
        <div className="space-y-4">
          {/* Request */}
          <div className="p-4 bg-dark-800/50 rounded-lg">
            <p className="text-sm text-dark-400 mb-2">Requête</p>
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className={`px-2 py-1 rounded ${
                log.requestMethod === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                log.requestMethod === 'POST' ? 'bg-green-500/20 text-green-400' :
                log.requestMethod === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                log.requestMethod === 'PATCH' ? 'bg-orange-500/20 text-orange-400' :
                log.requestMethod === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {log.requestMethod}
              </span>
              <span className="text-white">{log.endpoint}</span>
            </div>
          </div>

          {/* Response */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-800/50 rounded-lg">
              <p className="text-sm text-dark-400 mb-2">Code de statut</p>
              <p className={`text-2xl font-bold ${
                log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-400' :
                log.statusCode >= 400 && log.statusCode < 500 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {log.statusCode}
              </p>
            </div>
            <div className="p-4 bg-dark-800/50 rounded-lg">
              <p className="text-sm text-dark-400 mb-2">Temps de réponse</p>
              <p className="text-2xl font-bold text-cyan-400">{log.responseTime}</p>
            </div>
          </div>

          {/* User Agent */}
          <div className="p-4 bg-dark-800/50 rounded-lg">
            <p className="text-sm text-dark-400 mb-2">User Agent</p>
            <p className="text-white font-mono text-sm break-all">{log.userAgent}</p>
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      {log.metadata && (
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Métadonnées</h3>
          <div className="bg-dark-800/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-green-400">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogDetailPage;

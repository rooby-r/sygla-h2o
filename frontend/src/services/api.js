import axios from 'axios';

// Détection automatique de l'URL de l'API selon l'origine
const getApiBaseUrl = () => {
  // Si une URL est définie dans .env, l'utiliser
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Sinon, utiliser la même adresse que le frontend (localhost ou IP réseau)
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api`;
};

// Configuration de base d'Axios
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si le token est expiré (401) et qu'on n'a pas déjà tenté de le renouveler
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/auth/token/refresh/', {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si le refresh échoue, rediriger vers la page de connexion
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { tokens, user } = response.data;
    
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    const { tokens, user } = response.data;
    
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.patch('/auth/profile/', userData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password/', passwordData);
    return response.data;
  },
};

// Services pour les clients
export const clientService = {
  getAll: async (params = {}) => {
    // Ajouter un paramètre pour récupérer tous les clients sans pagination
    const response = await api.get('/clients/', { 
      params: { ...params, page_size: 1000 } 
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/clients/${id}/`);
    return response.data;
  },

  create: async (clientData) => {
    const response = await api.post('/clients/', clientData);
    return response.data;
  },

  update: async (id, clientData) => {
    const response = await api.patch(`/clients/${id}/`, clientData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clients/${id}/`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.post(`/clients/${id}/toggle-status/`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/clients/stats/');
    return response.data;
  },

  search: async (query) => {
    const response = await api.get('/clients/search/', {
      params: { q: query }
    });
    return response.data;
  },

  getOrderHistory: async (clientId) => {
    const response = await api.get(`/orders/client/${clientId}/historique/`);
    // Extraire les résultats de la structure paginée
    return response.data.results || response.data;
  },
};

// Services pour les produits
export const productService = {
  getAll: async (params = {}) => {
    // Ajouter un paramètre pour récupérer tous les produits sans pagination
    const response = await api.get('/products/', { 
      params: { ...params, page_size: 1000 } 
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  create: async (productData) => {
    const response = await api.post('/products/', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await api.patch(`/products/${id}/`, productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}/`);
    return response.data;
  },

  updateStock: async (id, stockData) => {
    const response = await api.post(`/products/${id}/update-stock/`, stockData);
    return response.data;
  },

  getStockMovements: async (id) => {
    const response = await api.get(`/products/${id}/movements/`);
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get('/products/low-stock/');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/products/stats/');
    return response.data;
  },
};

// Services pour les commandes
export const orderService = {
  getAll: async (params = {}) => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },

  getById: async (id, params = {}) => {
    const response = await api.get(`/orders/${id}/`, { params });
    return response.data;
  },

  create: async (orderData) => {
    try {
      console.log(`🔄 [CREATE-V3-${Date.now()}] Création commande - Début`);
      console.log(`🔄 [CREATE-V3] Base URL: ${api.defaults.baseURL}`);
      console.log(`🔄 [CREATE-V3] URL complète: ${api.defaults.baseURL}/orders/`);
      console.log(`🔄 [CREATE-V3] Token présent:`, !!localStorage.getItem('access_token'));
      console.log(`🔄 [CREATE-V3] Données envoyées:`, JSON.stringify(orderData, null, 2));
      
      const response = await api.post('/orders/', orderData);
      console.log(`✅ [CREATE-V3] Commande créée avec succès:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [CREATE-V3] Erreur création commande:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        requestData: orderData,
        timestamp: new Date().toISOString()
      });
      
      // Log spécifique pour erreur 500
      if (error.response?.status === 500) {
        console.error(`🚨 [CREATE-V3] ERREUR 500 CRÉATION! Détails complets:`, {
          responseText: error.response?.data,
          headers: error.response?.headers,
          config: error.config,
          orderData: orderData
        });
      }
      
      // Re-lancer l'erreur avec plus de contexte
      const enhancedError = new Error(error.message);
      enhancedError.response = error.response;
      enhancedError.config = error.config;
      enhancedError.originalData = orderData;
      throw enhancedError;
    }
  },

  update: async (id, orderData) => {
    const response = await api.patch(`/orders/${id}/`, orderData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/orders/${id}/`);
    return response.data;
  },

  validate: async (id) => {
    try {
      console.log(`🔄 [V3-${Date.now()}] Validation commande ${id} - Début`);
      console.log(`🔄 [V3] Base URL: ${api.defaults.baseURL}`);
      console.log(`🔄 [V3] URL complète: ${api.defaults.baseURL}/orders/${id}/validate/`);
      console.log(`🔄 [V3] Token présent:`, !!localStorage.getItem('access_token'));
      
      // Test avec une instance Axios fraîche pour diagnostiquer
      const token = localStorage.getItem('access_token');
      const testResponse = await fetch(`http://localhost:8000/api/orders/${id}/validate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      console.log(`🧪 [V3] Test direct fetch status: ${testResponse.status}`);
      
      if (testResponse.status === 500) {
        const errorText = await testResponse.text();
        console.error(`🚨 [V3] ERREUR 500 avec fetch direct:`, errorText);
        throw new Error(`Erreur 500: ${errorText}`);
      }
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log(`✅ [V3] Succès avec fetch direct:`, result);
        return result;
      }
      
      // Si fetch direct échoue aussi, utiliser Axios normal
      const response = await api.post(`/orders/${id}/validate/`);
      console.log(`✅ [V3] Validation réussie avec Axios:`, response.data);
      return response.data;
      
    } catch (error) {
      console.error(`❌ [V3] Erreur validation commande ${id}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date().toISOString()
      });
      
      // Log spécifique pour erreur 500
      if (error.response?.status === 500) {
        console.error(`🚨 [V3] ERREUR 500 DÉTECTÉE! Détails complets:`, {
          responseText: error.response?.data,
          headers: error.response?.headers,
          config: error.config
        });
      }
      
      // Créer un message d'erreur plus précis
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Erreur de validation';
        const customError = new Error(errorMsg);
        customError.response = error.response;
        throw customError;
      } else if (error.response?.status === 500) {
        const customError = new Error('Erreur interne du serveur. Veuillez réessayer.');
        customError.response = error.response;
        throw customError;
      } else if (error.response?.data?.error) {
        const customError = new Error(error.response.data.error);
        customError.response = error.response;
        throw customError;
      }
      
      // Re-lancer l'erreur originale si aucun cas spécifique
      throw error;
    }
  },

  cancel: async (id) => {
    const response = await api.post(`/orders/${id}/cancel/`);
    return response.data;
  },

  addPaiement: async (id, paiementData) => {
    try {
      console.log(`💳 Ajout paiement pour commande ${id}:`, paiementData);
      const response = await api.post(`/orders/${id}/paiement/`, paiementData);
      console.log('✅ Paiement ajouté:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur ajout paiement:', error.response?.data);
      throw error;
    }
  },

  getStats: async () => {
    const response = await api.get('/orders/stats/');
    return response.data;
  },
};

// Services pour les livraisons
export const deliveryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/deliveries/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/deliveries/${id}/`);
    return response.data;
  },

  create: async (deliveryData) => {
    const response = await api.post('/deliveries/', deliveryData);
    return response.data;
  },

  update: async (id, deliveryData) => {
    const response = await api.patch(`/deliveries/${id}/`, deliveryData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/deliveries/${id}/status/`, { statut: status });
    return response.data;
  },

  markAsDelivered: async (id, deliveryData) => {
    const response = await api.post(`/deliveries/${id}/delivered/`, deliveryData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/deliveries/stats/');
    return response.data;
  },
};

// Services pour les rapports
export const reportService = {
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales/', { params });
    return response.data;
  },

  getInventoryReport: async (params = {}) => {
    const response = await api.get('/reports/inventory/', { params });
    return response.data;
  },

  getClientReport: async (params = {}) => {
    const response = await api.get('/reports/clients/', { params });
    return response.data;
  },

  getDeliveryReport: async (params = {}) => {
    const response = await api.get('/reports/deliveries/', { params });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard-stats/');
    return response.data;
  },

  exportToPDF: async (reportType, params = {}) => {
    const response = await api.get('/reports/export-pdf/', {
      params: { type: reportType, ...params },
      responseType: 'blob',
    });
    return response.data;
  },

  // Fonction utilitaire pour télécharger un fichier
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// Services pour les utilisateurs
export const userService = {
  getAll: async () => {
    const response = await api.get('/auth/users/');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/auth/users/create/', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.patch(`/auth/users/${id}/`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/auth/users/${id}/`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/auth/users/${id}/`, {
      is_active: undefined, // Will be toggled on backend
    });
    return response.data;
  },
};

// Services pour les logs système
export const logService = {
  getAll: async (params = {}) => {
    const response = await api.get('/logs/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/logs/${id}/`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/logs/stats/');
    return response.data;
  },

  clearAll: async () => {
    const response = await api.delete('/logs/clear_all/');
    return response.data;
  },

  exportLogs: async (params = {}) => {
    const response = await api.get('/logs/export/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
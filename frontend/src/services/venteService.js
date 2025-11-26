import api from './api';

// Récupérer toutes les ventes
export const getVentes = async (params = {}) => {
  const response = await api.get('/sales/ventes/', { params });
  return response.data;
};

// Récupérer une vente par ID
export const getVenteById = async (id) => {
  const response = await api.get(`/sales/ventes/${id}/`);
  return response.data;
};

// Créer une nouvelle vente
export const createVente = async (data) => {
  const response = await api.post('/sales/ventes/', data);
  return response.data;
};

// Mettre à jour une vente
export const updateVente = async (id, data) => {
  const response = await api.put(`/sales/ventes/${id}/`, data);
  return response.data;
};

// Supprimer une vente
export const deleteVente = async (id) => {
  const response = await api.delete(`/sales/ventes/${id}/`);
  return response.data;
};

// Ajouter un paiement à une vente
export const ajouterPaiement = async (venteId, data) => {
  const response = await api.post(`/sales/ventes/${venteId}/ajouter_paiement/`, data);
  return response.data;
};

// Récupérer les statistiques des ventes
export const getVentesStatistiques = async (params = {}) => {
  const response = await api.get('/sales/ventes/statistiques/', { params });
  return response.data;
};

// Récupérer tous les paiements
export const getPaiements = async (params = {}) => {
  const response = await api.get('/sales/paiements/', { params });
  return response.data;
};

// Récupérer un paiement par ID
export const getPaiementById = async (id) => {
  const response = await api.get(`/sales/paiements/${id}/`);
  return response.data;
};

const venteService = {
  getVentes,
  getVenteById,
  createVente,
  updateVente,
  deleteVente,
  ajouterPaiement,
  getVentesStatistiques,
  getPaiements,
  getPaiementById,
};

export default venteService;

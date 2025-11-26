import api from './api';

/**
 * Service pour gérer les notifications
 */

/**
 * Récupère toutes les notifications de l'utilisateur connecté
 * @returns {Promise} Liste des notifications
 */
export const getNotifications = async () => {
  try {
    console.log('🔄 Appel API: /auth/notifications/');
    const response = await api.get('/auth/notifications/');
    console.log('✅ Réponse API notifications:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des notifications:', error);
    console.error('Détails:', error.response?.data);
    throw error;
  }
};

/**
 * Récupère le nombre de notifications non lues
 * @returns {Promise<number>} Nombre de notifications non lues
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/auth/notifications/unread_count/');
    return response.data.count;
  } catch (error) {
    console.error('Erreur lors de la récupération du compteur:', error);
    throw error;
  }
};

/**
 * Marque une notification comme lue
 * @param {number} notificationId - ID de la notification
 * @returns {Promise} Notification mise à jour
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.post(`/auth/notifications/${notificationId}/mark_as_read/`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    throw error;
  }
};

/**
 * Marque toutes les notifications comme lues
 * @returns {Promise} Résultat de l'opération
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.post('/auth/notifications/mark_all_as_read/');
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    throw error;
  }
};

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationService;

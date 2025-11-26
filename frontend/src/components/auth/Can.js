import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../config/permissions';

/**
 * Composant pour afficher conditionnellement du contenu basé sur les permissions
 * 
 * @param {string} module - Le module à vérifier (ex: 'clients', 'products', 'orders')
 * @param {string} action - L'action à vérifier (ex: 'view', 'create', 'edit', 'delete')
 * @param {React.ReactNode} children - Le contenu à afficher si la permission est accordée
 * @param {React.ReactNode} fallback - Le contenu à afficher si la permission est refusée (optionnel)
 */
const Can = ({ module, action = 'view', children, fallback = null }) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const allowed = hasPermission(user, module, action);

  return allowed ? children : fallback;
};

export default Can;

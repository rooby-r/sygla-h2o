import React, { createContext, useContext, useState } from 'react';

// Contexte pour gérer les mises à jour de données globales
const DataUpdateContext = createContext();

export const useDataUpdate = () => {
  const context = useContext(DataUpdateContext);
  if (!context) {
    throw new Error('useDataUpdate must be used within a DataUpdateProvider');
  }
  return context;
};

export const DataUpdateProvider = ({ children }) => {
  const [dashboardUpdateTrigger, setDashboardUpdateTrigger] = useState(0);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [notificationUpdateTrigger, setNotificationUpdateTrigger] = useState(0);

  // Fonction pour déclencher une mise à jour du tableau de bord
  const triggerDashboardUpdate = () => {
    setDashboardUpdateTrigger(prev => prev + 1);
    setUpdateTrigger(prev => prev + 1); // Déclencher aussi une mise à jour générale
  };
  
  // Fonction pour déclencher une mise à jour des notifications
  const triggerNotificationUpdate = () => {
    setNotificationUpdateTrigger(prev => prev + 1);
  };

  // Fonction appelée après suppression d'un client
  const onClientDeleted = (clientData) => {
    console.log('🗑️ Client supprimé:', clientData);
    // Déclencher la mise à jour du tableau de bord
    triggerDashboardUpdate();
    triggerNotificationUpdate();
  };

  // Fonction appelée après ajout/modification d'une commande
  const onOrderChanged = (orderData) => {
    console.log('🛒 Commande modifiée:', orderData);
    triggerDashboardUpdate();
    triggerNotificationUpdate();
  };

  // Fonction appelée après suppression d'une commande
  const onOrderDeleted = (orderData) => {
    console.log('🗑️ Commande supprimée:', orderData);
    triggerDashboardUpdate();
    triggerNotificationUpdate();
  };

  // Fonction appelée après création d'un produit
  const onProductCreated = (productData) => {
    console.log('📦 Produit créé:', productData);
    triggerDashboardUpdate();
    triggerNotificationUpdate();
  };

  // Fonction appelée après modification d'un produit
  const onProductUpdated = (productData) => {
    console.log('📝 Produit modifié:', productData);
    triggerDashboardUpdate();
    triggerNotificationUpdate();
  };

  // Fonction appelée après suppression d'un produit
  const onProductDeleted = (productData) => {
    console.log('🗑️ Produit supprimé:', productData);
    triggerDashboardUpdate();
    triggerNotificationUpdate();
  };

  const value = {
    dashboardUpdateTrigger,
    updateTrigger,
    notificationUpdateTrigger,
    triggerDashboardUpdate,
    triggerNotificationUpdate,
    onClientDeleted,
    onOrderChanged,
    onOrderDeleted,
    onProductCreated,
    onProductUpdated,
    onProductDeleted
  };

  return (
    <DataUpdateContext.Provider value={value}>
      {children}
    </DataUpdateContext.Provider>
  );
};
import { useState, useEffect } from 'react';
import { productTypeService } from '../services/productTypeService';

export const useProductTypes = () => {
  const [productTypes, setProductTypes] = useState(productTypeService.getAll());

  useEffect(() => {
    // Fonction pour mettre à jour les types quand ils changent
    const handleTypesUpdate = (newTypes) => {
      setProductTypes(newTypes);
    };

    // S'abonner aux changements
    productTypeService.addListener(handleTypesUpdate);

    // Nettoyer l'abonnement au démontage
    return () => {
      productTypeService.removeListener(handleTypesUpdate);
    };
  }, []);

  const addProductType = (newType) => {
    return productTypeService.add(newType);
  };

  const removeProductType = (type) => {
    return productTypeService.remove(type);
  };

  const typeExists = (type) => {
    return productTypeService.exists(type);
  };

  return {
    productTypes,
    addProductType,
    removeProductType,
    typeExists,
    defaultTypes: ['eau', 'glace']
  };
};
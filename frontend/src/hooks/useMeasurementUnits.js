import { useState, useEffect } from 'react';
import { measurementUnitService } from '../services/measurementUnitService';

export const useMeasurementUnits = () => {
  const [measurementUnits, setMeasurementUnits] = useState(measurementUnitService.getAll());

  useEffect(() => {
    // Fonction pour mettre à jour les unités quand elles changent
    const handleUnitsUpdate = (newUnits) => {
      setMeasurementUnits(newUnits);
    };

    // S'abonner aux changements
    measurementUnitService.addListener(handleUnitsUpdate);

    // Nettoyer l'abonnement au démontage
    return () => {
      measurementUnitService.removeListener(handleUnitsUpdate);
    };
  }, []);

  const addMeasurementUnit = (newUnit) => {
    return measurementUnitService.add(newUnit);
  };

  const removeMeasurementUnit = (unit) => {
    return measurementUnitService.remove(unit);
  };

  const unitExists = (unit) => {
    return measurementUnitService.exists(unit);
  };

  return {
    measurementUnits,
    addMeasurementUnit,
    removeMeasurementUnit,
    unitExists,
    defaultUnits: ['litre', 'kg', 'unite']
  };
};
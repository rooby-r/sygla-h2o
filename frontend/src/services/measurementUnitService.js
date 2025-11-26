// Service pour gérer les unités de mesure
class MeasurementUnitService {
  constructor() {
    this.storageKey = 'measurement_units';
    this.defaultUnits = ['litre', 'kg', 'unite'];
    this.listeners = [];
  }

  // Récupérer toutes les unités de mesure
  getAll() {
    const stored = localStorage.getItem(this.storageKey);
    const customUnits = stored ? JSON.parse(stored) : [];
    return [...this.defaultUnits, ...customUnits];
  }

  // Ajouter une nouvelle unité
  add(newUnit) {
    if (!newUnit || typeof newUnit !== 'string') return false;
    
    const cleanUnit = newUnit.toLowerCase().trim();
    if (this.exists(cleanUnit)) return false;
    
    const stored = localStorage.getItem(this.storageKey);
    const customUnits = stored ? JSON.parse(stored) : [];
    
    customUnits.push(cleanUnit);
    localStorage.setItem(this.storageKey, JSON.stringify(customUnits));
    
    // Notifier tous les listeners
    this.notifyListeners();
    return true;
  }

  // Vérifier si une unité existe déjà
  exists(unit) {
    const allUnits = this.getAll();
    return allUnits.includes(unit.toLowerCase().trim());
  }

  // Ajouter un listener pour les changements
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Supprimer un listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notifier tous les listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getAll()));
  }

  // Supprimer une unité personnalisée (optionnel)
  remove(unit) {
    const cleanUnit = unit.toLowerCase().trim();
    if (this.defaultUnits.includes(cleanUnit)) return false;
    
    const stored = localStorage.getItem(this.storageKey);
    const customUnits = stored ? JSON.parse(stored) : [];
    
    const filtered = customUnits.filter(u => u !== cleanUnit);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    
    this.notifyListeners();
    return true;
  }

  // Réinitialiser aux unités par défaut
  reset() {
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }
}

export const measurementUnitService = new MeasurementUnitService();
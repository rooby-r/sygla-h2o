// Service pour gérer les types de produits
class ProductTypeService {
  constructor() {
    this.storageKey = 'product_types';
    this.defaultTypes = ['eau', 'glace'];
    this.listeners = [];
  }

  // Récupérer tous les types de produits
  getAll() {
    const stored = localStorage.getItem(this.storageKey);
    const customTypes = stored ? JSON.parse(stored) : [];
    return [...this.defaultTypes, ...customTypes];
  }

  // Ajouter un nouveau type
  add(newType) {
    if (!newType || typeof newType !== 'string') return false;
    
    const cleanType = newType.toLowerCase().trim();
    if (this.exists(cleanType)) return false;
    
    const stored = localStorage.getItem(this.storageKey);
    const customTypes = stored ? JSON.parse(stored) : [];
    
    customTypes.push(cleanType);
    localStorage.setItem(this.storageKey, JSON.stringify(customTypes));
    
    // Notifier tous les listeners
    this.notifyListeners();
    return true;
  }

  // Vérifier si un type existe déjà
  exists(type) {
    const allTypes = this.getAll();
    return allTypes.includes(type.toLowerCase().trim());
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

  // Supprimer un type personnalisé (optionnel)
  remove(type) {
    const cleanType = type.toLowerCase().trim();
    if (this.defaultTypes.includes(cleanType)) return false;
    
    const stored = localStorage.getItem(this.storageKey);
    const customTypes = stored ? JSON.parse(stored) : [];
    
    const filtered = customTypes.filter(t => t !== cleanType);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    
    this.notifyListeners();
    return true;
  }

  // Réinitialiser aux types par défaut
  reset() {
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }
}

export const productTypeService = new ProductTypeService();
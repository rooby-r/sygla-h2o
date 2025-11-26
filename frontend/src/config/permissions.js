// Configuration des permissions par rôle
export const rolePermissions = {
  admin: {
    name: 'Administrateur',
    description: 'Accès complet au système',
    canAccess: {
      dashboard: true,
      clients: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: true },
      orders: { view: true, create: true, edit: true, delete: true, validate: true },
      sales: { view: true, create: true, edit: true, delete: true },
      deliveries: { view: true, create: true, edit: true, delete: true, assign: true },
      reports: { view: true, export: true },
      logs: { view: true, export: true, clear: true },
      users: { view: true, create: true, edit: true, delete: true },
      settings: true
    },
    menu: [
      { path: '/dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard' },
      { path: '/clients', label: 'Clients', icon: 'Users' },
      { path: '/products', label: 'Produits', icon: 'Package' },
      { path: '/sales', label: 'Ventes', icon: 'DollarSign' },
      { path: '/orders', label: 'Commandes', icon: 'ShoppingCart' },
      { path: '/deliveries', label: 'Livraisons', icon: 'Truck' },
      { path: '/reports', label: 'Rapports', icon: 'BarChart3' }
    ]
  },
  
  vendeur: {
    name: 'Vendeur',
    description: 'Gestion des clients et commandes',
    canAccess: {
      dashboard: true,
      clients: { view: true, create: true, edit: true, delete: false },
      products: { view: true, create: false, edit: false, delete: false },
      orders: { view: true, create: true, edit: true, delete: false, validate: false },
      sales: { view: true, create: true, edit: true, delete: false },
      deliveries: { view: true, create: false, edit: false, delete: false, assign: false },
      reports: { view: true, export: false },
      logs: { view: false, export: false, clear: false },
      users: { view: false, create: false, edit: false, delete: false },
      settings: false
    },
    menu: [
      { path: '/dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard' },
      { path: '/clients', label: 'Clients', icon: 'Users' },
      { path: '/sales', label: 'Ventes', icon: 'DollarSign' },
      { path: '/orders', label: 'Commandes', icon: 'ShoppingCart' },
      { path: '/products', label: 'Produits', icon: 'Package' },
      { path: '/reports', label: 'Rapports', icon: 'BarChart3' }
    ]
  },
  
  stock: {
    name: 'Gestionnaire de Stock',
    description: 'Gestion des produits et stocks',
    canAccess: {
      dashboard: true,
      clients: { view: true, create: false, edit: false, delete: false },
      products: { view: true, create: true, edit: true, delete: false },
      orders: { view: true, create: false, edit: false, delete: false, validate: false },
      deliveries: { view: true, create: false, edit: false, delete: false, assign: false },
      reports: { view: true, export: false },
      logs: { view: false, export: false, clear: false },
      users: { view: false, create: false, edit: false, delete: false },
      settings: false
    },
    menu: [
      { path: '/dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard' },
      { path: '/products', label: 'Produits', icon: 'Package' },
      { path: '/orders', label: 'Commandes', icon: 'ShoppingCart' },
      { path: '/reports', label: 'Rapports', icon: 'BarChart3' }
    ]
  },
  
  livreur: {
    name: 'Livreur',
    description: 'Gestion des livraisons',
    canAccess: {
      dashboard: true,
      clients: { view: true, create: false, edit: false, delete: false },
      products: { view: true, create: false, edit: false, delete: false },
      orders: { view: true, create: false, edit: false, delete: false, validate: false },
      deliveries: { view: true, create: false, edit: true, delete: false, assign: false },
      reports: { view: false, export: false },
      logs: { view: false, export: false, clear: false },
      users: { view: false, create: false, edit: false, delete: false },
      settings: false
    },
    menu: [
      { path: '/dashboard', label: 'Tableau de Bord', icon: 'LayoutDashboard' },
      { path: '/deliveries', label: 'Mes Livraisons', icon: 'Truck' },
      { path: '/orders', label: 'Commandes', icon: 'ShoppingCart' }
    ]
  }
};

// Fonction pour vérifier les permissions
export const hasPermission = (user, module, action = 'view') => {
  if (!user || !user.role) return false;
  
  const permissions = rolePermissions[user.role];
  if (!permissions) return false;
  
  const modulePermissions = permissions.canAccess[module];
  if (typeof modulePermissions === 'boolean') return modulePermissions;
  if (typeof modulePermissions === 'object') return modulePermissions[action] || false;
  
  return false;
};

// Fonction pour obtenir le menu basé sur le rôle
export const getMenuForRole = (role) => {
  const permissions = rolePermissions[role];
  return permissions ? permissions.menu : [];
};

// Fonction pour rediriger vers la page d'accueil appropriée
export const getDefaultRoute = (role) => {
  return '/dashboard'; // Tous les rôles commencent au dashboard
};

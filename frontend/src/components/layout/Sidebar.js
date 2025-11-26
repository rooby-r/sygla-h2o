import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Truck, 
  BarChart3, 
  Settings,
  LogOut,
  X,
  ChevronRight,
  Droplets,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { toast } from 'react-hot-toast';
import { clientService, productService, orderService } from '../../services/api';
import venteService from '../../services/venteService';
import { getMenuForRole } from '../../config/permissions';

const Sidebar = ({ isOpen, setIsOpen, isDesktop, isMobile, isTablet }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { dashboardUpdateTrigger } = useDataUpdate();
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // States pour les counts réels de la base de données
  const [counts, setCounts] = useState({
    clients: 0,
    products: 0,
    orders: 0,
    sales: 0,
    deliveries: 0
  });

  // Charger les données réelles au montage du composant et lors des mises à jour
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Charger les données en parallèle
        const [clientsRes, productsRes, ordersRes, ventesRes] = await Promise.all([
          clientService.getAll(),
          productService.getAll(),
          orderService.getAll(),
          venteService.getVentes()
        ]);

        // Les données sont paginées avec le format {count, results}
        const clientCount = clientsRes.count || 0;
        const productCount = productsRes.count || 0;
        const orderCount = ordersRes.count || 0;
        const salesCount = ventesRes.count || 0;
        
        // Pour les livraisons, compter les commandes livrées
        const orders = ordersRes.results || [];
        const deliveryCount = orders.filter(order => 
          order.statut === 'livree'
        ).length;

        setCounts({
          clients: clientCount,
          products: productCount,
          orders: orderCount,
          sales: salesCount,
          deliveries: deliveryCount
        });
        
        console.log('📊 Statistiques sidebar mises à jour:', {
          clients: clientCount,
          products: productCount,
          orders: orderCount,
          sales: salesCount,
          deliveries: deliveryCount,
          trigger: dashboardUpdateTrigger
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Garder les valeurs par défaut en cas d'erreur
      }
    };

    loadCounts();
  }, [dashboardUpdateTrigger]); // Se recharge automatiquement lors des ajouts/suppressions

  // Mapper les icônes pour le menu dynamique
  const iconMap = {
    'LayoutDashboard': LayoutDashboard,
    'Home': Home,
    'Users': Users,
    'Package': Package,
    'ShoppingCart': ShoppingCart,
    'DollarSign': DollarSign,
    'Truck': Truck,
    'BarChart3': BarChart3,
    'FileText': FileText,
    'Settings': Settings
  };

  const colorMap = {
    '/dashboard': 'text-primary-400',
    '/clients': 'text-blue-400',
    '/products': 'text-green-400',
    '/orders': 'text-yellow-400',
    '/sales': 'text-emerald-400',
    '/deliveries': 'text-orange-400',
    '/reports': 'text-purple-400',
    '/logs': 'text-cyan-400',
    '/settings': 'text-gray-400'
  };

  const countMap = {
    '/clients': counts.clients,
    '/products': counts.products,
    '/orders': counts.orders,
    '/sales': counts.sales,
    '/deliveries': counts.deliveries
  };

  // Obtenir le menu basé sur le rôle de l'utilisateur
  const roleMenu = user ? getMenuForRole(user.role) : [];
  
  const menuItems = roleMenu.map(item => ({
    id: item.path.replace('/', ''),
    label: item.label,
    path: item.path,
    icon: iconMap[item.icon] || Home,
    color: colorMap[item.path] || 'text-gray-400',
    count: countMap[item.path]
  }));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: -320,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <>
      {/* Sidebar - Responsive width et positioning */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        className={`${
          isDesktop 
            ? 'fixed left-0 top-0 h-full w-80 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700 z-40' 
            : isMobile
            ? 'fixed left-0 top-0 h-full w-full sm:w-80 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700 z-50'
            : 'fixed left-0 top-0 h-full w-80 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700 z-50'
        } flex flex-col shadow-2xl`}
      >
        {/* Header - Responsive padding */}
        <div className="p-4 sm:p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500">
                <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gradient">SYGLA-H2O</h1>
                <p className="text-xs text-dark-400">Gestion Eau & Glace</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 hover:bg-dark-700 rounded-lg transition-colors ${isDesktop ? 'hidden' : ''}`}
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        {/* User Info - Responsive padding */}
        <div className="p-4 sm:p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Profil"
                className="w-10 h-10 flex-shrink-0 rounded-full object-cover border-2 border-primary-500/30"
              />
            ) : (
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-sm sm:text-base">
                {user?.email || 'Administrateur'}
              </p>
              <p className="text-dark-400 text-xs sm:text-sm capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Responsive padding */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="space-y-1 sm:space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <motion.div
                  key={item.id}
                  custom={index}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  onHoverStart={() => setHoveredItem(item.id)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group relative flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                          : 'text-dark-300 hover:text-white hover:bg-dark-800'
                      }`
                    }
                    onClick={() => !isDesktop && setIsOpen(false)}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isActive ? item.color : 'text-dark-400 group-hover:text-white'}`} />
                    
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
                      {item.count > 0 && (
                        <span className={`px-2 py-0.5 sm:py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                          isActive 
                            ? 'bg-primary-500/30 text-primary-200' 
                            : 'bg-dark-700 text-dark-300 group-hover:bg-dark-600'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-2 w-1 h-6 bg-gradient-to-b from-primary-400 to-secondary-400 rounded-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Hover effect */}
                    {hoveredItem === item.id && !isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-3"
                      >
                        <ChevronRight className="w-4 h-4 text-dark-400" />
                      </motion.div>
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 space-y-2">
          <NavLink
            to="/settings"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Paramètres</span>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-dark-300 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
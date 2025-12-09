import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, X, ShoppingCart, Package, Users, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderService, clientService, productService } from '../../services/api';
import venteService from '../../services/venteService';
import notificationService from '../../services/notificationService';
import { formatHTG } from '../../utils/currency';
import { useDataUpdate } from '../../contexts/DataUpdateContext';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ onMenuToggle, isSidebarOpen, isMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notificationUpdateTrigger } = useDataUpdate();
  const { theme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const [notificationClicked, setNotificationClicked] = useState(false);
  
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Fonction pour obtenir le titre et sous-titre en fonction de la route
  const getPageInfo = () => {
    const path = location.pathname;
    
    // Pages de détails avec ID
    if (path.includes('/orders/') && path !== '/orders') {
      return { title: 'Détail de la Commande', subtitle: 'Consultez les détails de la commande' };
    }
    if (path.includes('/sales/') && path !== '/sales') {
      return { title: 'Détail de la Vente', subtitle: 'Consultez les détails de la vente' };
    }
    if (path.includes('/clients/') && path !== '/clients') {
      return { title: 'Détail du Client', subtitle: 'Informations complètes du client' };
    }
    if (path.includes('/products/') && path !== '/products') {
      return { title: 'Détail du Produit', subtitle: 'Informations et stock du produit' };
    }

    // Pages principales
    switch (path) {
      case '/':
      case '/dashboard':
        return { title: 'Tableau de Bord', subtitle: 'Bienvenue dans votre système de gestion' };
      
      case '/sales':
        return { title: 'Ventes', subtitle: 'Gestion des ventes finalisées' };
      
      case '/sales/new':
        return { title: 'Nouvelle Vente', subtitle: 'Créer une nouvelle vente' };
      
      case '/orders':
        return { title: 'Commandes', subtitle: 'Gestion des commandes et paiements' };
      
      case '/orders/new':
        return { title: 'Nouvelle Commande', subtitle: 'Créer une nouvelle commande' };
      
      case '/clients':
        return { title: 'Clients', subtitle: 'Gestion de la base clients' };
      
      case '/clients/new':
        return { title: 'Nouveau Client', subtitle: 'Ajouter un nouveau client' };
      
      case '/products':
        return { title: 'Produits', subtitle: 'Catalogue et gestion du stock' };
      
      case '/products/new':
        return { title: 'Nouveau Produit', subtitle: 'Ajouter un nouveau produit' };
      
      case '/reports':
        return { title: 'Rapports', subtitle: 'Statistiques et analyses' };
      
      case '/deliveries':
        return { title: 'Livraisons', subtitle: 'Gestion des livraisons' };
      
      case '/settings':
        return { title: 'Paramètres', subtitle: 'Configuration du système' };
      
      default:
        return { title: 'Tableau de Bord', subtitle: 'Bienvenue dans votre système de gestion' };
    }
  };

  const pageInfo = getPageInfo();

  // Fermer les dropdowns quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les notifications au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Recharger les notifications toutes les 5 secondes
      const interval = setInterval(() => {
        loadNotifications();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Recharger les notifications quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ Page visible, rechargement des notifications...');
        loadNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);
  
  // Recharger les notifications quand le trigger change (après une action)
  useEffect(() => {
    if (user && notificationUpdateTrigger > 0) {
      console.log('🔔 Trigger de notification détecté, rechargement...');
      loadNotifications();
    }
  }, [notificationUpdateTrigger, user]);

  // Recherche en temps réel
  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setSearchLoading(true);
    try {
      const [ordersRes, clientsRes, productsRes, ventesRes] = await Promise.all([
        orderService.getAll().catch(() => ({ results: [] })),
        clientService.getAll().catch(() => ({ results: [] })),
        productService.getAll().catch(() => ({ results: [] })),
        venteService.getVentes().catch(() => ({ results: [] }))
      ]);

      const query = searchQuery.toLowerCase();
      const results = [];

      // Recherche dans les commandes
      (ordersRes.results || ordersRes || [])
        .filter(order => 
          order.numero_commande?.toLowerCase().includes(query) ||
          order.client_nom?.toLowerCase().includes(query)
        )
        .slice(0, 3)
        .forEach(order => {
          results.push({
            type: 'order',
            icon: ShoppingCart,
            title: order.numero_commande,
            subtitle: `Client: ${order.client_nom || 'N/A'}`,
            info: formatHTG(order.montant_total),
            path: `/orders/${order.id}`
          });
        });

      // Recherche dans les ventes
      (ventesRes.results || ventesRes || [])
        .filter(vente => 
          vente.numero_vente?.toLowerCase().includes(query) ||
          vente.client_nom?.toLowerCase().includes(query)
        )
        .slice(0, 3)
        .forEach(vente => {
          results.push({
            type: 'sale',
            icon: DollarSign,
            title: vente.numero_vente,
            subtitle: `Client: ${vente.client_nom || 'N/A'}`,
            info: formatHTG(vente.montant_total),
            path: `/sales/${vente.id}`
          });
        });

      // Recherche dans les clients
      (clientsRes.results || clientsRes || [])
        .filter(client => 
          client.nom_commercial?.toLowerCase().includes(query) ||
          client.raison_sociale?.toLowerCase().includes(query) ||
          client.contact?.toLowerCase().includes(query) ||
          client.telephone?.toLowerCase().includes(query)
        )
        .slice(0, 3)
        .forEach(client => {
          results.push({
            type: 'client',
            icon: Users,
            title: client.nom_commercial || client.raison_sociale,
            subtitle: client.telephone || client.email,
            info: client.contact,
            path: `/clients/${client.id}`
          });
        });

      // Recherche dans les produits
      (productsRes.results || productsRes || [])
        .filter(product => 
          product.nom?.toLowerCase().includes(query) ||
          product.code_produit?.toLowerCase().includes(query)
        )
        .slice(0, 3)
        .forEach(product => {
          results.push({
            type: 'product',
            icon: Package,
            title: product.nom,
            subtitle: product.code_produit,
            info: `Stock: ${product.stock_actuel}`,
            path: `/products/${product.id}`
          });
        });

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      console.log('🔄 Chargement des notifications...');
      console.log('👤 Utilisateur connecté:', user);
      
      // Récupérer les notifications depuis l'API backend
      const notificationsData = await notificationService.getNotifications();
      console.log('📬 Notifications reçues du backend:', notificationsData);
      console.log('📊 Type de données:', typeof notificationsData, Array.isArray(notificationsData));
      
      // Vérifier si c'est un tableau ou un objet avec results
      const notifArray = Array.isArray(notificationsData) 
        ? notificationsData 
        : (notificationsData.results || notificationsData.data || []);
      
      console.log('📋 Tableau de notifications:', notifArray.length, 'éléments');
      
      // Mapper les notifications backend vers le format frontend
      const notifs = notifArray.map(notif => {
        // Déterminer l'icône et la couleur selon le type
        let icon, color;
        
        switch (notif.type) {
          // Commandes
          case 'order_created':
          case 'order_validated':
          case 'order_in_preparation':
          case 'order_in_delivery':
          case 'order_delivered':
          case 'order_updated':
            icon = ShoppingCart;
            color = 'info';
            break;
          case 'order_cancelled':
            icon = X;
            color = 'danger';
            break;
          
          // Paiements
          case 'payment_received':
            icon = DollarSign;
            color = 'success';
            break;
          case 'payment_partial':
            icon = Clock;
            color = 'warning';
            break;
          
          // Stock & Produits
          case 'stock_low':
            icon = Package;
            color = 'warning';
            break;
          case 'stock_out':
            icon = Package;
            color = 'danger';
            break;
          case 'product_created':
          case 'product_updated':
          case 'stock_movement':
            icon = Package;
            color = 'info';
            break;
          
          // Clients
          case 'client_created':
          case 'client_updated':
            icon = Users;
            color = 'success';
            break;
          
          // Ventes
          case 'sale_created':
          case 'sale_completed':
            icon = DollarSign;
            color = 'success';
            break;
          
          // Livraisons
          case 'delivery_assigned':
          case 'delivery_completed':
            icon = ShoppingCart;
            color = 'info';
            break;
          
          default:
            icon = Bell;
            color = 'info';
        }
        
        // Déterminer le path de navigation
        let path = '/dashboard';
        if (notif.related_order_id) {
          path = `/orders/${notif.related_order_id}`;
        } else if (notif.related_product_id) {
          path = `/products/${notif.related_product_id}`;
        } else if (notif.related_client_id) {
          path = `/clients/${notif.related_client_id}`;
        } else if (notif.related_sale_id) {
          path = `/sales/${notif.related_sale_id}`;
        }
        
        return {
          id: notif.id,
          type: notif.type,
          icon,
          title: notif.title,
          message: notif.message,
          time: new Date(notif.created_at),
          timeAgo: notif.time_ago,
          color,
          path,
          isRead: notif.is_read
        };
      });

      console.log('📋 Notifications mappées:', notifs);
      console.log('🔢 Nombre de non lues:', notifs.filter(n => !n.isRead).length);
      
      setNotifications(notifs);
      
      // Calculer le nombre de notifications non lues
      const unread = notifs.filter(n => !n.isRead).length;
      
      console.log('📊 Comptage:', { unread, previousUnreadCount, notificationClicked });
      
      // Détecter si de nouvelles notifications sont arrivées
      if (unread > previousUnreadCount && previousUnreadCount >= 0) {
        console.log('🆕 Nouvelles notifications détectées!', unread - previousUnreadCount);
        setHasNewNotifications(true);
        setNotificationClicked(false); // Autoriser l'animation pour les nouvelles
      }
      
      setPreviousUnreadCount(unread);
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  };

  const handleSearchResultClick = (result) => {
    navigate(result.path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleNotificationClick = async (notif) => {
    try {
      // Marquer la notification comme lue dans le backend
      if (!notif.isRead) {
        await notificationService.markAsRead(notif.id);
        
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
        
        // Mettre à jour le compteur
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Naviguer vers la page liée
      navigate(notif.path);
      setShowNotifications(false);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      // Naviguer quand même vers la page
      navigate(notif.path);
      setShowNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Mettre à jour toutes les notifications comme lues
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };


  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl px-3 sm:px-4 md:px-6 py-3 sm:py-4 sticky top-0 z-30 ${
        theme === 'light' 
          ? 'bg-white/95 border-b border-gray-200' 
          : 'bg-dark-900/95 border-b border-dark-700'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left section - Responsive */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className={`p-2 rounded-lg transition-colors lg:hidden flex-shrink-0 ${
              theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-dark-700'
            }`}
            aria-label="Menu"
          >
            <Menu className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === 'light' ? 'text-gray-500' : 'text-dark-300'}`} />
          </button>
          
          <div className="hidden sm:block min-w-0">
            <h2 className={`text-lg sm:text-xl font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {pageInfo.title}
            </h2>
            <p className={`text-xs sm:text-sm truncate ${theme === 'light' ? 'text-gray-500' : 'text-dark-400'}`}>
              {pageInfo.subtitle}
            </p>
          </div>
          
          {/* Titre mobile - version courte */}
          <div className="block sm:hidden min-w-0 flex-1">
            <h2 className={`text-base font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {pageInfo.title}
            </h2>
          </div>
        </div>

        {/* Right section - Responsive spacing */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
          {/* Search - Hidden on mobile */}
          <div ref={searchRef} className="relative hidden md:block">
            <div className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
              theme === 'light' ? 'bg-gray-100' : 'bg-dark-800'
            }`}>
              <Search className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-dark-400'}`} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className={`bg-transparent text-sm w-32 lg:w-40 focus:outline-none focus:w-48 lg:focus:w-60 transition-all duration-200 ${
                  theme === 'light' ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-dark-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className={theme === 'light' ? 'text-gray-400 hover:text-gray-700' : 'text-dark-400 hover:text-white'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 ${
                    theme === 'light' 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-dark-800 border border-dark-700'
                  }`}
                >
                  <div className={`p-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-dark-700'}`}>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-dark-300'}`}>
                      {searchLoading ? 'Recherche...' : `${searchResults.length} résultat(s)`}
                    </p>
                  </div>
                  {searchResults.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSearchResultClick(result)}
                        className={`w-full p-3 transition-colors text-left last:border-0 ${
                          theme === 'light'
                            ? 'hover:bg-gray-50 border-b border-gray-100'
                            : 'hover:bg-dark-700 border-b border-dark-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            result.type === 'order' ? 'bg-blue-500/20' :
                            result.type === 'sale' ? 'bg-green-500/20' :
                            result.type === 'client' ? 'bg-purple-500/20' :
                            'bg-orange-500/20'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              result.type === 'order' ? 'text-blue-400' :
                              result.type === 'sale' ? 'text-green-400' :
                              result.type === 'client' ? 'text-purple-400' :
                              'text-orange-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{result.title}</p>
                            <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-500' : 'text-dark-400'}`}>{result.subtitle}</p>
                          </div>
                          <span className="text-primary-400 text-sm font-medium">
                            {result.info}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {searchResults.length === 0 && !searchLoading && (
                    <div className={`p-6 text-center ${theme === 'light' ? 'text-gray-400' : 'text-dark-400'}`}>
                      Aucun résultat trouvé
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <motion.button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                // Arrêter l'animation quand on clique
                setHasNewNotifications(false);
                setNotificationClicked(true);
                // Recharger les notifications à chaque clic pour debug
                if (!showNotifications) {
                  console.log('🔄 Rechargement manuel des notifications...');
                  loadNotifications();
                }
              }}
              className={`relative p-2 rounded-lg transition-colors ${
                theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-dark-700'
              }`}
              animate={hasNewNotifications && unreadCount > 0 ? {
                rotate: [0, -15, 15, -15, 15, 0],
                scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.6,
                repeat: hasNewNotifications ? Infinity : 0,
                repeatDelay: 2
              }}
            >
              <Bell className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-dark-300'}`} />
              {unreadCount > 0 && (
                <motion.span 
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold"
                  animate={hasNewNotifications ? {
                    scale: [1, 1.2, 1, 1.2, 1],
                  } : {}}
                  transition={{
                    duration: 0.6,
                    repeat: hasNewNotifications ? Infinity : 0,
                    repeatDelay: 2
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown - Responsive width */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 ${
                    theme === 'light' 
                      ? 'bg-white border border-gray-200' 
                      : 'bg-dark-800 border border-dark-700'
                  }`}
                >
                  <div className={`p-4 border-b flex items-center justify-between ${
                    theme === 'light' ? 'border-gray-200' : 'border-dark-700'
                  }`}>
                    <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Notifications</h3>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-dark-400'}`}>{unreadCount} non lue(s)</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notif) => {
                      const Icon = notif.icon;
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full p-4 transition-colors text-left last:border-0 ${
                            theme === 'light'
                              ? `hover:bg-gray-50 border-b border-gray-100 ${!notif.isRead ? 'bg-blue-50/50' : ''}`
                              : `hover:bg-dark-700 border-b border-dark-700/50 ${!notif.isRead ? 'bg-dark-750' : ''}`
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              notif.color === 'warning' ? 'bg-warning-500/20' :
                              notif.color === 'danger' ? 'bg-red-500/20' :
                              notif.color === 'info' ? 'bg-blue-500/20' :
                              notif.color === 'success' ? 'bg-green-500/20' :
                              'bg-green-500/20'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                notif.color === 'warning' ? 'text-warning-400' :
                                notif.color === 'danger' ? 'text-red-400' :
                                notif.color === 'info' ? 'text-blue-400' :
                                notif.color === 'success' ? 'text-green-400' :
                                'text-green-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className={`font-medium text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{notif.title}</p>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-dark-300'}`}>{notif.message}</p>
                              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-400' : 'text-dark-500'}`}>{notif.timeAgo || getTimeAgo(notif.time)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center">
                      <Bell className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-gray-300' : 'text-dark-600'}`} />
                      <p className={theme === 'light' ? 'text-gray-400' : 'text-dark-400'}>Aucune notification</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar */}
          <div className="flex items-center space-x-3">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Profil"
                className="w-8 h-8 rounded-full object-cover border-2 border-primary-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className={`text-xs capitalize ${theme === 'light' ? 'text-gray-500' : 'text-dark-400'}`}>
                {user?.role || 'Administrateur'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
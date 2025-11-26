import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

// État initial
const initialState = {
  user: null,
  loading: true,
  error: null,
};

// Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérification des horaires d'accès toutes les 30 secondes
  useEffect(() => {
    const checkAccessAllowed = async () => {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return;
      
      try {
        const user = JSON.parse(userStr);
        
        // Ne vérifier que pour les rôles concernés (pas admin)
        if (user.role === 'admin') return;
        
        const response = await fetch('http://localhost:8000/api/auth/check-access/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (!data.allowed) {
            // Déconnexion immédiate si hors horaires
            console.warn('Déconnexion automatique:', data.message);
            
            // Nettoyer le localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            
            // Dispatcher l'action de logout
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            
            // Afficher une alerte
            alert(data.message || 'Votre session a expiré. Vous êtes en dehors des horaires d\'accès autorisés.');
            
            // Forcer le rechargement vers la page de connexion
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des horaires d\'accès:', error);
      }
    };
    
    // Vérifier immédiatement au chargement
    checkAccessAllowed();
    
    // Puis vérifier toutes les 30 secondes
    const intervalId = setInterval(checkAccessAllowed, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: user });
          
          // Vérifier si le token est encore valide
          try {
            const currentUser = await authService.getCurrentUser();
            dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: currentUser });
          } catch (error) {
            // Token invalide, nettoyer le localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    loadUser();
  }, []);

  // Fonctions d'authentification
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await authService.login(credentials);
      
      // Vérifier si l'utilisateur doit changer son mot de passe
      if (response.must_change_password === true) {
        // Stocker temporairement les informations pour la page de changement de mot de passe
        localStorage.setItem('must_change_password', 'true');
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
        return { success: true, user: response.user, must_change_password: true };
      }
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      return { success: true, user: response.user, must_change_password: false };
    } catch (error) {
      // Extraire le message d'erreur (peut être dans error ou message)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erreur de connexion';
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await authService.register(userData);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur de mise à jour';
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur de changement de mot de passe';
      return { success: false, error: errorMessage };
    }
  };

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Fonction pour mettre à jour directement les données utilisateur (après upload photo par exemple)
  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
    // Mettre à jour aussi dans localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // Fonctions utilitaires pour les permissions
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const canManageStock = () => {
    return state.user?.role === 'admin' || state.user?.role === 'stock';
  };

  const canManageOrders = () => {
    return state.user?.role === 'admin' || state.user?.role === 'vendeur';
  };

  const canManageDeliveries = () => {
    return state.user?.role === 'admin' || state.user?.role === 'livreur';
  };

  const canViewReports = () => {
    return state.user?.role === 'admin' || state.user?.role === 'vendeur';
  };

  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  const value = {
    // État
    user: state.user,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    changePassword,
    clearError,

    // Permissions
    hasRole,
    canManageStock,
    canManageOrders,
    canManageDeliveries,
    canViewReports,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Droplets, Zap, HelpCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const LoginPage = () => {
  const { login, user, loading, error, clearError } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    mode: 'onChange', // Validation en temps réel
  });

  // Observer la valeur de l'email pour validation en temps réel
  const emailValue = watch('email', '');

  // Rediriger si l'utilisateur est déjà connecté (sauf si on force le logout)
  useEffect(() => {
    // Ne rien faire si on est en train de charger
    if (loading) return;
    
    if (user) {
      // Vérifier si l'utilisateur doit changer son mot de passe
      const mustChangePassword = localStorage.getItem('must_change_password') === 'true';
      
      if (mustChangePassword && user.role !== 'admin') {
        navigate('/change-password-required', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [user, loading, navigate, location]);

  // Nettoyer les erreurs au montage
  useEffect(() => {
    clearError();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setIsLoading(true);
    clearError();

    try {
      const result = await login(data);
      
      if (result.success) {
        // Vérifier si l'utilisateur doit changer son mot de passe
        if (result.must_change_password) {
          toast.success('Connexion réussie ! Vous devez changer votre mot de passe.');
          navigate('/change-password-required', { replace: true });
        } else {
          toast.success('Connexion réussie !');
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      } else {
        toast.error(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      let errorMessage;
      
      // Gestion spéciale pour les erreurs de timeout (cold start Render)
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Le serveur est en train de démarrer. Veuillez réessayer dans quelques secondes...';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion ou réessayez.';
      } else {
        errorMessage = err.response?.data?.non_field_errors?.[0] || 
                      err.response?.data?.error || 
                      err.response?.data?.detail ||
                      'Une erreur inattendue s\'est produite';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const floatingIcons = [
    { icon: Droplets, delay: 0 },
    { icon: Zap, delay: 1 },
    { icon: Droplets, delay: 2 },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${theme === 'light' ? 'bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50' : 'bg-dark-900'}`}>
      {/* Fond animé avec grille cyber */}
      <div className={`absolute inset-0 bg-cyber-grid ${theme === 'light' ? 'opacity-5' : 'opacity-10'}`} />
      
      {/* Éléments flottants */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-primary-500/20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, 100, 200],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
          style={{
            left: `${10 + index * 30}%`,
            top: `${20 + index * 20}%`,
          }}
        >
          <item.icon className="w-8 h-8" />
        </motion.div>
      ))}

      {/* Gradients de couleur */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />

      <motion.div
        className="relative z-10 w-full max-w-md p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo et titre */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl mb-6 shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <Droplets className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gradient mb-2">
            SYGLA-H2O
          </h1>
          <p className={`text-lg ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
            Système de Gestion d'Eau Potable & Glace
          </p>
        </motion.div>

        {/* Formulaire de connexion */}
        <motion.div
          className={`card p-8 backdrop-blur-md ${theme === 'light' ? 'bg-white shadow-xl border border-slate-200' : ''}`}
          variants={itemVariants}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Champ email */}
            <motion.div variants={itemVariants}>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                <input
                  type="text"
                  {...register('email', {
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Adresse email invalide'
                    }
                  })}
                  className={`input pl-10 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400' : ''} ${
                    errors.email ? 'input-error border-red-500' : ''
                  }`}
                  placeholder="admin@sygla-h2o.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <span className="inline-block w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.email.message}
                </p>
              )}
            </motion.div>

            {/* Champ mot de passe */}
            <motion.div variants={itemVariants}>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Le mot de passe est requis',
                  })}
                  className={`input pl-10 pr-10 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400' : ''} ${
                    errors.password ? 'input-error' : ''
                  }`}
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-dark-400 hover:text-white'}`}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </motion.div>

            {/* Affichage des erreurs */}
            {error && (
              <motion.div
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Bouton de connexion */}
            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
                className="w-full glow-primary"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </motion.div>
          </form>

          {/* Liens supplémentaires */}
          <motion.div
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <Link 
              to="/forgot-password" 
              className={`inline-flex items-center text-sm hover:underline transition-colors ${theme === 'light' ? 'text-primary-600 hover:text-primary-700' : 'text-primary-400 hover:text-primary-300'}`}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Mot de passe oublié ?
            </Link>
          </motion.div>
        </motion.div>

        {/* Version */}
        <motion.div
          className="text-center mt-8"
          variants={itemVariants}
        >
          <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-dark-500'}`}>
            SYGLA-H2O v1.1.0 - © 2025
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
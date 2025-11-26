import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, AlertTriangle, Shield, LogOut } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordRequired = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const newPassword = watch('new_password');

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      localStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await api.post('/auth/force-change-password/', {
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      if (response.data) {
        toast.success('Mot de passe modifié avec succès !');
        
        // Nettoyer le flag du localStorage
        localStorage.removeItem('must_change_password');
        
        // Rediriger vers le dashboard après un court délai
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Erreur lors du changement de mot de passe';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden p-4">
      {/* Fond animé */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10" />
      
      {/* Gradients de couleur */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-warning-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Alerte en haut */}
        <motion.div
          className="bg-warning-500/10 border-2 border-warning-500/30 rounded-2xl p-6 mb-6 backdrop-blur-md"
          variants={itemVariants}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-warning-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-warning-500 mb-2">
                Changement de mot de passe requis
              </h3>
              <p className="text-dark-300 text-sm">
                Pour des raisons de sécurité, vous devez changer votre mot de passe 
                avant de continuer à utiliser le système.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          className="card p-8 backdrop-blur-md"
          variants={itemVariants}
        >
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl mb-4 shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-dark-400 text-sm">
              Choisissez un mot de passe sécurisé
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nouveau mot de passe */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('new_password', {
                    required: 'Le nouveau mot de passe est requis',
                    minLength: {
                      value: 8,
                      message: 'Le mot de passe doit contenir au moins 8 caractères'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
                    }
                  })}
                  className={`input pl-10 pr-10 ${
                    errors.new_password ? 'input-error' : ''
                  }`}
                  placeholder="Entrez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.new_password.message}
                </p>
              )}
            </motion.div>

            {/* Confirmation mot de passe */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirm_password', {
                    required: 'Veuillez confirmer le mot de passe',
                    validate: value =>
                      value === newPassword || 'Les mots de passe ne correspondent pas'
                  })}
                  className={`input pl-10 pr-10 ${
                    errors.confirm_password ? 'input-error' : ''
                  }`}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.confirm_password.message}
                </p>
              )}
            </motion.div>

            {/* Conseils de sécurité */}
            <motion.div
              className="bg-dark-800/50 border border-dark-700 rounded-lg p-4"
              variants={itemVariants}
            >
              <p className="text-xs text-dark-300 mb-2 font-medium">
                Conseils pour un mot de passe sécurisé :
              </p>
              <ul className="text-xs text-dark-400 space-y-1">
                <li>• Au moins 8 caractères</li>
                <li>• Au moins une lettre majuscule</li>
                <li>• Au moins une lettre minuscule</li>
                <li>• Au moins un chiffre</li>
                <li>• Évitez les mots de passe trop simples</li>
              </ul>
            </motion.div>

            {/* Bouton de soumission */}
            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
                className="w-full glow-primary"
              >
                {isLoading ? 'Modification en cours...' : 'Changer mon mot de passe'}
              </Button>
            </motion.div>

            {/* Bouton de déconnexion */}
            <motion.div variants={itemVariants} className="mt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 text-dark-400 hover:text-white transition-colors py-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Se déconnecter</span>
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Note de sécurité */}
        <motion.div
          className="text-center mt-6"
          variants={itemVariants}
        >
          <p className="text-xs text-dark-500 flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Votre sécurité est notre priorité</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordRequired;

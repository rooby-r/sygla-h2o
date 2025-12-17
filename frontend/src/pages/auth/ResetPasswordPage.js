import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Lock, Droplets, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import api from '../../services/api';

const ResetPasswordPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  // Valider le token au chargement
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsValidating(false);
        return;
      }

      try {
        await api.get(`/auth/password-reset/validate/?token=${token}`);
        setIsValidToken(true);
      } catch (err) {
        console.error('Token invalide:', err);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      await api.post('/auth/password-reset/confirm/', {
        token: token,
        new_password: data.password,
        confirm_password: data.confirmPassword
      });
      setResetSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès !');
      
      // Rediriger vers la connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          'Une erreur s\'est produite. Veuillez réessayer.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  // Validation du mot de passe
  const passwordRequirements = [
    { regex: /.{8,}/, label: 'Au moins 8 caractères' },
    { regex: /[A-Z]/, label: 'Une lettre majuscule' },
    { regex: /[a-z]/, label: 'Une lettre minuscule' },
    { regex: /[0-9]/, label: 'Un chiffre' },
  ];

  const checkRequirement = (regex) => password && regex.test(password);

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${theme === 'light' ? 'bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50' : 'bg-dark-900'}`}>
      {/* Fond animé avec grille cyber */}
      <div className={`absolute inset-0 bg-cyber-grid ${theme === 'light' ? 'opacity-5' : 'opacity-10'}`} />
      
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
            Nouveau mot de passe
          </p>
        </motion.div>

        {/* Contenu principal */}
        <motion.div
          className={`card p-8 backdrop-blur-md ${theme === 'light' ? 'bg-white shadow-xl border border-slate-200' : ''}`}
          variants={itemVariants}
        >
          {isValidating ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
                Vérification du lien...
              </p>
            </div>
          ) : !isValidToken ? (
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-red-100' : 'bg-red-500/20'}`}>
                <XCircle className={`w-8 h-8 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                Lien invalide ou expiré
              </h3>
              <p className={`mb-6 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Ce lien de réinitialisation n'est plus valide. Veuillez faire une nouvelle demande.
              </p>
              <Link to="/forgot-password">
                <Button variant="primary" className="glow-primary">
                  Nouvelle demande
                </Button>
              </Link>
            </motion.div>
          ) : resetSuccess ? (
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-green-100' : 'bg-green-500/20'}`}>
                <CheckCircle className={`w-8 h-8 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                Mot de passe réinitialisé !
              </h3>
              <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Votre mot de passe a été changé avec succès.
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Redirection vers la connexion...
              </p>
            </motion.div>
          ) : (
            <>
              <div className={`mb-6 p-4 rounded-lg ${theme === 'light' ? 'bg-amber-50 border border-amber-100' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                <div className="flex items-start">
                  <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
                  <p className={`text-sm ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>
                    Créez un nouveau mot de passe sécurisé pour votre compte.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Nouveau mot de passe */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Le mot de passe est requis',
                        minLength: {
                          value: 8,
                          message: 'Au moins 8 caractères requis'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Doit contenir majuscule, minuscule et chiffre'
                        }
                      })}
                      className={`input pl-10 pr-10 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800' : ''} ${
                        errors.password ? 'input-error' : ''
                      }`}
                      placeholder="Nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-dark-400 hover:text-white'}`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                  )}
                  
                  {/* Indicateurs de force */}
                  {password && (
                    <div className="mt-3 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {checkRequirement(req.regex) ? (
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400 mr-2" />
                          )}
                          <span className={checkRequirement(req.regex) ? 'text-green-500' : (theme === 'light' ? 'text-slate-500' : 'text-dark-400')}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Confirmer mot de passe */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword', {
                        required: 'Confirmez le mot de passe',
                        validate: value => value === password || 'Les mots de passe ne correspondent pas'
                      })}
                      className={`input pl-10 pr-10 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800' : ''} ${
                        errors.confirmPassword ? 'input-error' : ''
                      }`}
                      placeholder="Confirmer le mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-dark-400 hover:text-white'}`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
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
                    {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                  </Button>
                </motion.div>
              </form>
            </>
          )}

          {/* Lien retour */}
          <motion.div
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <Link 
              to="/login" 
              className={`inline-flex items-center text-sm hover:underline ${theme === 'light' ? 'text-primary-600 hover:text-primary-700' : 'text-primary-400 hover:text-primary-300'}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour à la connexion
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

export default ResetPasswordPage;

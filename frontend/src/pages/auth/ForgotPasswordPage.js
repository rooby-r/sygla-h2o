import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Mail, Droplets, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      await api.post('/auth/password-reset/', { email: data.email });
      setEmailSent(true);
      setSentEmail(data.email);
      toast.success('Instructions envoyées par email !');
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
            Récupération de mot de passe
          </p>
        </motion.div>

        {/* Formulaire ou message de succès */}
        <motion.div
          className={`card p-8 backdrop-blur-md ${theme === 'light' ? 'bg-white shadow-xl border border-slate-200' : ''}`}
          variants={itemVariants}
        >
          {!emailSent ? (
            <>
              <div className={`mb-6 p-4 rounded-lg ${theme === 'light' ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                <p className={`text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Champ email */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-200'}`}>
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                    <input
                      type="email"
                      {...register('email', {
                        required: 'L\'email est requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Adresse email invalide'
                        }
                      })}
                      className={`input pl-10 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400' : ''} ${
                        errors.email ? 'input-error' : ''
                      }`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </motion.div>

                {/* Bouton d'envoi */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    disabled={isLoading}
                    className="w-full glow-primary"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                  </Button>
                </motion.div>
              </form>
            </>
          ) : (
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-green-100' : 'bg-green-500/20'}`}>
                <CheckCircle className={`w-8 h-8 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                Email envoyé !
              </h3>
              <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Un lien de réinitialisation a été envoyé à :
              </p>
              <p className={`font-medium mb-6 ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`}>
                {sentEmail}
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Vérifiez votre boîte de réception et vos spams. Le lien expire dans 1 heure.
              </p>
            </motion.div>
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

export default ForgotPasswordPage;

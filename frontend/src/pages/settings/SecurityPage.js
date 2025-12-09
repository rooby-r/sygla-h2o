import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save, AlertCircle, Lock, Clock, Key, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

const SecurityPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    session_timeout: 30,
    max_login_attempts: 5,
    lockout_duration: 15,
    password_min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: false,
    jwt_access_token_lifetime: 60,
    jwt_refresh_token_lifetime: 1440,
    enable_two_factor: false,
    force_password_change: 0
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/security-settings/');
      setSettings(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/auth/security-settings/update/', settings);
      toast.success('Paramètres de sécurité mis à jour');
      fetchSettings();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Paramètres de Sécurité</h2>
        <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>
          Configurez les règles de sécurité et d'authentification du système
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session & Authentification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Session & Connexion</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Gestion des sessions utilisateurs</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Session Timeout */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Timeout de session (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.session_timeout}
                onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Déconnexion automatique après {settings.session_timeout} minutes d'inactivité
              </p>
            </div>

            {/* Max Login Attempts */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Tentatives de connexion maximales
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.max_login_attempts}
                onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Nombre de tentatives avant blocage du compte
              </p>
            </div>

            {/* Lockout Duration */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Durée de blocage (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.lockout_duration}
                onChange={(e) => handleChange('lockout_duration', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Temps de blocage après échec des tentatives de connexion
              </p>
            </div>
          </div>
        </motion.div>

        {/* Politique de mot de passe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Lock className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Politique de Mot de Passe</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Règles de complexité</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Password Min Length */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Longueur minimale
              </label>
              <input
                type="number"
                min="6"
                max="20"
                value={settings.password_min_length}
                onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Au moins {settings.password_min_length} caractères requis
              </p>
            </div>

            {/* Password Requirements */}
            <div className="space-y-3">
              <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>Exigences de caractères</p>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_uppercase}
                  onChange={(e) => handleChange('require_uppercase', e.target.checked)}
                  className={`w-5 h-5 rounded text-primary-500 focus:ring-primary-500 ${theme === 'light' ? 'border-slate-300 bg-white focus:ring-offset-white' : 'border-dark-600 bg-dark-700 focus:ring-offset-dark-800'}`}
                />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>Au moins une majuscule (A-Z)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_lowercase}
                  onChange={(e) => handleChange('require_lowercase', e.target.checked)}
                  className={`w-5 h-5 rounded text-primary-500 focus:ring-primary-500 ${theme === 'light' ? 'border-slate-300 bg-white focus:ring-offset-white' : 'border-dark-600 bg-dark-700 focus:ring-offset-dark-800'}`}
                />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>Au moins une minuscule (a-z)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_numbers}
                  onChange={(e) => handleChange('require_numbers', e.target.checked)}
                  className={`w-5 h-5 rounded text-primary-500 focus:ring-primary-500 ${theme === 'light' ? 'border-slate-300 bg-white focus:ring-offset-white' : 'border-dark-600 bg-dark-700 focus:ring-offset-dark-800'}`}
                />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>Au moins un chiffre (0-9)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_special_chars}
                  onChange={(e) => handleChange('require_special_chars', e.target.checked)}
                  className={`w-5 h-5 rounded text-primary-500 focus:ring-primary-500 ${theme === 'light' ? 'border-slate-300 bg-white focus:ring-offset-white' : 'border-dark-600 bg-dark-700 focus:ring-offset-dark-800'}`}
                />
                <span className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>Au moins un caractère spécial (!@#$%)</span>
              </label>
            </div>

            {/* Force Password Change */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Forcer changement de mot de passe (jours)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={settings.force_password_change}
                onChange={(e) => handleChange('force_password_change', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                {settings.force_password_change === 0 
                  ? 'Désactivé - les utilisateurs ne sont pas forcés à changer leur mot de passe'
                  : `Les utilisateurs devront changer leur mot de passe tous les ${settings.force_password_change} jours`
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tokens JWT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Key className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Tokens JWT</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Durée de validité des tokens</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Access Token Lifetime */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Token d'accès (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.jwt_access_token_lifetime}
                onChange={(e) => handleChange('jwt_access_token_lifetime', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Durée de validité: {settings.jwt_access_token_lifetime} minutes
              </p>
            </div>

            {/* Refresh Token Lifetime */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                Token de rafraîchissement (minutes)
              </label>
              <input
                type="number"
                min="60"
                max="10080"
                value={settings.jwt_refresh_token_lifetime}
                onChange={(e) => handleChange('jwt_refresh_token_lifetime', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-dark-700 border-dark-600 text-white'}`}
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Durée de validité: {Math.floor(settings.jwt_refresh_token_lifetime / 60)} heures ({Math.floor(settings.jwt_refresh_token_lifetime / 1440)} jours)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Fonctionnalités avancées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Fonctionnalités Avancées</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Sécurité supplémentaire</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Two Factor Auth */}
            <label className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-dark-800 hover:bg-dark-700'}`}>
              <div>
                <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Authentification à deux facteurs</p>
                <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Activer 2FA pour tous les utilisateurs (futur)</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.enable_two_factor}
                  onChange={(e) => handleChange('enable_two_factor', e.target.checked)}
                  className="sr-only"
                  disabled
                />
                <div className={`block w-12 h-6 rounded-full transition ${
                  settings.enable_two_factor ? 'bg-primary-500' : theme === 'light' ? 'bg-slate-300' : 'bg-dark-600'
                }`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                  settings.enable_two_factor ? 'transform translate-x-6' : ''
                }`}></div>
              </div>
            </label>

            <div className={`p-4 rounded-lg flex items-start gap-3 ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'}`}>
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-300'}`}>
                <p className="font-medium mb-1">Note de sécurité</p>
                <p>Ces paramètres affectent tous les utilisateurs du système. Assurez-vous de bien comprendre l'impact avant de modifier.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bouton Enregistrer */}
      <div className="flex justify-end pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2 px-8"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer les paramètres
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SecurityPage;

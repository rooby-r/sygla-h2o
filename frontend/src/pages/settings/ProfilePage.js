import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Save, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

// Fonction pour générer les initiales
const getInitials = (firstName, lastName, email) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
};

// Fonction pour générer une couleur basée sur le nom
const getAvatarColor = (name) => {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
    'from-teal-500 to-cyan-500',
    'from-fuchsia-500 to-purple-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    adresse: ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        adresse: user.adresse || ''
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      // Exclure photo_url qui est en lecture seule et nettoyer le téléphone
      const { photo_url, ...dataToSend } = profileData;
      // Ne jamais envoyer le champ photo si l'utilisateur ne change pas la photo
      if ('photo' in dataToSend && !dataToSend.photo) {
        delete dataToSend.photo;
      }
      // Nettoyer le numéro de téléphone (retirer espaces, tirets, parenthèses)
      if (dataToSend.telephone) {
        dataToSend.telephone = dataToSend.telephone.replace(/[\s\-\(\)]/g, '');
        // Valider le format haïtien (+509 suivi de 8 chiffres)
        const haitiPhoneRegex = /^\+509\d{8}$/;
        if (!haitiPhoneRegex.test(dataToSend.telephone)) {
          toast.error('Le numéro de téléphone doit être au format haïtien: +509 suivi de 8 chiffres');
          setSavingProfile(false);
          return;
        }
      }
      const response = await api.put('/auth/profile/', dataToSend);
      updateUser(response.data);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      console.error('Détails:', error.response?.data);
      toast.error(error.response?.data?.error || error.response?.data?.email?.[0] || error.response?.data?.telephone?.[0] || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setSavingPassword(true);
      await api.post('/auth/change-password/', {
        current_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      });
      
      toast.success('Mot de passe modifié avec succès');
      
      // Réinitialiser le formulaire
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bouton Retour */}
      <button
        onClick={() => navigate('/settings')}
        className={`flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-slate-600 hover:text-slate-800' : 'text-dark-400 hover:text-white'}`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Retour aux paramètres</span>
      </button>

      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Mon Profil</h2>
        <p className={theme === 'light' ? 'text-slate-600' : 'text-dark-300'}>
          Gérez vos informations personnelles et votre mot de passe
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte utilisateur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card p-6 lg:col-span-1 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
        >
          <div className="text-center">
            {/* Avatar avec initiales */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${getAvatarColor(user?.first_name || user?.email || 'User')} flex items-center justify-center border-4 border-white/20 shadow-lg`}>
                <span className="text-white text-3xl font-bold drop-shadow-md">
                  {getInitials(user?.first_name, user?.last_name, user?.email)}
                </span>
              </div>
            </div>
            
            <h3 className={`text-xl font-semibold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {user?.first_name && user?.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user?.email
              }
            </h3>
            <p className={`capitalize mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
              {user?.role || 'Utilisateur'}
            </p>
            <div className={`pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-dark-700'}`}>
              <div className={`text-sm mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Membre depuis</div>
              <div className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {user?.date_creation ? new Date(user.date_creation).toLocaleDateString('fr-FR') : 'N/A'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informations personnelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`card p-6 lg:col-span-2 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Informations Personnelles</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Vos données de profil</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  className={`input ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                  Nom
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  className={`input ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className={`input ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="votre@email.com"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone (Haïti)
              </label>
              <input
                type="tel"
                value={profileData.telephone}
                onChange={(e) => handleProfileChange('telephone', e.target.value)}
                className={`input ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="+509 3456 7890"
              />
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                Format: +509 suivi de 8 chiffres
              </p>
            </div>

            {/* Adresse */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
                <MapPin className="w-4 h-4 inline mr-2" />
                Adresse
              </label>
              <textarea
                value={profileData.adresse}
                onChange={(e) => handleProfileChange('adresse', e.target.value)}
                className={`input min-h-[80px] ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="Votre adresse complète"
              />
            </div>

            {/* Bouton Enregistrer */}
            <div className="flex justify-end pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="btn btn-primary flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Changer le mot de passe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`card p-6 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-md' : ''}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Changer le Mot de Passe</h3>
            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Modifiez votre mot de passe de connexion</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          {/* Ancien mot de passe */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                type={showPasswords.old ? 'text' : 'password'}
                value={passwordData.old_password}
                onChange={(e) => handlePasswordChange('old_password', e.target.value)}
                className={`input pr-12 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="Votre mot de passe actuel"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('old')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-dark-400 hover:text-white'}`}
              >
                {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                className={`input pr-12 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="Votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-dark-400 hover:text-white'}`}
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
              Au moins 8 caractères recommandés
            </p>
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-dark-300'}`}>
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                className={`input pr-12 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="Confirmez votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-dark-400 hover:text-white'}`}
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Bouton Changer */}
          <div className="flex justify-end pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="btn btn-primary flex items-center gap-2"
            >
              {savingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Changement...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Changer le mot de passe
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;

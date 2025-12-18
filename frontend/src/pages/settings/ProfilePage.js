import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Save, Mail, Phone, MapPin, Lock, Eye, EyeOff, Camera, X, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
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
    adresse: '',
    photo_url: null
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
        adresse: user.adresse || '',
        photo_url: user.photo_url || null
      });
      if (user.photo_url) {
        setPhotoPreview(user.photo_url);
      }
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5MB');
        return;
      }

      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Envoyer immédiatement la photo
      handlePhotoUpload(file);
    }
  };

  const handlePhotoUpload = async (file) => {
    try {
      setUploadingPhoto(true);
      console.log('📸 Début upload photo:', file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      console.log('📤 Envoi de la requête...');
      // Supprimer explicitement le Content-Type pour que axios utilise multipart/form-data
      const response = await api.put('/auth/profile/', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      
      console.log('✅ Réponse:', response.data);
      updateUser(response.data);
      toast.success('Photo de profil mise à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload de la photo:', error);
      console.error('❌ Response:', error.response);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Response status:', error.response?.status);
      toast.error(error.response?.data?.error || error.response?.data?.detail || 'Erreur lors de l\'upload de la photo');
      // Revenir à l'ancienne photo en cas d'erreur
      if (user?.photo_url) {
        setPhotoPreview(user.photo_url);
      } else {
        setPhotoPreview(null);
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return;
    }

    try {
      setUploadingPhoto(true);
      
      const response = await api.put('/auth/profile/', {
        remove_photo: 'true'
      });
      
      updateUser(response.data);
      setPhotoPreview(null);
      toast.success('Photo de profil supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression de la photo');
    } finally {
      setUploadingPhoto(false);
    }
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
            {/* Photo de profil avec upload */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profil"
                  className="w-full h-full rounded-full object-cover border-4 border-primary-500/30"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center border-4 border-primary-500/30">
                  <span className="text-white text-3xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              
              {/* Bouton upload/modifier */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                title="Changer la photo"
              >
                {uploadingPhoto ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              
              {/* Bouton supprimer (si photo existe) */}
              {photoPreview && !uploadingPhoto && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                  title="Supprimer la photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              
              {/* Input file caché */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
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
                Téléphone
              </label>
              <input
                type="tel"
                value={profileData.telephone}
                onChange={(e) => handleProfileChange('telephone', e.target.value)}
                className={`input ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : ''}`}
                placeholder="+33 6 12 34 56 78"
              />
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

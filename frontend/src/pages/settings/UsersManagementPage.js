import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search,
  X,
  Eye,
  EyeOff,
  Shield,
  User,
  Mail,
  Phone,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { userService } from '../../services/api';
import Button from '../../components/ui/Button';

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    telephone: '',
    role: 'vendeur',
    password: '',
    confirm_password: ''
  });

  const roles = [
    { value: 'admin', label: 'Administrateur', color: 'text-red-400', icon: Shield },
    { value: 'vendeur', label: 'Vendeur', color: 'text-blue-400', icon: User },
    { value: 'stock', label: 'Gestionnaire Stock', color: 'text-green-400', icon: User },
    { value: 'livreur', label: 'Livreur', color: 'text-orange-400', icon: User }
  ];

  useEffect(() => {
    // Log de l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 [DEBUG] Utilisateur connecté:', currentUser);
    console.log('👤 [DEBUG] Rôle:', currentUser.role);
    console.log('👤 [DEBUG] Est admin?', currentUser.role === 'admin');
    
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 [DEBUG] Début fetchUsers...');
      console.log('🔍 [DEBUG] Token présent:', !!localStorage.getItem('access_token'));
      
      const response = await userService.getAll();
      console.log('📦 [DEBUG] Réponse brute API users:', response);
      console.log('📦 [DEBUG] Type de response:', typeof response);
      console.log('📦 [DEBUG] Est un tableau?', Array.isArray(response));
      console.log('📦 [DEBUG] Clés de response:', Object.keys(response || {}));
      
      // S'assurer que response est un tableau
      const usersData = Array.isArray(response) ? response : (response.results || response.data || []);
      console.log('✅ [DEBUG] usersData final:', usersData);
      console.log('✅ [DEBUG] Nombre utilisateurs:', usersData.length);
      
      // Log des photos
      usersData.forEach(user => {
        console.log(`📸 [DEBUG] ${user.username} - photo:`, user.photo, '- photo_url:', user.photo_url);
      });
      
      setUsers(usersData);
      
      if (usersData.length === 0) {
        console.warn('⚠️ [DEBUG] Aucun utilisateur trouvé dans la réponse!');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors du chargement des utilisateurs:', error);
      console.error('❌ [DEBUG] error.response:', error.response);
      console.error('❌ [DEBUG] error.response.data:', error.response?.data);
      toast.error('Erreur lors du chargement des utilisateurs: ' + (error.response?.data?.detail || error.message));
      setUsers([]); // Initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        telephone: user.telephone || '',
        role: user.role,
        password: '',
        confirm_password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        telephone: '',
        role: 'vendeur',
        password: '',
        confirm_password: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      telephone: '',
      role: 'vendeur',
      password: '',
      confirm_password: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username.trim()) {
      toast.error('Le nom d\'utilisateur est requis');
      return;
    }

    if (!editingUser) {
      if (!formData.password) {
        toast.error('Le mot de passe est requis');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    } else if (formData.password && formData.password !== formData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        telephone: formData.telephone,
        role: formData.role,
        ...(formData.password && { password: formData.password })
      };

      if (editingUser) {
        await userService.update(editingUser.id, userData);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await userService.create(userData);
        toast.success('Utilisateur créé avec succès');
      }

      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.username?.[0] || 
                       'Erreur lors de l\'opération';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      setLoading(true);
      await userService.delete(userId);
      toast.success('Utilisateur supprimé avec succès');
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[1];
  };

  // S'assurer que users est toujours un tableau avant de filtrer
  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-400" />
            Gestion des Utilisateurs
          </h2>
          <p className="text-dark-300">
            Créer et gérer les comptes utilisateurs du système
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          variant="success"
          className="flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && users.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-dark-400 mt-4">Chargement...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          filteredUsers.map((user, index) => {
            const roleInfo = getRoleInfo(user.role);
            const RoleIcon = roleInfo.icon;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-6 hover:border-primary-500/50 transition-all"
              >
                {/* Avatar et rôle */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar - Photo ou Initiale */}
                    {user.photo_url ? (
                      <div className="relative">
                        <img
                          src={user.photo_url}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                          onError={(e) => {
                            console.warn(`❌ Erreur chargement photo pour ${user.username}:`, user.photo_url);
                            // Remplacer par l'initiale en cas d'erreur
                            const parent = e.target.parentElement;
                            const fallback = document.createElement('div');
                            fallback.className = 'w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg';
                            fallback.textContent = user.username.charAt(0).toUpperCase();
                            parent.replaceChild(fallback, e.target);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </h3>
                      <div className={`flex items-center gap-1 ${roleInfo.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        <span className="text-xs font-medium">{roleInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  {user.is_active ? (
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" title="Actif" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-600" title="Inactif" />
                  )}
                </div>

                {/* Informations */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-dark-300">
                    <User className="w-4 h-4 text-dark-400" />
                    <span>{user.username}</span>
                  </div>
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm text-dark-300">
                      <Mail className="w-4 h-4 text-dark-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {user.telephone && (
                    <div className="flex items-center gap-2 text-sm text-dark-300">
                      <Phone className="w-4 h-4 text-dark-400" />
                      <span>{user.telephone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-dark-700">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm">Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Supprimer</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Création/Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-700"
          >
            <div className="sticky top-0 bg-dark-800 border-b border-dark-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                {editingUser ? <Edit3 className="w-6 h-6 text-blue-400" /> : <UserPlus className="w-6 h-6 text-green-400" />}
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-dark-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nom d'utilisateur */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Nom d'utilisateur <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="johndoe"
                  required
                />
              </div>

              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email et Téléphone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="509 XXXX XXXX"
                  />
                </div>
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Rôle <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  required
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mot de passe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Mot de passe {!editingUser && <span className="text-red-400">*</span>}
                    {editingUser && <span className="text-xs text-dark-400 ml-2">(laisser vide pour ne pas changer)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500 pr-12"
                      placeholder="••••••••"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Confirmer mot de passe {!editingUser && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="••••••••"
                    required={!editingUser}
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4 border-t border-dark-700">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="secondary"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant={editingUser ? 'primary' : 'success'}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'En cours...' : editingUser ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;

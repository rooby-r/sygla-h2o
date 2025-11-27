import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Shield, Bell, User, Database, FileText, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const settingsOptions = [
    {
      id: 'users',
      title: 'Gestion des Utilisateurs',
      description: 'Créer et gérer les comptes utilisateurs du système',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      path: '/settings/users',
      adminOnly: true
    },
    {
      id: 'business-hours',
      title: 'Horaires d\'Accès',
      description: 'Configurer les heures de connexion autorisées pour chaque rôle',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      path: '/settings/business-hours',
      adminOnly: true
    },
    {
      id: 'security',
      title: 'Sécurité',
      description: 'Gérer les paramètres de sécurité et authentification',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      path: '/settings/security',
      adminOnly: true
    },
    {
      id: 'connected-users',
      title: 'Utilisateurs Connectés',
      description: 'Voir les utilisateurs actuellement actifs sur le système',
      icon: Users,
      color: 'from-indigo-500 to-blue-500',
      path: '/settings/connected-users',
      adminOnly: true
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configurer les alertes et notifications du système',
      icon: Bell,
      color: 'from-yellow-500 to-orange-500',
      path: '/settings/notifications',
      adminOnly: false
    },
    {
      id: 'profile',
      title: 'Mon Profil',
      description: 'Modifier vos informations personnelles',
      icon: User,
      color: 'from-purple-500 to-pink-500',
      path: '/settings/profile',
      adminOnly: false
    },
    {
      id: 'database',
      title: 'Base de Données',
      description: 'Sauvegarde et maintenance de la base de données',
      icon: Database,
      color: 'from-red-500 to-rose-500',
      path: '/settings/database',
      adminOnly: true
    },
    {
      id: 'logs',
      title: 'Journal des Logs',
      description: 'Consulter l\'historique des actions du système',
      icon: FileText,
      color: 'from-cyan-500 to-blue-500',
      path: '/logs',
      adminOnly: true
    }
  ];

  const filteredOptions = settingsOptions.filter(
    option => !option.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Paramètres</h2>
        <p className="text-dark-300">
          Configurez les options du système selon vos besoins
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOptions.map((option, index) => {
          const Icon = option.icon;
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(option.path)}
              className="card p-6 cursor-pointer hover:border-primary-500/50 transition-all group"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {option.title}
              </h3>
              
              <p className="text-dark-400 text-sm leading-relaxed">
                {option.description}
              </p>
              
              {option.adminOnly && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Shield className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">Admin uniquement</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPage;

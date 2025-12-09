import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Save, Mail, Globe, Package, ShoppingCart, Truck, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

const NotificationsPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    notify_client_created: true,
    notify_order_created: true,
    notify_order_validated: true,
    notify_delivery_assigned: true,
    notify_delivery_completed: true,
    notify_stock_low: true,
    notify_stock_updated: false,
    notify_system_errors: true,
    notify_security_alerts: true,
    notify_daily_report: false,
    notify_weekly_report: false,
    notify_monthly_report: false,
    enable_email_notifications: true,
    enable_browser_notifications: true
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/notification-preferences/');
      setPreferences(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/auth/notification-preferences/update/', preferences);
      toast.success('Préférences enregistrées');
      fetchPreferences();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const notificationSections = [
    {
      title: 'Actions Clients & Commandes',
      icon: ShoppingCart,
      color: 'blue',
      items: [
        { key: 'notify_client_created', label: 'Nouveau client créé', icon: Package },
        { key: 'notify_order_created', label: 'Nouvelle commande créée', icon: ShoppingCart },
        { key: 'notify_order_validated', label: 'Commande validée', icon: ShoppingCart }
      ]
    },
    {
      title: 'Livraisons',
      icon: Truck,
      color: 'green',
      items: [
        { key: 'notify_delivery_assigned', label: 'Livraison assignée', icon: Truck },
        { key: 'notify_delivery_completed', label: 'Livraison terminée', icon: Truck }
      ]
    },
    {
      title: 'Gestion de Stock',
      icon: Package,
      color: 'orange',
      items: [
        { key: 'notify_stock_low', label: 'Alerte stock faible', icon: AlertTriangle },
        { key: 'notify_stock_updated', label: 'Stock mis à jour', icon: Package }
      ]
    },
    {
      title: 'Alertes Système',
      icon: AlertTriangle,
      color: 'red',
      items: [
        { key: 'notify_system_errors', label: 'Erreurs système', icon: AlertTriangle },
        { key: 'notify_security_alerts', label: 'Alertes de sécurité', icon: AlertTriangle }
      ]
    },
    {
      title: 'Rapports',
      icon: FileText,
      color: 'purple',
      items: [
        { key: 'notify_daily_report', label: 'Rapport quotidien', icon: FileText },
        { key: 'notify_weekly_report', label: 'Rapport hebdomadaire', icon: FileText },
        { key: 'notify_monthly_report', label: 'Rapport mensuel', icon: FileText }
      ]
    }
  ];

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
        <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Notifications</h2>
        <p className={theme === 'light' ? 'text-slate-500' : 'text-dark-300'}>
          Configurez vos préférences de notifications et d'alertes
        </p>
      </div>

      {/* Canaux de notification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <Bell className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Canaux de Notification</h3>
            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Comment recevoir vos notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-dark-800 hover:bg-dark-700'}`}>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Notifications Email</p>
                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Recevoir par email</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={preferences.enable_email_notifications}
                onChange={() => handleToggle('enable_email_notifications')}
                className="sr-only"
              />
              <div className={`block w-12 h-6 rounded-full transition ${preferences.enable_email_notifications ? 'bg-primary-500' : theme === 'light' ? 'bg-slate-300' : 'bg-dark-600'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${preferences.enable_email_notifications ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>

          <label className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-dark-800 hover:bg-dark-700'}`}>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-green-400" />
              <div>
                <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Notifications Navigateur</p>
                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Notifications push</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={preferences.enable_browser_notifications}
                onChange={() => handleToggle('enable_browser_notifications')}
                className="sr-only"
              />
              <div className={`block w-12 h-6 rounded-full transition ${preferences.enable_browser_notifications ? 'bg-primary-500' : theme === 'light' ? 'bg-slate-300' : 'bg-dark-600'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${preferences.enable_browser_notifications ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Types de notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {notificationSections.map((section, index) => {
          const SectionIcon = section.icon;
          const colorClasses = {
            blue: 'bg-blue-500/10 text-blue-400',
            green: 'bg-green-500/10 text-green-400',
            orange: 'bg-orange-500/10 text-orange-400',
            red: 'bg-red-500/10 text-red-400',
            purple: 'bg-purple-500/10 text-purple-400'
          };

          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
              className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-dark-800 border-dark-700'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 ${colorClasses[section.color]} rounded-lg`}>
                  <SectionIcon className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{section.title}</h3>
              </div>

              <div className="space-y-3">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-dark-800 hover:bg-dark-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <ItemIcon className={`w-4 h-4 ${theme === 'light' ? 'text-slate-400' : 'text-dark-400'}`} />
                        <span className={theme === 'light' ? 'text-slate-700' : 'text-dark-200'}>{item.label}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences[item.key]}
                          onChange={() => handleToggle(item.key)}
                          className="sr-only"
                        />
                        <div className={`block w-10 h-5 rounded-full transition ${preferences[item.key] ? 'bg-primary-500' : theme === 'light' ? 'bg-slate-300' : 'bg-dark-600'}`}></div>
                        <div className={`absolute left-1 top-0.5 bg-white w-4 h-4 rounded-full transition ${preferences[item.key] ? 'transform translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
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
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer les préférences
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default NotificationsPage;

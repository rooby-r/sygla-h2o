import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const BusinessHoursPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState([]);

  const daysOfWeek = [
    { value: 0, label: 'Lundi' },
    { value: 1, label: 'Mardi' },
    { value: 2, label: 'Mercredi' },
    { value: 3, label: 'Jeudi' },
    { value: 4, label: 'Vendredi' },
    { value: 5, label: 'Samedi' },
    { value: 6, label: 'Dimanche' }
  ];

  const roleLabels = {
    vendeur: 'Vendeur',
    stock: 'Gestionnaire Stock',
    livreur: 'Livreur'
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/business-hours/');
      setConfigs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = (index) => {
    const newConfigs = [...configs];
    newConfigs[index].enabled = !newConfigs[index].enabled;
    setConfigs(newConfigs);
  };

  const handleTimeChange = (index, field, value) => {
    const newConfigs = [...configs];
    newConfigs[index][field] = parseInt(value);
    setConfigs(newConfigs);
  };

  const handleDayToggle = (index, day) => {
    const newConfigs = [...configs];
    const allowedDays = newConfigs[index].allowed_days || [];
    
    if (allowedDays.includes(day)) {
      newConfigs[index].allowed_days = allowedDays.filter(d => d !== day);
    } else {
      newConfigs[index].allowed_days = [...allowedDays, day].sort();
    }
    
    setConfigs(newConfigs);
  };

  const handleSave = async (config) => {
    try {
      setSaving(true);
      await api.post(`/auth/business-hours/${config.role}/`, {
        enabled: config.enabled,
        start_hour: config.start_hour,
        start_minute: config.start_minute,
        end_hour: config.end_hour,
        end_minute: config.end_minute,
        allowed_days: config.allowed_days
      });
      
      toast.success(`Horaires mis à jour pour ${roleLabels[config.role]}`);
      fetchConfigs();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
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
        <h2 className="text-3xl font-bold text-white mb-2">Horaires d'Accès</h2>
        <p className="text-dark-300">
          Configurez les heures de connexion autorisées pour chaque rôle
        </p>
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Note importante :</p>
            <p>Les administrateurs ont toujours un accès 24h/24, 7j/7 sans restriction.</p>
          </div>
        </div>
      </div>

      {/* Configurations */}
      <div className="space-y-4">
        {configs.map((config, index) => (
          <motion.div
            key={config.role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {roleLabels[config.role]}
                  </h3>
                  {config.time_range && (
                    <p className="text-sm text-dark-400">
                      {config.time_range} • {config.allowed_days_display}
                    </p>
                  )}
                </div>
              </div>

              {/* Toggle Restriction */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-dark-300">Restriction activée</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => handleToggleEnabled(index)}
                    className="sr-only"
                  />
                  <div className={`block w-12 h-6 rounded-full transition ${
                    config.enabled ? 'bg-primary-500' : 'bg-dark-700'
                  }`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                    config.enabled ? 'transform translate-x-6' : ''
                  }`}></div>
                </div>
              </label>
            </div>

            {config.enabled && (
              <div className="space-y-6">
                {/* Heures */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Heure de début
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={config.start_hour}
                        onChange={(e) => handleTimeChange(index, 'start_hour', e.target.value)}
                        className="input flex-1"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}h</option>
                        ))}
                      </select>
                      <select
                        value={config.start_minute}
                        onChange={(e) => handleTimeChange(index, 'start_minute', e.target.value)}
                        className="input w-20"
                      >
                        {[0, 15, 30, 45].map(m => (
                          <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Heure de fin
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={config.end_hour}
                        onChange={(e) => handleTimeChange(index, 'end_hour', e.target.value)}
                        className="input flex-1"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}h</option>
                        ))}
                      </select>
                      <select
                        value={config.end_minute}
                        onChange={(e) => handleTimeChange(index, 'end_minute', e.target.value)}
                        className="input w-20"
                      >
                        {[0, 15, 30, 45].map(m => (
                          <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Jours de la semaine */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    Jours autorisés
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => handleDayToggle(index, day.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          (config.allowed_days || []).includes(day.value)
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bouton Sauvegarder */}
                <div className="flex justify-end pt-4 border-t border-dark-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSave(config)}
                    disabled={saving}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Enregistrer
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BusinessHoursPage;

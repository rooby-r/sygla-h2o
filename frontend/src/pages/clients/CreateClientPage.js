import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Building, 
  Mail, 
  MapPin,
  FileText,
  Save,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button.js';
import { clientService } from '../../services/api';
import { useDataUpdate } from '../../contexts/DataUpdateContext';

const CreateClientPage = () => {
  const navigate = useNavigate();
  const { triggerDashboardUpdate } = useDataUpdate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom_commercial: '',
    raison_sociale: '',
    email: '',
    telephone: '',
    adresse: '',
    contact: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!formData.telephone || !formData.adresse || !formData.contact) {
      toast.error('Veuillez remplir tous les champs obligatoires (Téléphone, Adresse, Contact)');
      return;
    }
    
    // Au moins un nom doit être fourni
    if (!formData.nom_commercial && !formData.raison_sociale) {
      toast.error('Veuillez fournir au moins un nom (commercial ou raison sociale)');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Données du formulaire:', formData);
      
      // Envoyer nom_commercial comme raison_sociale également pour satisfaire le backend
      const dataToSend = {
        ...formData,
        raison_sociale: formData.raison_sociale || formData.nom_commercial,
        nom_commercial: formData.nom_commercial || formData.raison_sociale
      };
      
      console.log('Données envoyées:', dataToSend);
      
      const response = await clientService.create(dataToSend);
      console.log('Client créé:', response);
      
      // Déclencher la mise à jour du dashboard et de la sidebar
      triggerDashboardUpdate();
      
      toast.success('Client créé avec succès');
      navigate('/clients');
    } catch (error) {
      console.error('Erreur complète:', error);
      console.error('Réponse d\'erreur:', error.response);
      
      // Afficher plus de détails sur l'erreur
      let errorMessage = 'Erreur lors de la création du client';
      
      if (error.response?.data) {
        // Si c'est un objet d'erreurs de validation
        const errors = error.response.data;
        if (typeof errors === 'object' && !errors.message && !errors.detail) {
          const errorFields = Object.keys(errors);
          errorMessage = `Erreurs: ${errorFields.map(field => `${field}: ${errors[field]}`).join(', ')}`;
        } else if (errors.message) {
          errorMessage = errors.message;
        } else if (errors.error) {
          errorMessage = errors.error;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        } else if (error.response.status === 400) {
          errorMessage = 'Données invalides. Vérifiez les champs requis.';
        }
        
        console.log('Erreurs détaillées:', errors);
      } else if (error.response?.status === 401) {
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Building className="w-8 h-8 mr-3 text-primary-400" />
              Nouveau Client
            </h2>
            <p className="text-dark-300">
              Créer un nouveau client dans le système
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire principal */}
      <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Informations de base */}
          <div className="bg-dark-800/50 p-6 rounded-lg border border-dark-600">
            <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Building className="w-6 h-6 mr-3 text-primary-400" />
              Informations de l'entreprise
            </h4>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Nom commercial <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nom_commercial || ''}
                onChange={(e) => setFormData({ ...formData, nom_commercial: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
                placeholder="Nom sous lequel l'entreprise est connue"
              />
            </div>
          </div>

          {/* Section 2: Contact */}
          <div className="bg-dark-800/50 p-6 rounded-lg border border-dark-600">
            <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Mail className="w-6 h-6 mr-3 text-secondary-400" />
              Informations de contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  placeholder="contact@entreprise.com"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Téléphone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  required
                  placeholder="+509 1234 5678"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Personne de contact <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.contact || ''}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
                placeholder="Nom de la personne à contacter"
              />
            </div>
          </div>

          {/* Section 3: Adresse */}
          <div className="bg-dark-800/50 p-6 rounded-lg border border-dark-600">
            <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-accent-400" />
              Adresse
            </h4>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Adresse complète <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.adresse || ''}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                required
                placeholder="Adresse complète de l'entreprise"
                rows="4"
              />
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="bg-dark-800/50 p-6 rounded-lg border border-dark-600">
            <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-yellow-400" />
              Notes additionnelles
            </h4>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Commentaires et notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                placeholder="Informations complémentaires..."
                rows="4"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-dark-600">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="px-8 py-3 flex items-center space-x-2"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </Button>
            <Button 
              type="submit"
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 flex items-center space-x-2"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Création...' : 'Créer le client'}</span>
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateClientPage;
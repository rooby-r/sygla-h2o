console.log('🧪 Test des services frontend');

// Simuler localStorage avec un token valide
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwNDcxMDQyLCJpYXQiOjE3NjA0Njc0NDIsImp0aSI6IjYzNjI5YjUxMDI5ZjRiMDRiOTk1M2M0YTdhMDVmODUyIiwidXNlcl9pZCI6MTJ9.D9L88ocMiBCDl400UaQ3dFFKbRBpOpG0qssn02cHI7o';

// Simuler localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key) => {
      if (key === 'access_token') return mockToken;
      return null;
    },
    setItem: () => {},
    removeItem: () => {}
  }
});

// Import et test du service
import { clientService } from './src/services/api.js';

async function testClientService() {
  try {
    console.log('📡 Test clientService.getAll()...');
    const result = await clientService.getAll();
    console.log('✅ Résultat:', result);
    
    if (result && result.results) {
      console.log(`📊 ${result.results.length} clients trouvés`);
      result.results.forEach(client => {
        console.log(`👤 ${client.nom_commercial} - ${client.email}`);
      });
    } else if (Array.isArray(result)) {
      console.log(`📊 ${result.length} clients trouvés`);
      result.forEach(client => {
        console.log(`👤 ${client.nom_commercial} - ${client.email}`);
      });
    } else {
      console.log('❌ Format de résultat inattendu:', typeof result);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testClientService();
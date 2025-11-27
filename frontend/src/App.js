import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DataUpdateProvider } from './contexts/DataUpdateContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ChangePasswordRequired from './pages/auth/ChangePasswordRequired';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientsPage from './pages/clients/ClientsPage';
import CreateClientPage from './pages/clients/CreateClientPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import EditClientPage from './pages/clients/EditClientPage';
import ProductsPage from './pages/products/ProductsPage';
import CreateProductPage from './pages/products/CreateProductPage';
import ProductDetailsPage from './pages/products/ProductDetailsPage';
import EditProductPage from './pages/products/EditProductPage';
import OrdersPage from './pages/orders/OrdersPage';
import CreateOrderPage from './pages/orders/CreateOrderPage';
import EditOrderPage from './pages/orders/EditOrderPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import VentesPage from './pages/sales/VentesPage';
import CreateVentePage from './pages/sales/CreateVentePage';
import VenteDetailPage from './pages/sales/VenteDetailPage';
import DeliveriesPage from './pages/deliveries/DeliveriesPage';
import DeliveryDetailPage from './pages/deliveries/DeliveryDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import LogsPage from './pages/logs/LogsPage';
import LogDetailPage from './pages/logs/LogDetailPage';
import BusinessHoursPage from './pages/settings/BusinessHoursPage';
import SettingsPage from './pages/settings/SettingsPage';
import SecurityPage from './pages/settings/SecurityPage';
import NotificationsPage from './pages/settings/NotificationsPage';
import ProfilePage from './pages/settings/ProfilePage';
import DatabasePage from './pages/settings/DatabasePage';
import ConnectedUsersPage from './pages/settings/ConnectedUsersPage';
import UsersManagementPage from './pages/settings/UsersManagementPage';

// Layout & Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Composant principal
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataUpdateProvider>
        <AuthProvider>
          <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <div className="min-h-screen bg-dark-900 text-white">
              {/* Fond avec effet de grille cyber */}
              <div className="fixed inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
              
              <Routes>
                {/* Route de connexion */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Route de changement de mot de passe obligatoire */}
                <Route path="/change-password-required" element={
                  <ProtectedRoute>
                    <ChangePasswordRequired />
                  </ProtectedRoute>
                } />
                
                {/* Routes protégées */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Dashboard - Accessible à tous */}
                  <Route path="dashboard" element={<DashboardPage />} />
                  
                  {/* Clients - admin: full, vendeur: view/create/edit, stock: view, livreur: view */}
                  <Route path="clients" element={
                    <ProtectedRoute module="clients">
                      <ClientsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="clients/create" element={
                    <ProtectedRoute module="clients" action="create">
                      <CreateClientPage />
                    </ProtectedRoute>
                  } />
                  <Route path="clients/:id" element={
                    <ProtectedRoute module="clients">
                      <ClientDetailPage />
                    </ProtectedRoute>
                  } />
                  <Route path="clients/:id/edit" element={
                    <ProtectedRoute module="clients" action="edit">
                      <EditClientPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Produits - admin: full, vendeur: view, stock: view/create/edit */}
                  <Route path="products" element={
                    <ProtectedRoute module="products">
                      <ProductsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="products/create" element={
                    <ProtectedRoute module="products" action="create">
                      <CreateProductPage />
                    </ProtectedRoute>
                  } />
                  <Route path="products/:id" element={
                    <ProtectedRoute module="products">
                      <ProductDetailsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="products/edit/:id" element={
                    <ProtectedRoute module="products" action="edit">
                      <EditProductPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Commandes - admin: full, vendeur: view/create/edit, stock: view, livreur: view */}
                  <Route path="orders" element={
                    <ProtectedRoute module="orders">
                      <OrdersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="orders/create" element={
                    <ProtectedRoute module="orders" action="create">
                      <CreateOrderPage />
                    </ProtectedRoute>
                  } />
                  <Route path="orders/:id" element={
                    <ProtectedRoute module="orders">
                      <OrderDetailPage />
                    </ProtectedRoute>
                  } />
                  <Route path="orders/:id/edit" element={
                    <ProtectedRoute module="orders" action="edit">
                      <EditOrderPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Ventes - admin: full, vendeur: view/create/edit */}
                  <Route path="sales" element={
                    <ProtectedRoute module="sales">
                      <VentesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="sales/create" element={
                    <ProtectedRoute module="sales" action="create">
                      <CreateVentePage />
                    </ProtectedRoute>
                  } />
                  <Route path="sales/:id" element={
                    <ProtectedRoute module="sales">
                      <VenteDetailPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Livraisons - admin: full, vendeur: view, stock: view, livreur: view/edit */}
                  <Route path="deliveries" element={
                    <ProtectedRoute module="deliveries">
                      <DeliveriesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="deliveries/:id" element={
                    <ProtectedRoute module="deliveries">
                      <DeliveryDetailPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Rapports - admin: full, vendeur/stock: view, livreur: no access */}
                  <Route path="reports/*" element={
                    <ProtectedRoute module="reports">
                      <ReportsPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Logs - admin only */}
                  <Route path="logs" element={
                    <ProtectedRoute module="logs">
                      <LogsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="logs/:id" element={
                    <ProtectedRoute module="logs">
                      <LogDetailPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Paramètres */}
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="settings/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <UsersManagementPage />
                    </ProtectedRoute>
                  } />
                  <Route path="settings/business-hours" element={
                    <ProtectedRoute module="logs">
                      <BusinessHoursPage />
                    </ProtectedRoute>
                  } />
                  <Route path="settings/security" element={
                    <ProtectedRoute module="logs">
                      <SecurityPage />
                    </ProtectedRoute>
                  } />
                  <Route path="settings/connected-users" element={
                    <ProtectedRoute module="logs">
                      <ConnectedUsersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="settings/notifications" element={<NotificationsPage />} />
                  <Route path="settings/profile" element={<ProfilePage />} />
                  <Route path="settings/database" element={
                    <ProtectedRoute module="logs">
                      <DatabasePage />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Route par défaut - Rediriger vers login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            {/* Notifications toast */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#14b8a6',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </DataUpdateProvider>
    </QueryClientProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import ClientLayout from './layouts/ClientLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AlertProvider } from './context/AlertContext';

// Pages
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Clients from './pages/admin/Clients';
import ClientDetail from './pages/admin/ClientDetail';
import Employees from './pages/admin/Employees';
import Events from './pages/admin/Events';
import Albums from './pages/admin/Albums';
import QrCodes from './pages/admin/QrCodes';
import Payments from './pages/admin/Payments';
import Storage from './pages/admin/Storage';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';

import EmployeeDashboard from './pages/employee/Dashboard';
import AssignedClients from './pages/employee/AssignedClients';
import EventUpload from './pages/employee/EventUpload';
import EmployeeActivity from './pages/employee/Activity';

import GalleryHome from './pages/client/GalleryHome';
import GuestCandidGallery from './pages/client/GuestCandidGallery';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'EMPLOYEE') {
    return <Navigate to="/employee" replace />;
  }
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AlertProvider>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />

              {/* Public QR Gallery Delivery */}
              <Route element={<ClientLayout />}>
                <Route path="/gallery/:token" element={<GalleryHome />} />
                <Route path="/gallery/:token/guest" element={<GuestCandidGallery />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetail />} />
                  <Route path="events" element={<Events />} />
                  <Route path="albums" element={<Albums />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="qr" element={<QrCodes />} />
                  <Route path="storage" element={<Storage />} />
                  <Route path="audit" element={<AuditLogs />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
                <Route path="/employee" element={<EmployeeLayout />}>
                  <Route index element={<EmployeeDashboard />} />
                  <Route path="clients" element={<AssignedClients />} />
                  <Route path="upload" element={<EventUpload />} />
                  <Route path="activity" element={<EmployeeActivity />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AlertProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

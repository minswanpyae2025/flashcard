import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminLayout from './components/admin/AdminLayout';
import AdminHome from './components/admin/AdminHome';
import TaxonomyManager from './components/admin/TaxonomyManager';
import ContentManager from './components/admin/ContentManager';
import ReportInbox from './components/admin/ReportInbox';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
    const { token, user } = useAuth();
    if (!token) return <Navigate to="/login" />;
    if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
    return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={<AdminRoute><AdminLayout><AdminHome /></AdminLayout></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><AdminLayout><ContentManager /></AdminLayout></AdminRoute>} />
          <Route path="/admin/taxonomy" element={<AdminRoute><AdminLayout><TaxonomyManager /></AdminLayout></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminLayout><ReportInbox /></AdminLayout></AdminRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

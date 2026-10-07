import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IssueReturnKiosk from './pages/IssueReturnKiosk';
import RFIDSimulator from './pages/RFIDSimulator';
import Books from './pages/Books';
import Members from './pages/Members';
import Transactions from './pages/Transactions';
import RFIDMonitor from './pages/RFIDMonitor';
import Fines from './pages/Fines';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-semibold text-xs">
        Verifying RFID Session...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="kiosk" element={<IssueReturnKiosk />} />
        <Route path="rfid-simulator" element={<RFIDSimulator />} />
        <Route path="books" element={<Books />} />
        <Route path="members" element={<Members />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="rfid-monitor" element={<RFIDMonitor />} />
        <Route path="fines" element={<Fines />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

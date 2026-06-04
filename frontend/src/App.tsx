import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Deliveries from './pages/Deliveries';
import CreateDelivery from './pages/CreateDelivery';
import DeliveryDetails from './pages/DeliveryDetails';
import ProfilePage from './pages/ProfilePage';
import WelcomePage from './pages/WelcomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes — no sidebar Layout */}
          <Route path="/welcome" element={<PublicRoute><WelcomePage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          
          {/* Pending approval — authenticated but not yet approved (own auth guard, NOT ProtectedRoute to avoid redirect loop) */}
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          
          {/* Protected routes — with Layout (sidebar + bottom nav), requires active status */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/deliveries" element={<ProtectedRoute><Layout><Deliveries /></Layout></ProtectedRoute>} />
          <Route path="/create-delivery" element={<ProtectedRoute><Layout><CreateDelivery /></Layout></ProtectedRoute>} />
          <Route path="/delivery/:id" element={<ProtectedRoute><Layout><DeliveryDetails /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

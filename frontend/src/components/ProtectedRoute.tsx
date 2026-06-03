import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isActive, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // If authenticated but not active, redirect to pending approval page
  if (!isActive) {
    if (user?.status === 'pending_approval') {
      return <Navigate to="/pending-approval" replace />;
    }
    if (user?.status === 'suspended' || user?.status === 'rejected') {
      // Still show pending page with appropriate status info
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;

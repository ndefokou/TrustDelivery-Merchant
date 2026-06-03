import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isActive, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (isActive) {
      // Active merchant → go to dashboard
      return <Navigate to="/" replace />;
    } else {
      // Non-active merchant → go to pending approval
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};

export default PublicRoute;

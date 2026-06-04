import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Truck, Clock, ShieldAlert, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const statusConfig: Record<string, {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badgeClasses: string;
  dotClasses: string;
  message: string;
}> = {
  pending_approval: {
    icon: <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />,
    title: 'Application Submitted',
    subtitle: 'Your merchant account is pending approval',
    badgeClasses: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClasses: 'bg-amber-500',
    message: 'An administrator will review your application shortly. You will be notified via email once your account has been approved. This usually takes 1-2 business hours.',
  },
  suspended: {
    icon: <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-white" />,
    title: 'Account Suspended',
    subtitle: 'Your merchant account has been suspended',
    badgeClasses: 'bg-red-50 text-red-700 border border-red-200',
    dotClasses: 'bg-red-500',
    message: 'Your account has been suspended by an administrator. Please contact support for assistance.',
  },
  rejected: {
    icon: <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />,
    title: 'Application Rejected',
    subtitle: 'Your merchant account application was not approved',
    badgeClasses: 'bg-red-50 text-red-700 border border-red-200',
    dotClasses: 'bg-red-500',
    message: 'Your account application has been rejected. Please contact support for more information or to reapply.',
  },
};

const statusLabels: Record<string, string> = {
  pending_approval: 'Pending Approval',
  suspended: 'Suspended',
  rejected: 'Rejected',
};

const PendingApprovalPage: React.FC = () => {
  const { user, logout, isAuthenticated, isActive, loading } = useAuth();

  // Auth guard: redirect unauthenticated users to welcome, active users to dashboard
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  if (isActive) {
    return <Navigate to="/" replace />;
  }

  const status = user?.status || 'pending_approval';
  const config = statusConfig[status] || statusConfig.pending_approval;

  const handleLogout = () => {
    logout();
  };

  // Determine icon background color based on status
  const iconBgClass = status === 'pending_approval' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-red-500 shadow-red-500/30';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-5 sm:px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm sm:max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${iconBgClass} flex items-center justify-center shadow-xl`}>
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">{config.title}</h1>
        <p className="text-slate-400 text-sm sm:text-base mb-5 sm:mb-6">{config.subtitle}</p>

        {/* Info card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 sm:p-6 text-left mb-5 sm:mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400 flex-shrink-0">Business</span>
              <span className="text-sm text-white font-medium text-right truncate">{user?.business_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400 flex-shrink-0">Owner</span>
              <span className="text-sm text-white font-medium text-right truncate">{user?.owner_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400 flex-shrink-0">Email</span>
              <span className="text-sm text-white font-medium text-right truncate">{user?.email || '—'}</span>
            </div>
            <div className="border-t border-slate-700/50 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.badgeClasses}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotClasses}`} />
                  {statusLabels[status] || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-slate-300 text-sm leading-relaxed mb-6 sm:mb-8">
          {config.message}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 min-h-touch"
          >
            Sign Out
          </button>
          
          <p className="text-slate-500 text-xs">
            Already approved?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
              Sign in to your account
            </Link>
          </p>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center mt-6 sm:mt-8 space-x-2">
          <Truck className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">TrustDelivery Merchant Portal</span>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;

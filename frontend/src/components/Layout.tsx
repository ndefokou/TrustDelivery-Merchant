import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Package,
  Plus,
  MapPin,
  Users,
  Bell,
  User,
  LogOut,
  Truck,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MERCHANT_STATUS_LABELS } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Create Delivery', href: '/create-delivery', icon: Plus },
    { name: 'Deliveries', href: '/deliveries', icon: Package },
    { name: 'Tracking', href: '/tracking', icon: Truck },
    { name: 'Saved Addresses', href: '/addresses', icon: MapPin },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/welcome', { replace: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.business_name || 'Merchant';
  const initials = getInitials(displayName);

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending_approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'suspended':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusDotClasses = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'pending_approval': return 'bg-amber-500';
      case 'suspended': return 'bg-red-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img src="/logo192.png" alt="TrustDelivery" className="w-10 h-10 rounded-xl shadow-lg shadow-orange-500/30 object-contain bg-white" />
            <div>
              <h1 className="text-lg font-bold text-white">TrustDelivery</h1>
              <p className="text-xs text-slate-400">Merchant Portal</p>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 ml-auto transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center px-4 py-3 rounded-xl transition-all duration-200
                ${isActive(item.href) 
                  ? 'bg-orange-500/10 text-orange-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 flex-1 min-w-0 hover:bg-slate-800 rounded-xl p-2 -m-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClasses(user?.status || 'active')}`} />
                  <p className="text-xs text-slate-400">{MERCHANT_STATUS_LABELS[user?.status || 'active']}</p>
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar - Desktop & Mobile header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 lg:px-8">
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-900">Merchant Portal</h1>
            </div>
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-bold text-gray-900 lg:hidden flex items-center gap-2">
                <img src="/logo192.png" alt="TrustDelivery" className="w-7 h-7 rounded-lg object-contain bg-white" />
                TrustDelivery
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-block text-sm text-gray-500">
                Yaoundé, Cameroon
              </span>
              {/* Status badge in top bar */}
              {user?.status && user.status !== 'active' && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClasses(user.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotClasses(user.status)}`} />
                  {MERCHANT_STATUS_LABELS[user.status]}
                </span>
              )}
              {/* Desktop user avatar */}
              <Link to="/profile" className="hidden lg:flex items-center space-x-2 hover:bg-gray-50 rounded-xl p-1.5 -m-1.5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-container pt-4 sm:pt-6 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-200 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-touch transition-all duration-200
                  ${active ? 'text-orange-500' : 'text-gray-400 active:text-gray-600'}
                `}
              >
                <div className={`p-1 rounded-xl transition-all duration-200 ${active ? 'bg-orange-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-orange-500' : ''}`}>
                  {item.name === 'Dashboard' ? 'Home' : item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
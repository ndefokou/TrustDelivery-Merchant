import React from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Shield, ChevronRight } from 'lucide-react';

const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-5 sm:px-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm sm:max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <img src="/logo512.png" alt="TrustDelivery" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white shadow-xl shadow-orange-500/30" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1.5">TrustDelivery</h1>
        <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8">Merchant Portal</p>

        {/* Description */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 sm:mb-10 max-w-xs sm:max-w-md mx-auto">
          Fast, reliable delivery for your business. Create deliveries, track packages 
          in real-time, and manage your logistics — all in one place.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mb-1.5 sm:mb-2" />
            <span className="text-[11px] sm:text-xs text-slate-300 leading-tight">Create Deliveries</span>
          </div>
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mb-1.5 sm:mb-2" />
            <span className="text-[11px] sm:text-xs text-slate-300 leading-tight">Real-time Tracking</span>
          </div>
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mb-1.5 sm:mb-2" />
            <span className="text-[11px] sm:text-xs text-slate-300 leading-tight">Secure Payments</span>
          </div>
        </div>

        {/* Get Started Button */}
        <Link
          to="/register"
          className="btn-primary text-base mb-3"
        >
          Get Started
          <ChevronRight className="w-5 h-5 ml-1" />
        </Link>

        {/* Sign In Link */}
        <p className="text-slate-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;

import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, MapPin, Shield } from 'lucide-react';

const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2">Trida</h1>
        <p className="text-slate-400 text-lg mb-8">Merchant Portal</p>

        {/* Description */}
        <p className="text-slate-300 text-base leading-relaxed mb-10 max-w-md mx-auto">
          Fast, reliable delivery for your business. Create deliveries, track packages 
          in real-time, and manage your logistics — all in one place.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Package className="w-5 h-5 text-orange-400 mb-2" />
            <span className="text-xs text-slate-300">Create Deliveries</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <MapPin className="w-5 h-5 text-orange-400 mb-2" />
            <span className="text-xs text-slate-300">Real-time Tracking</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Shield className="w-5 h-5 text-orange-400 mb-2" />
            <span className="text-xs text-slate-300">Secure Payments</span>
          </div>
        </div>

        {/* Get Started Button */}
        <Link
          to="/register"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-orange-500/25 mb-4"
        >
          Get Started
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

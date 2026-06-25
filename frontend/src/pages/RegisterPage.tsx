import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, ArrowLeft, ArrowRight, Store, User, Lock, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BusinessType, BUSINESS_TYPE_LABELS } from '../types';

const STEPS = [
  { id: 1, title: 'Business', icon: Store },
  { id: 2, title: 'Owner', icon: User },
  { id: 3, title: 'Security', icon: Lock },
  { id: 4, title: 'Terms', icon: FileText },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1
    business_name: '',
    business_type: 'general_merchandise' as BusinessType,
    business_address: '',
    business_phone: '',
    business_email: '',
    // Step 2
    owner_name: '',
    owner_phone: '',
    national_id: '',
    // Step 3
    email: '',
    password: '',
    confirmPassword: '',
    // Step 4
    accept_terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 1:
        if (!formData.business_name.trim()) return 'Business name is required';
        if (!formData.business_address.trim()) return 'Business address is required';
        if (!formData.business_phone.trim()) return 'Business phone is required';
        return null;
      case 2:
        if (!formData.owner_name.trim()) return 'Owner full name is required';
        if (!formData.owner_phone.trim()) return 'Owner phone number is required';
        return null;
      case 3:
        if (!formData.email.trim()) return 'Email is required';
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(formData.password)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(formData.password)) return 'Password must contain at least one number';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        return null;
      case 4:
        if (!formData.accept_terms) return 'You must accept the terms and conditions';
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        business_name: formData.business_name,
        business_type: formData.business_type,
        business_address: formData.business_address,
        business_phone: formData.business_phone,
        business_email: formData.business_email || undefined,
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        national_id: formData.national_id || undefined,
        email: formData.email,
        password: formData.password,
        accept_terms: formData.accept_terms,
      });
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6 sm:mb-8">
      {STEPS.map((s, index) => {
        const Icon = s.icon;
        const isActive = step === s.id;
        const isCompleted = step > s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <span className={`text-[10px] sm:text-xs mt-1 ${
                isActive ? 'text-orange-400 font-medium' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {s.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 sm:mx-2 rounded ${
                step > s.id ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-0.5">Business Information</h2>
      <p className="text-slate-400 text-sm mb-4">Tell us about your business</p>

      <div>
        <label htmlFor="business_name" className="block text-sm font-medium text-slate-300 mb-1.5">
          Business Name <span className="text-red-400">*</span>
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          required
          value={formData.business_name}
          onChange={handleChange}
          placeholder="e.g. Arthur Electronics"
          className="dark-input"
        />
      </div>

      <div>
        <label htmlFor="business_type" className="block text-sm font-medium text-slate-300 mb-1.5">
          Business Type <span className="text-red-400">*</span>
        </label>
        <select
          id="business_type"
          name="business_type"
          value={formData.business_type}
          onChange={handleChange}
          className="dark-input appearance-none"
        >
          {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="business_address" className="block text-sm font-medium text-slate-300 mb-1.5">
          Business Address <span className="text-red-400">*</span>
        </label>
        <input
          id="business_address"
          name="business_address"
          type="text"
          required
          value={formData.business_address}
          onChange={handleChange}
          placeholder="e.g. Mvog-Ada, Yaoundé"
          className="dark-input"
        />
      </div>

      <div>
        <label htmlFor="business_phone" className="block text-sm font-medium text-slate-300 mb-1.5">
          Business Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          id="business_phone"
          name="business_phone"
          type="tel"
          required
          value={formData.business_phone}
          onChange={handleChange}
          placeholder="e.g. 677123456"
          className="dark-input"
        />
      </div>

      <div>
        <label htmlFor="business_email" className="block text-sm font-medium text-slate-300 mb-1.5">
          Business Email <span className="text-slate-500 text-xs">(optional)</span>
        </label>
        <input
          id="business_email"
          name="business_email"
          type="email"
          value={formData.business_email}
          onChange={handleChange}
          placeholder="e.g. contact@arthurelectronics.com"
          className="dark-input"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-0.5">Owner Information</h2>
      <p className="text-slate-400 text-sm mb-4">Tell us about the business owner</p>

      <div>
        <label htmlFor="owner_name" className="block text-sm font-medium text-slate-300 mb-1.5">
          Owner Full Name <span className="text-red-400">*</span>
        </label>
        <input
          id="owner_name"
          name="owner_name"
          type="text"
          required
          value={formData.owner_name}
          onChange={handleChange}
          placeholder="e.g. Arthur Tcheutchoua"
          className="dark-input"
        />
      </div>

      <div>
        <label htmlFor="owner_phone" className="block text-sm font-medium text-slate-300 mb-1.5">
          Owner Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          id="owner_phone"
          name="owner_phone"
          type="tel"
          required
          value={formData.owner_phone}
          onChange={handleChange}
          placeholder="e.g. 678123456"
          className="dark-input"
        />
      </div>

      <div>
        <label htmlFor="national_id" className="block text-sm font-medium text-slate-300 mb-1.5">
          National ID Number <span className="text-slate-500 text-xs">(optional — helps verify your account faster)</span>
        </label>
        <input
          id="national_id"
          name="national_id"
          type="text"
          value={formData.national_id}
          onChange={handleChange}
          placeholder="e.g. 1XXXXXXXXX"
          className="dark-input"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-0.5">Account Security</h2>
      <p className="text-slate-400 text-sm mb-4">Set up your login credentials</p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
          Login Email <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="merchant@example.com"
          className="dark-input"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
          Password <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className="dark-input pr-12"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {/* Password strength indicator */}
        <div className="mt-2 space-y-1">
          <div className={`text-xs flex items-center gap-1.5 ${formData.password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span>{formData.password.length >= 8 ? '✓' : '○'}</span> At least 8 characters
          </div>
          <div className={`text-xs flex items-center gap-1.5 ${/[A-Z]/.test(formData.password) ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span> One uppercase letter
          </div>
          <div className={`text-xs flex items-center gap-1.5 ${/[0-9]/.test(formData.password) ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span>{/[0-9]/.test(formData.password) ? '✓' : '○'}</span> One number
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
          Confirm Password <span className="text-red-400">*</span>
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          className="dark-input"
          autoComplete="new-password"
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-0.5">Terms & Conditions</h2>
      <p className="text-slate-400 text-sm mb-4">Please review and accept our terms</p>

      <div className="bg-slate-900/50 border border-slate-600/50 rounded-xl p-4 max-h-40 sm:max-h-48 overflow-y-auto text-sm text-slate-300 space-y-3">
        <p><strong className="text-white">1. Service Agreement</strong><br />
        By using TrustDelivery, you agree to use our delivery services in accordance with applicable laws and regulations. TrustDelivery acts as an intermediary between merchants and delivery carriers.</p>
        
        <p><strong className="text-white">2. Account Responsibility</strong><br />
        You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility.</p>
        
        <p><strong className="text-white">3. Delivery Terms</strong><br />
        TrustDelivery will make reasonable efforts to deliver packages on time. However, we are not liable for delays caused by factors beyond our control.</p>
        
        <p><strong className="text-white">4. Payments</strong><br />
        Delivery fees are charged per delivery and must be paid through the available payment methods. Wallet balance is non-refundable except as required by law.</p>
        
        <p><strong className="text-white">5. Account Approval</strong><br />
        New merchant accounts require administrative approval before they can be used. TrustDelivery reserves the right to reject or suspend accounts that violate our policies.</p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group py-1">
        <input
          type="checkbox"
          name="accept_terms"
          checked={formData.accept_terms}
          onChange={handleChange}
          className="mt-1 w-5 h-5 min-h-0 rounded border-slate-600 bg-slate-900/50 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
        />
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
          I agree to TrustDelivery's <span className="text-orange-400">terms and conditions</span> and understand that my account requires approval before I can create deliveries.
        </span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-5 sm:px-6 py-6 sm:py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm sm:max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <Link to="/welcome" className="inline-flex items-center justify-center mb-3">
            <img src="/logo192.png" alt="TrustDelivery" className="w-12 h-12 rounded-xl shadow-xl shadow-orange-500/30 object-contain bg-white" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Start managing your deliveries today</p>
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} 
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 sm:p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-4 animate-fade-in">
              {error}
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 text-slate-400 hover:text-white transition-colors min-h-touch"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2.5 px-5 sm:px-6 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 min-h-touch"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 sm:px-6 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 min-h-touch"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Submit Application
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-5 sm:mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

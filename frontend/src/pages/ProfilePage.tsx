import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Merchant, BusinessType, BUSINESS_TYPE_LABELS, MERCHANT_STATUS_LABELS } from '../types';
import { getMerchantProfile, updateMerchantProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<Merchant | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Merchant>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMerchantProfile();
      setProfile(data);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setFormData({
      business_name: profile?.business_name,
      business_address: profile?.business_address,
      business_phone: profile?.business_phone,
      business_email: profile?.business_email,
      owner_name: profile?.owner_name,
      owner_phone: profile?.owner_phone,
      national_id: profile?.national_id,
      dispatch_latitude: profile?.dispatch_latitude,
      dispatch_longitude: profile?.dispatch_longitude,
    });
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({});
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const updateData: Partial<Merchant> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) {
          (updateData as Record<string, unknown>)[key] = value;
        }
      });

      const updated = await updateMerchantProfile(updateData);
      setProfile(updated);
      setEditMode(false);
      setSuccess(true);
      
      await refreshUser();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Merchant, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">No profile data available</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const displayName = profile.business_name || 'Merchant';
  const initials = getInitials(displayName);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-xs sm:text-sm text-gray-500">Manage your business and account information</p>
          </div>
        </div>
        {!editMode ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 flex items-center space-x-2 text-sm font-medium min-h-touch sm:min-h-0 shadow-sm self-start sm:self-auto"
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm min-h-touch sm:min-h-0"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 text-sm min-h-touch sm:min-h-0 shadow-sm"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center space-x-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Profile updated successfully!</span>
        </div>
      )}
      {error && (
        <div className="flex items-center space-x-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Profile Avatar & Status */}
      <div className="mobile-card">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{displayName}</h2>
            <p className="text-sm text-gray-500 truncate">{profile.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClasses(profile.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotClasses(profile.status)}`} />
                {MERCHANT_STATUS_LABELS[profile.status]}
              </span>
              <span className="text-xs text-gray-400">
                Since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Business Information */}
        <div className="mobile-card !p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Business Information</h3>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Business Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.business_name ?? profile.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.business_name}</p>
              )}
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Business Type</label>
              {editMode ? (
                <select
                  value={formData.business_type ?? profile.business_type}
                  onChange={(e) => handleInputChange('business_type', e.target.value as BusinessType)}
                  className="mobile-input text-sm appearance-none"
                >
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">{BUSINESS_TYPE_LABELS[profile.business_type]}</p>
              )}
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Business Address
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.business_address ?? profile.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.business_address}</p>
              )}
            </div>

            {/* Business Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Business Phone
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.business_phone ?? profile.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.business_phone}</p>
              )}
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Business Email
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.business_email ?? profile.business_email ?? ''}
                  onChange={(e) => handleInputChange('business_email', e.target.value || null)}
                  className="mobile-input text-sm"
                  placeholder="Optional"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.business_email || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="mobile-card !p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Owner Information</h3>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {/* Owner Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Owner Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.owner_name ?? profile.owner_name}
                  onChange={(e) => handleInputChange('owner_name', e.target.value)}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.owner_name}</p>
              )}
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Owner Phone
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.owner_phone ?? profile.owner_phone}
                  onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.owner_phone}</p>
              )}
            </div>

            {/* National ID */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                <CreditCard className="w-3.5 h-3.5 inline mr-1" />
                National ID
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.national_id ?? profile.national_id ?? ''}
                  onChange={(e) => handleInputChange('national_id', e.target.value || null)}
                  className="mobile-input text-sm"
                  placeholder="Optional"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.national_id || 'Not provided'}</p>
              )}
            </div>

            {/* Account Email (read-only) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Account Email
              </label>
              <p className="text-sm text-gray-900">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Contact support to change your email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Location */}
      <div className="mobile-card !p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Dispatch Location</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Latitude</label>
              {editMode ? (
                <input
                  type="number"
                  step="any"
                  value={formData.dispatch_latitude ?? profile.dispatch_latitude}
                  onChange={(e) => handleInputChange('dispatch_latitude', parseFloat(e.target.value))}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.dispatch_latitude}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Longitude</label>
              {editMode ? (
                <input
                  type="number"
                  step="any"
                  value={formData.dispatch_longitude ?? profile.dispatch_longitude}
                  onChange={(e) => handleInputChange('dispatch_longitude', parseFloat(e.target.value))}
                  className="mobile-input text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.dispatch_longitude}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="mobile-card !p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Wallet</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.wallet_balance.toLocaleString()}</span>
            <span className="text-base sm:text-lg text-gray-400">FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

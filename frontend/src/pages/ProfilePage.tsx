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
  const { user, refreshUser } = useAuth();
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

      // Filter out undefined values
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
      
      // Refresh the auth context user data
      await refreshUser();

      // Clear success message after 3 seconds
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
        <p className="text-gray-600">No profile data available</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const displayName = profile.business_name || 'Merchant';
  const initials = getInitials(displayName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-500">Manage your business and account information</p>
          </div>
        </div>
        {!editMode ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center space-x-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
          <CheckCircle className="w-5 h-5" />
          <span>Profile updated successfully!</span>
        </div>
      )}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Avatar & Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(profile.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotClasses(profile.status)}`} />
                {MERCHANT_STATUS_LABELS[profile.status]}
              </span>
              <span className="text-xs text-gray-500">
                Member since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.business_name ?? profile.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.business_name}</p>
              )}
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              {editMode ? (
                <select
                  value={formData.business_type ?? profile.business_type}
                  onChange={(e) => handleInputChange('business_type', e.target.value as BusinessType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{BUSINESS_TYPE_LABELS[profile.business_type]}</p>
              )}
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Business Address
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.business_address ?? profile.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.business_address}</p>
              )}
            </div>

            {/* Business Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Business Phone
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.business_phone ?? profile.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.business_phone}</p>
              )}
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Business Email
              </label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.business_email ?? profile.business_email ?? ''}
                  onChange={(e) => handleInputChange('business_email', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Optional"
                />
              ) : (
                <p className="text-gray-900">{profile.business_email || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.owner_name ?? profile.owner_name}
                  onChange={(e) => handleInputChange('owner_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.owner_name}</p>
              )}
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Owner Phone
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.owner_phone ?? profile.owner_phone}
                  onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.owner_phone}</p>
              )}
            </div>

            {/* National ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CreditCard className="w-4 h-4 inline mr-1" />
                National ID
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.national_id ?? profile.national_id ?? ''}
                  onChange={(e) => handleInputChange('national_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Optional"
                />
              ) : (
                <p className="text-gray-900">{profile.national_id || 'Not provided'}</p>
              )}
            </div>

            {/* Account Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Account Email
              </label>
              <p className="text-gray-900">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Location */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Dispatch Location</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              {editMode ? (
                <input
                  type="number"
                  step="any"
                  value={formData.dispatch_latitude ?? profile.dispatch_latitude}
                  onChange={(e) => handleInputChange('dispatch_latitude', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.dispatch_latitude}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              {editMode ? (
                <input
                  type="number"
                  step="any"
                  value={formData.dispatch_longitude ?? profile.dispatch_longitude}
                  onChange={(e) => handleInputChange('dispatch_longitude', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-gray-900">{profile.dispatch_longitude}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Wallet</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900">{profile.wallet_balance.toLocaleString()}</span>
            <span className="text-lg text-gray-500">FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

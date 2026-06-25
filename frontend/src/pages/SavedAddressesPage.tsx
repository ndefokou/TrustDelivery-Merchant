import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Plus, Edit2, Trash2, Loader2, Check, X, Search } from 'lucide-react';
import { searchAddresses, getSavedAddresses } from '../services/api';
import { getMerchantId } from '../services/api';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const YAOUNDE_CENTER: [number, number] = [3.8480, 11.5020];

interface SavedAddress {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

const LocationPicker: React.FC<{
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
};

const SavedAddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    address_text: string;
    latitude: number;
    longitude: number;
    area?: string;
  }>>([]);
  const [searching, setSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2 && showAddModal) {
        setSearching(true);
        try {
          const results = await searchAddresses(searchQuery, 5);
          setSearchResults(results);
        } catch (err) {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showAddModal]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await getSavedAddresses();
      const formatted: SavedAddress[] = results.map((r, index) => ({
        id: r.id || `addr-${index}`,
        name: r.area || 'Unnamed Location',
        address: r.address_text,
        latitude: r.latitude,
        longitude: r.longitude,
        is_default: index === 0,
      }));
      setAddresses(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearchResult = (result: typeof searchResults[0]) => {
    setFormData(prev => ({
      ...prev,
      address: result.address_text,
      latitude: result.latitude,
      longitude: result.longitude,
    }));
    setSearchQuery(result.address_text);
    setSearchResults([]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSaveAddress = async () => {
    if (!formData.name.trim()) {
      setFormError('Please enter a name for this address');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Please select an address');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      
      const newAddress: SavedAddress = {
        id: editingAddress?.id || `addr-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        is_default: false,
      };

      if (editingAddress) {
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? newAddress : a));
      } else {
        setAddresses(prev => [...prev, newAddress]);
      }

      setShowAddModal(false);
      setEditingAddress(null);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      is_default: a.id === id,
    })));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
    });
    setSearchQuery('');
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const openEditModal = (address: SavedAddress) => {
    setFormData({
      name: address.name,
      address: address.address,
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setSearchQuery(address.address);
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const mapCenter: [number, number] = formData.latitude && formData.longitude
    ? [formData.latitude, formData.longitude]
    : YAOUNDE_CENTER;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <button 
          onClick={fetchAddresses}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your frequently used pickup locations</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 font-medium text-sm shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="mobile-card text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
          <p className="text-sm text-gray-500 mb-4">Save frequently used locations for faster delivery creation</p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`mobile-card ${address.is_default ? 'border-orange-500 border-2' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    address.is_default ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <MapPin className={`w-4 h-4 ${address.is_default ? 'text-orange-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{address.name}</h3>
                    {address.is_default && (
                      <span className="text-xs text-orange-600 font-medium">Default</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(address)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!address.is_default && (
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{address.address}</p>
              <div className="flex items-center gap-2">
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Shop, Warehouse"
                    className="mobile-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Search Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for an address..."
                      className="mobile-input"
                    />
                    {searching && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectSearchResult(result)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900">{result.address_text}</p>
                          {result.area && <p className="text-xs text-gray-500">{result.area}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Or click on the map to select location
                  </label>
                  <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                    <MapContainer
                      center={mapCenter}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {formData.latitude && formData.longitude && (
                        <Marker position={[formData.latitude, formData.longitude]} />
                      )}
                      <LocationPicker position={null} onPositionChange={handleMapClick} />
                      <MapController center={mapCenter} />
                    </MapContainer>
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-800">Location selected</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{formError}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={saving}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAddressesPage;
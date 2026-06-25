import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Package, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calculator,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Navigation,
  Search,
  Locate,
  Crosshair
} from 'lucide-react';
import { CreateDeliveryRequest, PaymentMethod, AddressSearchResult, DeliveryCostCalculation } from '../types';
import { searchAddresses, createDelivery, calculateDeliveryCost, getSavedAddresses } from '../services/api';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const YAOUNDE_CENTER: [number, number] = [3.8480, 11.5020];

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface SavedLocation {
  id: string;
  name: string;
  address_text: string;
  latitude: number;
  longitude: number;
}

const LocationPicker: React.FC<{
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ onPositionChange }) => {
  useMap({
    click(e: L.LeafletMouseEvent) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapController: React.FC<{ 
  center: [number, number]; 
  zoom?: number;
  fly?: boolean;
}> = ({ center, zoom = 14, fly = true }) => {
  const map = useMap();
  useEffect(() => {
    if (fly) {
      map.flyTo(center, zoom, { duration: 0.5 });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, map, fly]);
  return null;
};

const CreateDelivery: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<DeliveryCostCalculation | null>(null);
  const [createdDeliveryId, setCreatedDeliveryId] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSearchResult[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<AddressSearchResult[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDelivery, setSearchingDelivery] = useState(false);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const pickupMapRef = useRef<L.Map | null>(null);
  const deliveryMapRef = useRef<L.Map | null>(null);
  
  const [formData, setFormData] = useState<CreateDeliveryRequest>({
    product_description: '',
    product_value: 0,
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_latitude: 0,
    delivery_longitude: 0,
    payment_method: 'orange_money',
    collect_payment: false,
    amount_to_collect: undefined
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSavedLocations();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (pickupSearchQuery.length >= 2) {
        setSearchingPickup(true);
        try {
          const results = await searchAddresses(pickupSearchQuery, 5);
          setPickupSuggestions(results);
        } catch (err) {
          setPickupSuggestions([]);
        } finally {
          setSearchingPickup(false);
        }
      } else {
        setPickupSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [pickupSearchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (deliverySearchQuery.length >= 2) {
        setSearchingDelivery(true);
        try {
          const results = await searchAddresses(deliverySearchQuery, 5);
          setDeliverySuggestions(results);
        } catch (err) {
          setDeliverySuggestions([]);
        } finally {
          setSearchingDelivery(false);
        }
      } else {
        setDeliverySuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [deliverySearchQuery]);

  const loadSavedLocations = async () => {
    try {
      const results = await getSavedAddresses();
      setSavedLocations(results.map(r => ({
        id: r.id || '',
        name: r.area || 'Saved Location',
        address_text: r.address_text,
        latitude: r.latitude,
        longitude: r.longitude,
      })));
    } catch (err) {
      console.error('Failed to load saved locations:', err);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPickupLocation({
          address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          latitude,
          longitude,
        });
        setPickupSearchQuery(`Current Location`);
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const calculateCost = useCallback(async (pickupLat: number, pickupLng: number, deliveryLat: number, deliveryLng: number) => {
    try {
      const cost = await calculateDeliveryCost(deliveryLat, deliveryLng);
      setCalculatedCost(cost);
    } catch (err) {
      console.error('Failed to calculate cost:', err);
      const distance = Math.sqrt(
        Math.pow((deliveryLat - pickupLat) * 111, 2) + 
        Math.pow((deliveryLng - pickupLng) * 111, 2)
      );
      setCalculatedCost({
        distance_km: Math.round(distance * 10) / 10,
        delivery_cost: calculateCostFromDistance(distance),
        currency: 'FCFA'
      });
    }
  }, []);

  const calculateCostFromDistance = (distance: number): number => {
    if (distance <= 1) return 1000;
    if (distance <= 3) return 1500;
    if (distance <= 5) return 2000;
    if (distance <= 10) return 2500;
    return 3000;
  };

  const handlePickupSelect = (result: AddressSearchResult) => {
    setPickupLocation({
      address: result.address_text,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setPickupSearchQuery(result.address_text);
    setShowPickupSuggestions(false);
  };

  const handleDeliverySelect = (result: AddressSearchResult) => {
    setDeliveryLocation({
      address: result.address_text,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setDeliverySearchQuery(result.address_text);
    setShowDeliverySuggestions(false);
    setFormData(prev => ({
      ...prev,
      delivery_address: result.address_text,
      delivery_latitude: result.latitude,
      delivery_longitude: result.longitude,
    }));
  };

  const handleSavedPickupSelect = (location: SavedLocation) => {
    setPickupLocation({
      address: location.address_text,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setPickupSearchQuery(location.address_text);
  };

  const handleMapPickupClick = (lat: number, lng: number) => {
    setPickupLocation({
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
    });
    setPickupSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleMapDeliveryClick = (lat: number, lng: number) => {
    setDeliveryLocation({
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
    });
    setDeliverySearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setFormData(prev => ({
      ...prev,
      delivery_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      delivery_latitude: lat,
      delivery_longitude: lng,
    }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.product_description.length < 5) {
      newErrors.product_description = 'Product description must be at least 5 characters';
    }
    if (formData.product_value <= 0) {
      newErrors.product_value = 'Product value must be greater than 0';
    }
    if (formData.customer_name.length < 3) {
      newErrors.customer_name = 'Customer name must be at least 3 characters';
    }
    const phoneRegex = /^6[0-9]{8}$/;
    const cleanPhone = formData.customer_phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      newErrors.customer_phone = 'Invalid Cameroon phone number (6XX XXX XXX)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!pickupLocation) {
      newErrors.pickup_location = 'Please select a pickup location';
    }
    if (!deliveryLocation) {
      newErrors.delivery_location = 'Please select a delivery location';
    }
    if (formData.collect_payment && (!formData.amount_to_collect || formData.amount_to_collect <= 0)) {
      newErrors.amount_to_collect = 'Amount to collect must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      if (pickupLocation && deliveryLocation) {
        calculateCost(pickupLocation.latitude, pickupLocation.longitude, deliveryLocation.latitude, deliveryLocation.longitude);
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const delivery = await createDelivery(formData);
      setCreatedDeliveryId(delivery.delivery_id);
      setStep(4);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create delivery' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('fr-CM');
  };

  const stepLabels = ['Details', 'Locations', 'Confirm', 'Done'];

  const pickupMapCenter: [number, number] = pickupLocation 
    ? [pickupLocation.latitude, pickupLocation.longitude]
    : YAOUNDE_CENTER;

  const deliveryMapCenter: [number, number] = deliveryLocation 
    ? [deliveryLocation.latitude, deliveryLocation.longitude]
    : YAOUNDE_CENTER;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {step > s ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-8 sm:w-12 h-1 rounded ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2 space-x-4 sm:space-x-8 text-xs sm:text-sm">
          {stepLabels.map((label, i) => (
            <span key={label} className={step >= i + 1 ? 'text-orange-500 font-medium' : 'text-gray-400'}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Delivery Details */}
      {step === 1 && (
        <div className="mobile-card">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Delivery Information</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Package className="w-4 h-4 inline mr-1.5" />
                Package Description
              </label>
              <input
                type="text"
                value={formData.product_description}
                onChange={(e) => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
                placeholder="e.g., Samsung Galaxy S24 Ultra 256GB Black"
                className="mobile-input"
              />
              {errors.product_description && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.product_description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Package Value (FCFA)
              </label>
              <input
                type="number"
                value={formData.product_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, product_value: parseInt(e.target.value) || 0 }))}
                placeholder="e.g., 450000"
                className="mobile-input"
              />
              {errors.product_value && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.product_value}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4 inline mr-1.5" />
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="e.g., Jean Pierre"
                className="mobile-input"
              />
              {errors.customer_name && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.customer_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 inline mr-1.5" />
                Customer Phone
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-600 text-sm">
                  +237
                </span>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="6XX XXX XXX"
                  maxLength={9}
                  className="mobile-input !rounded-l-none"
                />
              </div>
              {errors.customer_phone && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.customer_phone}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-5 mt-5">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                <Banknote className="w-4 h-4 inline mr-1.5" />
                Cash on Delivery
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Should the carrier collect payment from the customer upon delivery?
              </p>
              <div className="space-y-2.5">
                {[
                  { value: false, label: 'No', description: 'Payment already received' },
                  { value: true, label: 'Yes', description: 'Carrier will collect payment on delivery' }
                ].map((option) => (
                  <label
                    key={String(option.value)}
                    className={`
                      flex items-center p-3.5 border rounded-xl cursor-pointer transition-all duration-200 min-h-touch
                      ${formData.collect_payment === option.value 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'}
                    `}
                  >
                    <input
                      type="radio"
                      name="collect_payment"
                      checked={formData.collect_payment === option.value}
                      onChange={() => setFormData(prev => ({ 
                        ...prev, 
                        collect_payment: option.value,
                        amount_to_collect: option.value ? prev.amount_to_collect : undefined
                      }))}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                    </div>
                    {formData.collect_payment === option.value && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </label>
                ))}
              </div>

              {formData.collect_payment && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Amount to Collect (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.amount_to_collect || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      amount_to_collect: parseInt(e.target.value) || undefined 
                    }))}
                    placeholder="e.g., 25000"
                    className="mobile-input"
                    min="1"
                  />
                  {errors.amount_to_collect && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errors.amount_to_collect}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 font-medium text-sm min-h-touch shadow-sm flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Locations */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Pickup Location */}
          <div className="mobile-card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Pickup Location
            </h3>

            {savedLocations.length > 0 && !pickupLocation && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Saved Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedLocations.slice(0, 3).map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSavedPickupSelect(loc)}
                      className="text-left p-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                    >
                      <p className="font-medium text-sm text-gray-900 truncate">{loc.name}</p>
                      <p className="text-xs text-gray-500 truncate">{loc.address_text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Use My Location Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={gettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Getting your location...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-5 h-5" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
              {locationError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {locationError}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Search className="w-4 h-4 inline mr-1" />
                Search address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pickupSearchQuery}
                  onChange={(e) => {
                    setPickupSearchQuery(e.target.value);
                    setShowPickupSuggestions(true);
                  }}
                  onFocus={() => setShowPickupSuggestions(true)}
                  placeholder="Search for pickup address..."
                  className="mobile-input"
                />
                {searchingPickup && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                )}
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                    {pickupSuggestions.map((addr) => (
                      <button
                        key={addr.id || addr.address_text}
                        type="button"
                        onClick={() => handlePickupSelect(addr)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900 text-sm">{addr.address_text}</p>
                        {addr.area && <p className="text-xs text-gray-500 mt-0.5">{addr.area}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Search will show matching locations on the map</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Or click on map to select</label>
              <div className="h-48 sm:h-64 rounded-xl overflow-hidden border border-gray-200">
                <MapContainer
                  center={pickupMapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {pickupLocation && (
                    <Marker position={[pickupLocation.latitude, pickupLocation.longitude]} icon={pickupIcon} />
                  )}
                  <LocationPicker onPositionChange={handleMapPickupClick} />
                  <MapController center={pickupMapCenter} zoom={14} fly={!!pickupLocation} />
                </MapContainer>
              </div>
            </div>

            {pickupLocation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm font-medium text-green-800">{pickupLocation.address}</p>
                <p className="text-xs text-green-600 mt-0.5">
                  📍 {pickupLocation.latitude.toFixed(4)}, {pickupLocation.longitude.toFixed(4)}
                </p>
              </div>
            )}

            {errors.pickup_location && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.pickup_location}
              </p>
            )}
          </div>

          {/* Delivery Location */}
          <div className="mobile-card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-red-600" />
              Delivery Location
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Search className="w-4 h-4 inline mr-1" />
                Search address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={deliverySearchQuery}
                  onChange={(e) => {
                    setDeliverySearchQuery(e.target.value);
                    setShowDeliverySuggestions(true);
                  }}
                  onFocus={() => setShowDeliverySuggestions(true)}
                  placeholder="Search for delivery address..."
                  className="mobile-input"
                />
                {searchingDelivery && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                )}
                {showDeliverySuggestions && deliverySuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                    {deliverySuggestions.map((addr) => (
                      <button
                        key={addr.id || addr.address_text}
                        type="button"
                        onClick={() => handleDeliverySelect(addr)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900 text-sm">{addr.address_text}</p>
                        {addr.area && <p className="text-xs text-gray-500 mt-0.5">{addr.area}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Search will show matching locations on the map</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Or click on map to select</label>
              <div className="h-48 sm:h-64 rounded-xl overflow-hidden border border-gray-200">
                <MapContainer
                  center={deliveryMapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {deliveryLocation && (
                    <Marker position={[deliveryLocation.latitude, deliveryLocation.longitude]} icon={deliveryIcon} />
                  )}
                  <LocationPicker onPositionChange={handleMapDeliveryClick} />
                  <MapController center={deliveryMapCenter} zoom={14} fly={!!deliveryLocation} />
                </MapContainer>
              </div>
            </div>

            {deliveryLocation && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-medium text-red-800">{deliveryLocation.address}</p>
                <p className="text-xs text-red-600 mt-0.5">
                  📍 {deliveryLocation.latitude.toFixed(4)}, {deliveryLocation.longitude.toFixed(4)}
                </p>
              </div>
            )}

            {errors.delivery_location && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.delivery_location}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium min-h-touch sm:min-h-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 font-medium text-sm min-h-touch shadow-sm flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="mobile-card">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Confirm Delivery</h2>

          {/* Cost Summary */}
          {calculatedCost && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center mb-2">
                <Calculator className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900 text-sm">Estimated Cost</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-blue-700">Distance</p>
                  <p className="text-lg font-semibold text-blue-900">{calculatedCost.distance_km} km</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Delivery Cost</p>
                  <p className="text-lg font-semibold text-blue-900">{formatCurrency(calculatedCost.delivery_cost)} FCFA</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-5 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-3 text-sm">Delivery Summary</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-sm font-medium text-gray-900">{pickupLocation?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delivery</p>
                  <p className="text-sm font-medium text-gray-900">{deliveryLocation?.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-3 text-sm">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Customer</span>
                <span className="text-gray-900 font-medium">{formData.customer_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900 font-medium">+237 {formData.customer_phone}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Product</span>
                <span className="text-gray-900 text-right truncate max-w-[180px]">{formData.product_description}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Value</span>
                <span className="text-gray-900 font-medium">{formatCurrency(formData.product_value)} FCFA</span>
              </div>
            </div>
          </div>

          {/* COD Summary */}
          {formData.collect_payment && formData.amount_to_collect && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center mb-2">
                <Banknote className="w-4 h-4 text-amber-600 mr-2" />
                <span className="font-medium text-amber-900 text-sm">Cash on Delivery</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-amber-700">Carrier will collect</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(formData.amount_to_collect)} FCFA</p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <CreditCard className="w-4 h-4 inline mr-1.5" />
              Select Payment Method
            </label>
            <div className="space-y-2.5">
              {[
                { id: 'orange_money', name: 'Orange Money', icon: '🟠' },
                { id: 'mtn_momo', name: 'MTN MoMo', icon: '🟡' },
                { id: 'merchant_wallet', name: 'Merchant Wallet', icon: '💼' }
              ].map((method) => (
                <label
                  key={method.id}
                  className={`
                    flex items-center p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 min-h-touch
                    ${formData.payment_method === method.id 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'}
                  `}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.id}
                    checked={formData.payment_method === method.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
                    className="sr-only"
                  />
                  <span className="text-xl sm:text-2xl mr-3">{method.icon}</span>
                  <span className="font-medium text-gray-900 text-sm">{method.name}</span>
                  {formData.payment_method === method.id && (
                    <Check className="w-5 h-5 ml-auto text-orange-500" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.submit}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-1.5 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium min-h-touch sm:min-h-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium min-h-touch shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Delivery'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="mobile-card text-center py-6 sm:py-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delivery Created!</h2>
          <p className="text-gray-500 text-sm mb-5 sm:mb-6">
            Your delivery request has been created and is awaiting carrier assignment.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-5 sm:mb-6">
            <p className="text-xs text-gray-500">Delivery ID</p>
            <p className="text-xl font-bold text-gray-900">{createdDeliveryId}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center sm:space-x-0">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 text-sm font-medium min-h-touch shadow-sm"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setStep(1);
                setFormData({
                  product_description: '',
                  product_value: 0,
                  customer_name: '',
                  customer_phone: '',
                  delivery_address: '',
                  delivery_latitude: 0,
                  delivery_longitude: 0,
                  payment_method: 'orange_money',
                  collect_payment: false,
                  amount_to_collect: undefined
                });
                setPickupLocation(null);
                setDeliveryLocation(null);
                setPickupSearchQuery('');
                setDeliverySearchQuery('');
                setCalculatedCost(null);
                setCreatedDeliveryId(null);
              }}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium min-h-touch"
            >
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDelivery;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';
import { CreateDeliveryRequest, PaymentMethod, AddressSearchResult, DeliveryCostCalculation } from '../types';
import { searchAddresses, createDelivery, calculateDeliveryCost } from '../services/api';

const CreateDelivery: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<DeliveryCostCalculation | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSearchResult[]>([]);
  const [searchingAddresses, setSearchingAddresses] = useState(false);
  const [createdDeliveryId, setCreatedDeliveryId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDeliveryRequest>({
    product_description: '',
    product_value: 0,
    customer_name: '',
    customer_phone: '',
    delivery_address_id: '',
    payment_method: 'orange_money'
  });

  const [selectedAddress, setSelectedAddress] = useState<AddressSearchResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search addresses when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (addressQuery.length >= 2) {
        setSearchingAddresses(true);
        try {
          const results = await searchAddresses(addressQuery, 5);
          setAddressSuggestions(results);
        } catch (err) {
          console.error('Failed to search addresses:', err);
          setAddressSuggestions([]);
        } finally {
          setSearchingAddresses(false);
        }
      } else {
        setAddressSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [addressQuery]);

  const calculateCost = useCallback(async (addressId: string) => {
    try {
      const cost = await calculateDeliveryCost(addressId);
      setCalculatedCost(cost);
    } catch (err) {
      console.error('Failed to calculate cost:', err);
      const distance = Math.random() * 15 + 1;
      setCalculatedCost({
        distance_km: Math.round(distance * 10) / 10,
        delivery_cost: calculateCostFromDistance(distance),
        currency: 'FCFA'
      });
    }
  }, []);

  useEffect(() => {
    if (selectedAddress?.id) {
      calculateCost(selectedAddress.id);
    }
  }, [selectedAddress, calculateCost]);

  const calculateCostFromDistance = (distance: number): number => {
    if (distance <= 3) return 1000;
    if (distance <= 6) return 1500;
    if (distance <= 10) return 2000;
    return 3000;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.product_description.length < 5) {
      newErrors.product_description = 'Product description must be at least 5 characters';
    }
    if (formData.product_description.length > 255) {
      newErrors.product_description = 'Product description must be less than 255 characters';
    }
    if (formData.product_value <= 0) {
      newErrors.product_value = 'Product value must be greater than 0';
    }
    if (formData.customer_name.length < 3) {
      newErrors.customer_name = 'Customer name must be at least 3 characters';
    }
    if (formData.customer_name.length > 100) {
      newErrors.customer_name = 'Customer name must be less than 100 characters';
    }
    
    const phoneRegex = /^6[0-9]{8}$/;
    const cleanPhone = formData.customer_phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      newErrors.customer_phone = 'Invalid Cameroon phone number (6XX XXX XXX)';
    }
    
    if (!selectedAddress) {
      newErrors.delivery_address = 'Please select a delivery address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSelect = (address: AddressSearchResult) => {
    setSelectedAddress(address);
    setAddressQuery(address.address_text);
    setShowAddressSuggestions(false);
    setFormData(prev => ({
      ...prev,
      delivery_address_id: address.id || ''
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const delivery = await createDelivery(formData);
      setCreatedDeliveryId(delivery.delivery_id);
      setStep(3);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create delivery' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('fr-CM');
  };

  const stepLabels = ['Details', 'Payment', 'Done'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-center space-x-3 sm:space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {step > s ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-10 sm:w-16 h-1 rounded ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2 space-x-6 sm:space-x-12 text-xs sm:text-sm">
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Delivery Details</h2>
          
          <div className="space-y-5">
            {/* Product Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Package className="w-4 h-4 inline mr-1.5" />
                Product Description
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

            {/* Product Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Value (FCFA)
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

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4 inline mr-1.5" />
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="e.g., John Doe"
                className="mobile-input"
              />
              {errors.customer_name && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.customer_name}
                </p>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 inline mr-1.5" />
                Customer Phone Number
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

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1.5" />
                Delivery Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(e) => {
                    setAddressQuery(e.target.value);
                    setShowAddressSuggestions(true);
                  }}
                  onFocus={() => setShowAddressSuggestions(true)}
                  placeholder="Start typing address..."
                  className="mobile-input"
                />
                {searchingAddresses && (
                  <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                    {addressSuggestions.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleAddressSelect(addr)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900 text-sm">{addr.address_text}</p>
                        {addr.area && <p className="text-xs text-gray-500 mt-0.5">{addr.area}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.delivery_address && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.delivery_address}
                </p>
              )}
              {selectedAddress && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm text-emerald-800 font-medium">{selectedAddress.address_text}</p>
                  {selectedAddress.area && (
                    <p className="text-xs text-emerald-600 mt-0.5">{selectedAddress.area}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNextStep}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 font-medium text-sm min-h-touch shadow-sm"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="mobile-card">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Payment Details</h2>

          {/* Cost Summary */}
          {calculatedCost && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center mb-2">
                <Calculator className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900 text-sm">Delivery Cost Calculation</span>
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
            <h3 className="font-medium text-gray-900 mb-3 text-sm">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Product</span>
                <span className="text-gray-900 text-right truncate max-w-[180px]">{formData.product_description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Value</span>
                <span className="text-gray-900">{formatCurrency(formData.product_value)} FCFA</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Customer</span>
                <span className="text-gray-900 text-right truncate max-w-[180px]">{formData.customer_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Address</span>
                <span className="text-gray-900 text-right truncate max-w-[180px]">{selectedAddress?.address_text}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
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
              onClick={() => setStep(1)}
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
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="mobile-card text-center py-6 sm:py-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delivery Created!</h2>
          <p className="text-gray-500 text-sm mb-5 sm:mb-6">
            Your delivery request has been created and is awaiting rider assignment.
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
                  delivery_address_id: '',
                  payment_method: 'orange_money'
                });
                setSelectedAddress(null);
                setAddressQuery('');
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

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { CreateDeliveryRequest, PaymentMethod, AddressSearchResult, DeliveryCostCalculation } from '../types';
import { mockAddresses, yaoundeAddresses } from '../data/mockData';

const CreateDelivery: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<DeliveryCostCalculation | null>(null);

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

  const addressSuggestions = addressQuery.length >= 2 
    ? yaoundeAddresses.filter(a => 
        a.text.toLowerCase().includes(addressQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    if (selectedAddress) {
      // Simulate cost calculation
      const distance = Math.random() * 15 + 1; // Mock distance
      const cost = calculateCostFromDistance(distance);
      setCalculatedCost({
        distance_km: Math.round(distance * 10) / 10,
        delivery_cost: cost,
        currency: 'FCFA'
      });
    }
  }, [selectedAddress]);

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

  const handleAddressSelect = (address: typeof yaoundeAddresses[0]) => {
    const addressResult: AddressSearchResult = {
      id: `addr-${Date.now()}`,
      address_text: address.text,
      latitude: address.lat,
      longitude: address.lon,
      area: address.area,
      is_saved: false
    };
    setSelectedAddress(addressResult);
    setAddressQuery(address.text);
    setShowAddressSuggestions(false);
    setFormData(prev => ({
      ...prev,
      delivery_address_id: addressResult.id!
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show success and redirect
    setStep(3);
    setLoading(false);
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('fr-CM');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2 space-x-12 text-sm">
          <span className={step >= 1 ? 'text-primary-600 font-medium' : 'text-gray-500'}>
            Delivery Details
          </span>
          <span className={step >= 2 ? 'text-primary-600 font-medium' : 'text-gray-500'}>
            Payment
          </span>
          <span className={step >= 3 ? 'text-primary-600 font-medium' : 'text-gray-500'}>
            Confirmation
          </span>
        </div>
      </div>

      {/* Step 1: Delivery Details */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Details</h2>
          
          <div className="space-y-6">
            {/* Product Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Package className="w-4 h-4 inline mr-2" />
                Product Description
              </label>
              <input
                type="text"
                value={formData.product_description}
                onChange={(e) => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
                placeholder="e.g., Samsung Galaxy S24 Ultra 256GB Black"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.product_description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.product_description}
                </p>
              )}
            </div>

            {/* Product Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Value (FCFA)
              </label>
              <input
                type="number"
                value={formData.product_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, product_value: parseInt(e.target.value) || 0 }))}
                placeholder="e.g., 450000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.product_value && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.product_value}
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-2" />
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.customer_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.customer_name}
                </p>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                Customer Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                  +237
                </span>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="6XX XXX XXX"
                  maxLength={9}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {errors.customer_phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.customer_phone}
                </p>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-2" />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((addr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddressSelect(addr)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">{addr.text}</p>
                        <p className="text-sm text-gray-500">{addr.area}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.delivery_address && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.delivery_address}
                </p>
              )}
              {selectedAddress && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">{selectedAddress.address_text}</p>
                  {selectedAddress.area && (
                    <p className="text-xs text-green-600">{selectedAddress.area}, Yaoundé</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNextStep}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>

          {/* Cost Summary */}
          {calculatedCost && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Delivery Cost Calculation</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-blue-700">Distance</p>
                  <p className="text-lg font-semibold text-blue-900">{calculatedCost.distance_km} km</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Delivery Cost</p>
                  <p className="text-lg font-semibold text-blue-900">{formatCurrency(calculatedCost.delivery_cost)} FCFA</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product</span>
                <span className="text-gray-900">{formData.product_description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Value</span>
                <span className="text-gray-900">{formatCurrency(formData.product_value)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span className="text-gray-900">{formData.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address</span>
                <span className="text-gray-900 text-right max-w-[200px]">{selectedAddress?.address_text}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Select Payment Method
            </label>
            <div className="space-y-3">
              {[
                { id: 'orange_money', name: 'Orange Money', icon: '🟠' },
                { id: 'mtn_momo', name: 'MTN MoMo', icon: '🟡' },
                { id: 'merchant_wallet', name: 'Merchant Wallet', icon: '💼' }
              ].map((method) => (
                <label
                  key={method.id}
                  className={`
                    flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                    ${formData.payment_method === method.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'}
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
                  <span className="text-2xl mr-3">{method.icon}</span>
                  <span className="font-medium text-gray-900">{method.name}</span>
                  {formData.payment_method === method.id && (
                    <Check className="w-5 h-5 ml-auto text-primary-600" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your delivery request has been created and is awaiting rider assignment.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Delivery ID</p>
            <p className="text-xl font-bold text-gray-900">TRD-{1001 + Math.floor(Math.random() * 100)}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
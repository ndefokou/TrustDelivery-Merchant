import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  CreditCard,
  Loader2
} from 'lucide-react';
import { Delivery, DeliveryTimelineEvent } from '../types';
import { formatDeliveryStatus, getStatusColor, formatPaymentMethod, formatFailureReason } from '../types';
import { getDeliveryById } from '../services/api';
import { format } from 'date-fns';

const DeliveryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDelivery = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDeliveryById(id!);
      setDelivery(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDelivery();
    }
  }, [id, fetchDelivery]);

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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Error loading delivery</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchDelivery}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 mr-2"
        >
          Retry
        </button>
        <Link to="/" className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Delivery not found</h2>
        <Link to="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const timeline: DeliveryTimelineEvent[] = [
    {
      status: 'Created',
      timestamp: delivery.created_at,
      description: 'Delivery request created',
      completed: true
    },
    {
      status: 'Awaiting Assignment',
      timestamp: delivery.created_at,
      description: 'Waiting for rider assignment',
      completed: ['assigned', 'in_transit', 'delivered'].includes(delivery.status)
    },
    {
      status: 'Assigned',
      timestamp: delivery.assigned_at || '',
      description: 'Rider assigned to delivery',
      completed: ['in_transit', 'delivered'].includes(delivery.status)
    },
    {
      status: 'In Transit',
      timestamp: delivery.picked_up_at || '',
      description: 'Package picked up, in transit',
      completed: delivery.status === 'delivered'
    },
    {
      status: 'Delivered',
      timestamp: delivery.delivered_at || '',
      description: 'Package delivered successfully',
      completed: delivery.status === 'delivered'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{delivery.delivery_id}</h1>
            <p className="text-gray-500">{delivery.product_description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
            {formatDeliveryStatus(delivery.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Timeline</h2>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-start">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${event.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                  `}>
                    {event.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {event.status}
                      </h3>
                      {event.timestamp && (
                        <span className="text-sm text-gray-500">
                          {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium text-gray-900">{delivery.product_description}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Value</p>
                  <p className="font-medium text-gray-900">{delivery.product_value.toLocaleString()} {delivery.currency}</p>
                </div>
              </div>
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">+237 {delivery.customer_phone}</p>
                </div>
              </div>
              <div className="flex items-start md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="font-medium text-gray-900">{delivery.delivery_address_text}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Failed Delivery Info */}
          {delivery.status === 'failed' && delivery.failure_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-600" />
                <div className="ml-3">
                  <h3 className="font-medium text-red-900">Delivery Failed</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {formatFailureReason(delivery.failure_reason)}
                  </p>
                  {delivery.rider_notes && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-900">Rider Notes:</p>
                      <p className="text-sm text-red-700 mt-1">{delivery.rider_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Proof of Delivery */}
          {delivery.status === 'delivered' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Proof of Delivery</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="ml-2 text-green-800">OTP Verified Successfully</span>
                </div>
                {delivery.delivery_photo_url && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-green-900 mb-2">Delivery Photo:</p>
                    <img 
                      src={delivery.delivery_photo_url} 
                      alt="Delivery proof" 
                      className="rounded-lg max-w-md"
                    />
                  </div>
                )}
                {delivery.delivery_gps_coordinates && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="ml-2 text-green-800">
                      GPS: {delivery.delivery_gps_coordinates}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{formatPaymentMethod(delivery.payment_method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${
                  delivery.payment_status === 'completed' ? 'text-green-600' : 
                  delivery.payment_status === 'failed' ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {delivery.payment_status.charAt(0).toUpperCase() + delivery.payment_status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Cost</span>
                <span className="font-medium">{delivery.delivery_cost.toLocaleString()} {delivery.currency}</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="text-gray-900 font-medium">Total</span>
                <span className="text-gray-900 font-bold">{delivery.delivery_cost.toLocaleString()} {delivery.currency}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Info</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Distance</span>
                <span className="font-medium">{delivery.distance_km.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{format(new Date(delivery.created_at), 'MMM d, yyyy')}</span>
              </div>
              {delivery.assigned_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned</span>
                  <span className="font-medium">{format(new Date(delivery.assigned_at), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
              {delivery.otp_code && (
                <div className="flex justify-between">
                  <span className="text-gray-500">OTP Code</span>
                  <span className="font-medium font-mono">{delivery.otp_code}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
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
  Loader2,
  Navigation,
  Truck
} from 'lucide-react';
import { Delivery, DeliveryTimelineEvent } from '../types';
import { formatDeliveryStatus, getStatusColor } from '../types';
import { getDeliveryById } from '../services/api';
import { format } from 'date-fns';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
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

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const YAOUNDE_CENTER: [number, number] = [3.8480, 11.5020];

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

  const mapCenter: [number, number] = useMemo(() => {
    if (delivery?.delivery_latitude && delivery?.delivery_longitude) {
      return [delivery.delivery_latitude, delivery.delivery_longitude];
    }
    return YAOUNDE_CENTER;
  }, [delivery]);

  const hasValidCoordinates = delivery?.delivery_latitude && delivery?.delivery_longitude;

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
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Error loading delivery</h2>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <button 
            onClick={fetchDelivery}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium min-h-touch sm:min-h-0"
          >
            Retry
          </button>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium min-h-touch sm:min-h-0">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Delivery not found</h2>
        <Link to="/" className="mt-4 inline-block text-orange-500 hover:text-orange-600 font-medium text-sm">
          ← Backto Dashboard
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
      description: 'Waiting for carrier assignment',
      completed: ['assigned', 'in_transit', 'delivered'].includes(delivery.status)
    },
    {
      status: 'Assigned',
      timestamp: delivery.assigned_at || '',
      description: 'Carrier assigned to delivery',
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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Link 
            to="/deliveries" 
            className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-2 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Deliveries
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{delivery.delivery_id}</h1>
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(delivery.status)} self-start sm:self-auto`}>
              {formatDeliveryStatus(delivery.status)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{delivery.product_description}</p>
        </div>
      </div>

      {/* Map Section */}
      {hasValidCoordinates && (
        <div className="mobile-card !p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Delivery Location
            </h2>
          </div>
          <div className="h-64 sm:h-80">
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {delivery.delivery_latitude && delivery.delivery_longitude && (
                <Marker
                  position={[delivery.delivery_latitude, delivery.delivery_longitude]}
                  icon={deliveryIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">Delivery Location</p>
                      <p className="text-gray-500">{delivery.delivery_address}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Delivery Info */}
        <div className="mobile-card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2.5 sm:ml-3">
                <p className="text-xs text-gray-500">Product</p>
                <p className="text-sm font-medium text-gray-900">{delivery.product_description}</p>
              </div>
            </div>
            <div className="flex items-start">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2.5 sm:ml-3">
                <p className="text-xs text-gray-500">Value</p>
                <p className="text-sm font-medium text-gray-900">{delivery.product_value.toLocaleString()} {delivery.currency}</p>
              </div>
            </div>
            <div className="flex items-start">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2.5 sm:ml-3">
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">{delivery.customer_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2.5 sm:ml-3">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">+237 {delivery.customer_phone}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="ml-2.5 sm:ml-3">
                <p className="text-xs text-gray-500">Delivery Address</p>
                <p className="text-sm font-medium text-gray-900">{delivery.delivery_address}</p>
              </div>
            </div>
            {delivery.collect_payment && delivery.amount_to_collect && (
              <div className="flex items-start">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="ml-2.5 sm:ml-3">
                  <p className="text-xs text-gray-500">Cash on Delivery</p>
                  <p className="text-sm font-medium text-amber-600">{delivery.amount_to_collect.toLocaleString()} FCFA</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="mobile-card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Delivery Timeline</h2>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={index} className="flex items-start">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${event.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}
                `}>
                  {event.completed ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-medium ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {event.status}
                    </h3>
                    {event.timestamp && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs sm:text-sm ${event.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Cost */}
      <div className="mobile-card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Delivery Cost</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">{delivery.delivery_cost.toLocaleString()} FCFA</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">{format(new Date(delivery.created_at), 'MMM d, yyyy HH:mm')}</p>
          </div>
        </div>
      </div>

      {/* Failed Delivery Info */}
      {delivery.status === 'failed' && delivery.failure_reason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
            <div className="ml-2.5 sm:ml-3">
              <h3 className="text-sm font-medium text-red-900">Delivery Failed</h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                Reason: {delivery.failure_reason}
              </p>
{delivery.carrier_notes && (

                <div className="mt-3">
                  <p className="text-xs sm:text-sm font-medium text-red-900">Carrier Notes:</p>
                  <p className="text-xs sm:text-sm text-red-700 mt-1">{delivery.carrier_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery */}
      {delivery.status === 'delivered' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-emerald-900 mb-3">Proof of Delivery</h2>
          <div className="space-y-2.5">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <span className="ml-2 text-sm text-emerald-800">Delivery Completed Successfully</span>
            </div>
            {delivery.delivered_at && (
              <p className="text-xs sm:text-sm text-emerald-700">
                Delivered on {format(new Date(delivery.delivered_at), 'MMMM d, yyyy \'at\' HH:mm')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetails;
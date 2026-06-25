import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin, Package, Loader2, Search } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../types';
import { getDeliveries } from '../services/api';
import { formatDeliveryStatus } from '../types';

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

const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const YAOUNDE_CENTER: [number, number] = [3.8480, 11.5020];

const TrackingPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const trackableStatuses: DeliveryStatus[] = ['assigned', 'in_transit'];

  useEffect(() => {
    fetchTrackableDeliveries();
  }, []);

  const fetchTrackableDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDeliveries(undefined, 1, 100);
      const trackable = response.deliveries.filter(d => trackableStatuses.includes(d.status));
      setDeliveries(trackable);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(d => 
    searchQuery === '' || 
    d.delivery_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedDelivery?.delivery_latitude && selectedDelivery?.delivery_longitude) {
      return [selectedDelivery.delivery_latitude, selectedDelivery.delivery_longitude];
    }
    return YAOUNDE_CENTER;
  }, [selectedDelivery]);

  const getStatusBadge = (status: DeliveryStatus) => {
    const styles = {
      awaiting_assignment: 'bg-amber-50 text-amber-700 border-amber-200',
      assigned: 'bg-blue-50 text-blue-700 border-blue-200',
      in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {formatDeliveryStatus(status)}
      </span>
    );
  };

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
          onClick={fetchTrackableDeliveries}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track your active deliveries on the map</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="mobile-card !p-0 overflow-hidden">
            <div className="h-[400px] sm:h-[500px]">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedDelivery && selectedDelivery.delivery_latitude && selectedDelivery.delivery_longitude && (
                  <>
                    {selectedDelivery.delivery_latitude && selectedDelivery.delivery_longitude && (
                      <Marker
                        position={[selectedDelivery.delivery_latitude, selectedDelivery.delivery_longitude]}
                        icon={deliveryIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-medium">Delivery Location</p>
                            <p className="text-gray-500">{selectedDelivery.delivery_address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </>
                )}
                {!selectedDelivery && deliveries.map(delivery => (
                  delivery.delivery_latitude && delivery.delivery_longitude && (
                    <Marker
                      key={delivery.id}
                      position={[delivery.delivery_latitude, delivery.delivery_longitude]}
                      icon={deliveryIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-medium">{delivery.delivery_id}</p>
                          <p className="text-gray-500">{delivery.customer_name}</p>
                          <Link to={`/delivery/${delivery.id}`} className="text-orange-500 hover:underline">
                            View details
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mobile-card">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-input !pl-10"
              />
            </div>
          </div>

          <div className="mobile-card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Active Deliveries</h2>
            {filteredDeliveries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {searchQuery ? 'No matching deliveries found' : 'No active deliveries to track'}
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {filteredDeliveries.map((delivery) => (
                  <button
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(selectedDelivery?.id === delivery.id ? null : delivery)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedDelivery?.id === delivery.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{delivery.delivery_id}</span>
                      {getStatusBadge(delivery.status)}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{delivery.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">{delivery.delivery_address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDelivery && (
            <div className="mobile-card">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Delivery Status</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Location</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDelivery.delivery_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDelivery.product_description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedDelivery.status === 'in_transit' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <Truck className={`w-4 h-4 ${
                      selectedDelivery.status === 'in_transit' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedDelivery.status === 'in_transit' ? 'In Transit' : 'Assigned - Awaiting Pickup'}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                to={`/delivery/${selectedDelivery.id}`}
                className="mt-4 block w-full text-center px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                View Full Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
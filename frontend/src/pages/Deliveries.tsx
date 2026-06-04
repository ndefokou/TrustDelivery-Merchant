import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Loader2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../types';
import { getDeliveries } from '../services/api';

const Deliveries: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DeliveryStatus | 'all'>('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filters: { label: string; value: DeliveryStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Awaiting', value: 'awaiting_assignment' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'In Transit', value: 'in_transit' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Failed', value: 'failed' },
  ];

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const response = await getDeliveries(status, 1, 100);
      
      setDeliveries(response.deliveries);
      setTotalCount(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const getStatusBadge = (status: DeliveryStatus) => {
    const styles = {
      awaiting_assignment: 'bg-amber-50 text-amber-700 border-amber-200',
      assigned: 'bg-blue-50 text-blue-700 border-blue-200',
      in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
    };

    const dotColors = {
      awaiting_assignment: 'bg-amber-500',
      assigned: 'bg-blue-500',
      in_transit: 'bg-orange-500',
      delivered: 'bg-emerald-500',
      failed: 'bg-red-500',
    };

    const labels = {
      awaiting_assignment: 'Awaiting',
      assigned: 'Assigned',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium border ${styles[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${dotColors[status]}`} />
        {labels[status]}
      </span>
    );
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch = 
      searchQuery === '' ||
      delivery.delivery_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.product_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.delivery_address_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
          onClick={fetchDeliveries}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {filteredDeliveries.length} of {totalCount} deliveries
          </p>
        </div>
        <Link
          to="/create-delivery"
          className="inline-flex items-center px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 font-medium text-sm shadow-sm flex-shrink-0 min-h-touch"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
          <span className="hidden sm:inline">New delivery</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-input !pl-10 !py-2.5 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden p-2.5 rounded-xl border transition-colors min-h-touch min-w-touch flex items-center justify-center ${
              showFilters ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs - Always visible on desktop, toggleable on mobile */}
        <div className={`flex-wrap gap-2 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-touch ${
                activeFilter === filter.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      <div className="mobile-card !p-0 overflow-hidden">
        {/* Mobile: Card list */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredDeliveries.map((delivery) => (
            <Link
              key={delivery.id}
              to={`/delivery/${delivery.id}`}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{delivery.delivery_id}</span>
                  {getStatusBadge(delivery.status)}
                </div>
                <p className="text-sm text-gray-700 truncate">{delivery.product_description}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-gray-500">{delivery.customer_name}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{delivery.distance_km.toFixed(1)} km</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-medium text-gray-700">{delivery.delivery_cost.toLocaleString()} FCFA</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {delivery.delivery_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 truncate max-w-xs block">
                      {delivery.product_description}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">
                        {delivery.customer_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {delivery.customer_phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 truncate max-w-xs block">
                      {delivery.delivery_address_text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {delivery.distance_km.toFixed(1)} km
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {delivery.delivery_cost.toLocaleString()} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(delivery.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/delivery/${delivery.id}`}
                      className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDeliveries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No deliveries found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deliveries;

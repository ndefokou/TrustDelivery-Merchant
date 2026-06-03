import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../types';
import { getDeliveries } from '../services/api';

const Deliveries: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DeliveryStatus | 'all'>('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const filters: { label: string; value: DeliveryStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Awaiting Assignment', value: 'awaiting_assignment' },
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
      awaiting_assignment: 'Awaiting Assignment',
      assigned: 'Assigned',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status]}`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${dotColors[status]}`} />
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
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchDeliveries}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredDeliveries.length} of {totalCount} deliveries
          </p>
        </div>
        <Link
          to="/create-delivery"
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New delivery
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, customer, product, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
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
            <p className="text-gray-500">No deliveries found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deliveries;

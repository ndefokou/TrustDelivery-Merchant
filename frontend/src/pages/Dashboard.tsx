import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Truck,
  CheckCircle, 
  XCircle,
  TrendingUp,
  ArrowUpRight,
  Box,
  Loader2
} from 'lucide-react';
import { Delivery, DeliveryStatus, DeliveryStats } from '../types';
import { getDeliveries, getDeliveryStats } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats and recent deliveries in parallel
      const [statsData, deliveriesData] = await Promise.all([
        getDeliveryStats(),
        getDeliveries(undefined, 1, 6)
      ]);
      
      setStats(statsData);
      setRecentDeliveries(deliveriesData.deliveries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dotColors[status]}`} />
        {labels[status]}
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
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-bold text-gray-900">Operations overview</h1>
        </div>
        <div className="flex items-center text-sm text-emerald-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+12% on-time deliveries this week</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Deliveries */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <Box className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.active_deliveries}</p>
          <p className="text-sm text-gray-500">Active deliveries</p>
        </div>

        {/* Awaiting Assignment */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.awaiting_assignment}</p>
          <p className="text-sm text-gray-500">Awaiting assignment</p>
        </div>

        {/* In Transit */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
            <Truck className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.in_transit}</p>
          <p className="text-sm text-gray-500">In transit</p>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
          <p className="text-sm text-gray-500">Delivered</p>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
      </div>

      {/* Total Spending Card */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 max-w-xs">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.total_spending.toLocaleString()} FCFA</p>
        <p className="text-sm text-gray-500">Total spending</p>
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent deliveries</h2>
            <p className="text-sm text-gray-500">Most recent {recentDeliveries.length} orders</p>
          </div>
          <Link 
            to="/deliveries" 
            className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center"
          >
            View all
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {delivery.delivery_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {delivery.product_description}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {delivery.customer_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {delivery.delivery_address_text}
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
      </div>
    </div>
  );
};

export default Dashboard;

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
  Loader2,
  ChevronRight,
  Banknote
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
      awaiting_assignment: 'Pending',
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
          onClick={fetchDashboardData}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total', value: stats.total_deliveries, icon: Box, color: 'bg-slate-100 text-slate-600' },
    { label: 'Pending', value: stats.awaiting_assignment, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'In Transit', value: stats.in_transit, icon: Truck, color: 'bg-orange-100 text-orange-600' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <Link
          to="/create-delivery"
          className="inline-flex items-center px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
        >
          Create Delivery
        </Link>
      </div>

      {/* Stats Cards - Scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-4 sm:overflow-visible scrollbar-none">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="mobile-card flex-shrink-0 w-32 sm:w-auto">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${card.color} flex items-center justify-center mb-2.5`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="mobile-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Shipping Spend</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_spending.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>
        <div className="mobile-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">COD Collected</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="mobile-card !p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Deliveries</h2>
            <p className="text-xs sm:text-sm text-gray-500">Latest {recentDeliveries.length} orders</p>
          </div>
          <Link 
            to="/deliveries" 
            className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5"
          >
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Mobile: Card list */}
        <div className="sm:hidden divide-y divide-gray-100">
          {recentDeliveries.map((delivery) => (
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
                <p className="text-sm text-gray-600 truncate">{delivery.product_description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{delivery.customer_name} · {delivery.delivery_cost.toLocaleString()} FCFA</p>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tracking ID
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
            <tbody className="divide-y divide-gray-100">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {delivery.delivery_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {delivery.customer_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {delivery.delivery_address}
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
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">No deliveries yet</p>
            <Link
              to="/create-delivery"
              className="mt-4 inline-block px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Create your first delivery
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
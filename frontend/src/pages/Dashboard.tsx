import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Delivery, DeliveryStats, getStatusColor, formatDeliveryStatus } from '../types';
import { mockDeliveries, mockStats } from '../data/mockData';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const stats = mockStats;
  const recentDeliveries = mockDeliveries.slice(0, 5);

  const statCards = [
    { 
      name: 'Active Deliveries', 
      value: stats.active_deliveries, 
      icon: Truck, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      name: 'Awaiting Assignment', 
      value: stats.awaiting_assignment, 
      icon: Clock, 
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    { 
      name: 'In Transit', 
      value: stats.in_transit, 
      icon: Truck, 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    { 
      name: 'Delivered', 
      value: stats.delivered, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      name: 'Failed', 
      value: stats.failed, 
      icon: XCircle, 
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
    { 
      name: 'Total Spending', 
      value: `${stats.total_spending.toLocaleString()} FCFA`, 
      icon: TrendingUp, 
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's an overview of your deliveries.
          </p>
        </div>
        <Link
          to="/create-delivery"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Delivery
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
            <Link 
              to="/" 
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        
        {recentDeliveries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first delivery.
            </p>
            <Link
              to="/create-delivery"
              className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Delivery
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentDeliveries.map((delivery) => (
              <Link
                key={delivery.id}
                to={`/delivery/${delivery.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {delivery.delivery_id}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                        {formatDeliveryStatus(delivery.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 truncate">
                      {delivery.product_description}
                    </p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span>{delivery.customer_name}</span>
                      <span className="mx-2">•</span>
                      <span>{format(new Date(delivery.created_at), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {delivery.delivery_cost.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-500">
                      {delivery.distance_km.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
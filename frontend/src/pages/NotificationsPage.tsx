import React, { useState, useEffect } from 'react';
import { Bell, Package, Truck, CheckCircle, XCircle, Clock, Loader2, ChevronRight } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../types';
import { getDeliveries } from '../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'created' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  delivery_id: string;
  delivery_display_id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDeliveries(undefined, 1, 50);
      
      const notifs: Notification[] = [];
      
      response.deliveries.forEach(delivery => {
        notifs.push({
          id: `${delivery.id}-created`,
          type: 'created',
          delivery_id: delivery.id,
          delivery_display_id: delivery.delivery_id,
          message: `Delivery ${delivery.delivery_id} created`,
          timestamp: delivery.created_at,
          read:Math.random() > 0.3,
        });
        
        if (delivery.assigned_at) {
          notifs.push({
            id: `${delivery.id}-assigned`,
            type: 'assigned',
            delivery_id: delivery.id,
            delivery_display_id: delivery.delivery_id,
            message: `Delivery ${delivery.delivery_id} assigned to carrier`,
            timestamp: delivery.assigned_at,
            read: Math.random() > 0.3,
          });
        }
        
        if (delivery.picked_up_at) {
          notifs.push({
            id: `${delivery.id}-in_transit`,
            type: 'in_transit',
            delivery_id: delivery.id,
            delivery_display_id: delivery.delivery_id,
            message: `Delivery ${delivery.delivery_id} picked up and in transit`,
            timestamp: delivery.picked_up_at,
            read: Math.random() > 0.3,
          });
        }
        
        if (delivery.delivered_at) {
          notifs.push({
            id: `${delivery.id}-delivered`,
            type: 'delivered',
            delivery_id: delivery.id,
            delivery_display_id: delivery.delivery_id,
            message: `Delivery ${delivery.delivery_id} completed successfully`,
            timestamp: delivery.delivered_at,
            read: Math.random() > 0.3,
          });
        }
        
        if (delivery.status === 'failed') {
          notifs.push({
            id: `${delivery.id}-failed`,
            type: 'failed',
            delivery_id: delivery.id,
            delivery_display_id: delivery.delivery_id,
            message: `Delivery ${delivery.delivery_id} failed`,
            timestamp: delivery.updated_at,
            read: Math.random() > 0.3,
          });
        }
      });
      
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setNotifications(notifs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'created':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'assigned':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'in_transit':
        return <Truck className="w-5 h-5 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'created':
        return 'bg-blue-50';
      case 'assigned':
        return 'bg-amber-50';
      case 'in_transit':
        return 'bg-orange-50';
      case 'delivered':
        return 'bg-emerald-50';
      case 'failed':
        return 'bg-red-50';
    }
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
          onClick={fetchNotifications}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">Stay updated on your deliveries</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'unread'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="mobile-card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </h3>
          <p className="text-sm text-gray-500">
            {filter === 'unread' ? 'All notifications have been read' : 'Notifications will appear here as deliveries progress'}
          </p>
        </div>
      ) : (
        <div className="mobile-card !p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                to={`/delivery/${notification.delivery_id}`}
                onClick={() => markAsRead(notification.id)}
                className={`flex items-start gap-3 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-orange-50/50' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationBg(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
                      {notification.delivery_display_id}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notification.timestamp), 'MMM d, yyyy \'at\' HH:mm')}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
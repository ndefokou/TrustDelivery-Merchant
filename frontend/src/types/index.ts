export interface Delivery {
  id: string;
  delivery_id: string;
  merchant_id: string;
  product_description: string;
  product_value: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  delivery_address_id: string;
  delivery_address_text: string;
  distance_km: number;
  delivery_cost: number;
  status: DeliveryStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  assigned_rider_id?: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  failure_reason?: FailureReason;
  rider_notes?: string;
  otp_code?: string;
  otp_verified: boolean;
  delivery_photo_url?: string;
  delivery_gps_coordinates?: string;
}

export type DeliveryStatus = 
  | 'awaiting_assignment'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export type PaymentMethod = 
  | 'orange_money'
  | 'mtn_momo'
  | 'merchant_wallet';

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed';

export type FailureReason = 
  | 'customer_unavailable'
  | 'wrong_address'
  | 'phone_unreachable'
  | 'customer_refused_product'
  | 'other';

export interface DeliveryListResponse {
  deliveries: Delivery[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DeliveryStats {
  total_deliveries: number;
  active_deliveries: number;
  awaiting_assignment: number;
  in_transit: number;
  delivered: number;
  failed: number;
  total_spending: number;
  currency: string;
}

export interface DeliveryTimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface Address {
  id: string;
  address_text: string;
  latitude: number;
  longitude: number;
  area?: string;
  is_saved: boolean;
  created_at: string;
}

export interface AddressSearchResult {
  id?: string;
  address_text: string;
  latitude: number;
  longitude: number;
  area?: string;
  is_saved: boolean;
}

export interface CreateDeliveryRequest {
  product_description: string;
  product_value: number;
  customer_name: string;
  customer_phone: string;
  delivery_address_id: string;
  payment_method: PaymentMethod;
}

export interface DeliveryCostCalculation {
  distance_km: number;
  delivery_cost: number;
  currency: string;
}

export interface Merchant {
  id: string;
  email: string;
  business_name: string;
  phone: string;
  address: string;
  dispatch_latitude: number;
  dispatch_longitude: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export const formatDeliveryStatus = (status: DeliveryStatus): string => {
  switch (status) {
    case 'awaiting_assignment':
      return 'Awaiting Assignment';
    case 'assigned':
      return 'Assigned';
    case 'in_transit':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
};

export const formatPaymentMethod = (method: PaymentMethod): string => {
  switch (method) {
    case 'orange_money':
      return 'Orange Money';
    case 'mtn_momo':
      return 'MTN MoMo';
    case 'merchant_wallet':
      return 'Merchant Wallet';
    default:
      return method;
  }
};

export const formatFailureReason = (reason: FailureReason): string => {
  switch (reason) {
    case 'customer_unavailable':
      return 'Customer Unavailable';
    case 'wrong_address':
      return 'Wrong Address';
    case 'phone_unreachable':
      return 'Phone Unreachable';
    case 'customer_refused_product':
      return 'Customer Refused Product';
    case 'other':
      return 'Other';
    default:
      return reason;
  }
};

export const getStatusColor = (status: DeliveryStatus): string => {
  switch (status) {
    case 'awaiting_assignment':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-blue-100 text-blue-800';
    case 'in_transit':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
export interface Delivery {
  id: string;
  delivery_id: string;
  merchant_id: string;
  product_description: string;
  product_value: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_cost: number;
  status: DeliveryStatus;
  created_at: string;
  updated_at: string;
  assigned_carrier_id?: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  failure_reason?: string;
  carrier_notes?: string;
  otp_code?: string;
  collect_payment: boolean;
  amount_to_collect?: number;
  amount_collected?: number;
  collection_status?: CollectionStatus;
  collected_at?: string;
}

export type DeliveryStatus = 
  | 'awaiting_assignment'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export type CollectionStatus = 
  | 'pending'
  | 'collected'
  | 'not_collected';

export type PaymentMethod = 
  | 'orange_money'
  | 'mtn_momo'
  | 'merchant_wallet';

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
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  payment_method: PaymentMethod;
  collect_payment: boolean;
  amount_to_collect?: number;
}

export interface DeliveryCostCalculation {
  distance_km: number;
  delivery_cost: number;
  currency: string;
}

export type MerchantStatus = 'pending_approval' | 'active' | 'suspended' | 'rejected';

export type BusinessType =
  | 'electronics'
  | 'fashion'
  | 'beauty'
  | 'pharmacy'
  | 'food'
  | 'home_appliances'
  | 'general_merchandise'
  | 'other';

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  electronics: 'Electronics',
  fashion: 'Fashion',
  beauty: 'Beauty',
  pharmacy: 'Pharmacy',
  food: 'Food',
  home_appliances: 'Home Appliances',
  general_merchandise: 'General Merchandise',
  other: 'Other',
};

export const MERCHANT_STATUS_LABELS: Record<MerchantStatus, string> = {
  pending_approval: 'Pending Approval',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
};

export interface Merchant {
  id: string;
  email: string;
  business_name: string;
  business_type: BusinessType;
  business_address: string;
  business_phone: string;
  business_email: string | null;
  owner_name: string;
  owner_phone: string;
  national_id: string | null;
  status: MerchantStatus;
  dispatch_latitude: number;
  dispatch_longitude: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface RegisterRequest {
  // Step 1: Business Information
  business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  business_email?: string;
  // Step 2: Owner Information
  owner_name: string;
  owner_phone: string;
  national_id?: string;
  // Step 3: Security
  email: string;
  password: string;
  // Step 4: Terms
  accept_terms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  merchant: Merchant;
}

export const formatDeliveryStatus = (status: DeliveryStatus): string => {
  switch (status) {
    case 'awaiting_assignment':
      return 'Pending';
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
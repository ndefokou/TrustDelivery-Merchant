import { Delivery, DeliveryStats, AddressSearchResult } from '../types';

// Mock delivery data for demonstration
export const mockDeliveries: Delivery[] = [
  {
    id: '1',
    delivery_id: 'TRD-1001',
    merchant_id: 'merchant-1',
    product_description: 'Samsung Galaxy S24 Ultra 256GB Black',
    product_value: 450000,
    currency: 'FCFA',
    customer_name: 'John Doe',
    customer_phone: '677123456',
    delivery_address_id: 'addr-1',
    delivery_address_text: 'Bastos Carrefour Tradex',
    distance_km: 7.4,
    delivery_cost: 2000,
    status: 'delivered',
    payment_method: 'orange_money',
    payment_status: 'completed',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T14:45:00Z',
    assigned_rider_id: 'rider-1',
    assigned_at: '2024-01-15T10:35:00Z',
    picked_up_at: '2024-01-15T11:00:00Z',
    delivered_at: '2024-01-15T14:30:00Z',
    otp_verified: true,
    otp_code: '123456'
  },
  {
    id: '2',
    delivery_id: 'TRD-1002',
    merchant_id: 'merchant-1',
    product_description: 'iPhone 15 Pro Max 512GB Natural Titanium',
    product_value: 850000,
    currency: 'FCFA',
    customer_name: 'Marie Ngono',
    customer_phone: '699876543',
    delivery_address_id: 'addr-2',
    delivery_address_text: 'Mvan Carrefour',
    distance_km: 4.2,
    delivery_cost: 1500,
    status: 'in_transit',
    payment_method: 'mtn_momo',
    payment_status: 'completed',
    created_at: '2024-01-16T09:00:00Z',
    updated_at: '2024-01-16T10:15:00Z',
    assigned_rider_id: 'rider-2',
    assigned_at: '2024-01-16T09:15:00Z',
    picked_up_at: '2024-01-16T09:45:00Z',
    otp_verified: false,
    otp_code: '789012'
  },
  {
    id: '3',
    delivery_id: 'TRD-1003',
    merchant_id: 'merchant-1',
    product_description: 'MacBook Air M3 15-inch 512GB',
    product_value: 1200000,
    currency: 'FCFA',
    customer_name: 'Paul Atangana',
    customer_phone: '655234567',
    delivery_address_id: 'addr-3',
    delivery_address_text: 'Centre Ville Place de l\'Étoile',
    distance_km: 2.8,
    delivery_cost: 1000,
    status: 'awaiting_assignment',
    payment_method: 'merchant_wallet',
    payment_status: 'pending',
    created_at: '2024-01-16T11:30:00Z',
    updated_at: '2024-01-16T11:30:00Z',
    otp_verified: false,
    otp_code: '345678'
  },
  {
    id: '4',
    delivery_id: 'TRD-1004',
    merchant_id: 'merchant-1',
    product_description: 'Sony PlayStation 5 Digital Edition',
    product_value: 380000,
    currency: 'FCFA',
    customer_name: 'Jean-Pierre Mbida',
    customer_phone: '677987654',
    delivery_address_id: 'addr-4',
    delivery_address_text: 'Nlongkak Carrefour',
    distance_km: 5.5,
    delivery_cost: 1500,
    status: 'assigned',
    payment_method: 'orange_money',
    payment_status: 'completed',
    created_at: '2024-01-16T08:00:00Z',
    updated_at: '2024-01-16T08:30:00Z',
    assigned_rider_id: 'rider-3',
    assigned_at: '2024-01-16T08:20:00Z',
    otp_verified: false,
    otp_code: '901234'
  },
  {
    id: '5',
    delivery_id: 'TRD-1005',
    merchant_id: 'merchant-1',
    product_description: 'LG 55-inch 4K Smart TV',
    product_value: 520000,
    currency: 'FCFA',
    customer_name: 'Claire Fouda',
    customer_phone: '699123456',
    delivery_address_id: 'addr-5',
    delivery_address_text: 'Odza Carrefour',
    distance_km: 12.3,
    delivery_cost: 3000,
    status: 'failed',
    payment_method: 'mtn_momo',
    payment_status: 'completed',
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T17:30:00Z',
    assigned_rider_id: 'rider-1',
    assigned_at: '2024-01-15T14:10:00Z',
    picked_up_at: '2024-01-15T14:30:00Z',
    delivered_at: '2024-01-15T17:00:00Z',
    failure_reason: 'customer_unavailable',
    rider_notes: 'Customer was not available at the address. Called multiple times but no answer.',
    otp_verified: false,
    otp_code: '567890'
  }
];

export const mockStats: DeliveryStats = {
  total_deliveries: 5,
  active_deliveries: 3,
  awaiting_assignment: 1,
  in_transit: 1,
  delivered: 1,
  failed: 1,
  total_spending: 9000,
  currency: 'FCFA'
};

export const mockAddresses: AddressSearchResult[] = [
  {
    id: 'addr-1',
    address_text: 'Bastos Carrefour Tradex',
    latitude: 3.8808,
    longitude: 11.5022,
    area: 'Bastos',
    is_saved: true
  },
  {
    id: 'addr-2',
    address_text: 'Bastos Ecobank',
    latitude: 3.8795,
    longitude: 11.5010,
    area: 'Bastos',
    is_saved: true
  },
  {
    id: 'addr-3',
    address_text: 'Centre Ville Place de l\'Étoile',
    latitude: 3.8625,
    longitude: 11.5167,
    area: 'Centre Ville',
    is_saved: false
  },
  {
    id: 'addr-4',
    address_text: 'Mvan Carrefour',
    latitude: 3.8456,
    longitude: 11.5023,
    area: 'Mvan',
    is_saved: false
  },
  {
    id: 'addr-5',
    address_text: 'Nlongkak Carrefour',
    latitude: 3.8712,
    longitude: 11.4890,
    area: 'Nlongkak',
    is_saved: false
  },
  {
    id: 'addr-6',
    address_text: 'Messa Carrefour',
    latitude: 3.8645,
    longitude: 11.4789,
    area: 'Messa',
    is_saved: false
  },
  {
    id: 'addr-7',
    address_text: 'Odza Carrefour',
    latitude: 3.8234,
    longitude: 11.5123,
    area: 'Odza',
    is_saved: false
  },
  {
    id: 'addr-8',
    address_text: 'Mvolyé Carrefour',
    latitude: 3.8567,
    longitude: 11.5234,
    area: 'Mvolyé',
    is_saved: false
  },
  {
    id: 'addr-9',
    address_text: 'Etoudi Carrefour',
    latitude: 3.8901,
    longitude: 11.5345,
    area: 'Etoudi',
    is_saved: false
  },
  {
    id: 'addr-10',
    address_text: 'Ngoa-Ekelle Carrefour',
    latitude: 3.8456,
    longitude: 11.4876,
    area: 'Ngoa-Ekelle',
    is_saved: false
  }
];

export const yaoundeAddresses = [
  { text: 'Bastos Carrefour Tradex', lat: 3.8808, lon: 11.5022, area: 'Bastos' },
  { text: 'Bastos Ecobank', lat: 3.8795, lon: 11.5010, area: 'Bastos' },
  { text: 'Bastos Pharmacie', lat: 3.8782, lon: 11.5005, area: 'Bastos' },
  { text: 'Centre Ville Place de l\'Étoile', lat: 3.8625, lon: 11.5167, area: 'Centre Ville' },
  { text: 'Mvan Carrefour', lat: 3.8456, lon: 11.5023, area: 'Mvan' },
  { text: 'Mvog-Mbi Carrefour', lat: 3.8567, lon: 11.4987, area: 'Mvog-Mbi' },
  { text: 'Nlongkak Carrefour', lat: 3.8712, lon: 11.4890, area: 'Nlongkak' },
  { text: 'Messa Carrefour', lat: 3.8645, lon: 11.4789, area: 'Messa' },
  { text: 'Odza Carrefour', lat: 3.8234, lon: 11.5123, area: 'Odza' },
  { text: 'Mvolyé Carrefour', lat: 3.8567, lon: 11.5234, area: 'Mvolyé' },
  { text: 'Etoudi Carrefour', lat: 3.8901, lon: 11.5345, area: 'Etoudi' },
  { text: 'Ngoa-Ekelle Carrefour', lat: 3.8456, lon: 11.4876, area: 'Ngoa-Ekelle' },
  { text: 'Briqueterie Carrefour', lat: 3.8678, lon: 11.4923, area: 'Briqueterie' },
  { text: 'Mfoundi Carrefour', lat: 3.8789, lon: 11.5067, area: 'Mfoundi' },
  { text: 'Tsinga Carrefour', lat: 3.8567, lon: 11.5234, area: 'Tsinga' },
];
import { Delivery, DeliveryStats, AddressSearchResult } from '../types';

export const mockDeliveries: Delivery[] = [
  {
    id: '1',
    delivery_id: 'TRD-1013',
    merchant_id: 'merchant-1',
    product_description: 'Le Creuset Cast Iron Pan 26cm',
    product_value: 45000,
    currency: 'FCFA',
    customer_name: 'Estelle Fotsio',
    customer_phone: '682556677',
    delivery_address: 'Essos Hopital',
    delivery_latitude: 3.8891,
    delivery_longitude: 11.5234,
    delivery_cost: 1500,
    status: 'awaiting_assignment',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T14:45:00Z',
    otp_code: '123456'
  },
  {
    id: '2',
    delivery_id: 'TRD-1018',
    merchant_id: 'merchant-1',
    product_description: 'Samsung Galaxy S24 Ultra 256GB Black',
    product_value: 450000,
    currency: 'FCFA',
    customer_name: 'John Doe',
    customer_phone: '677123456',
    delivery_address: 'Bastos Carrefour Tradex',
    delivery_latitude: 3.8808,
    delivery_longitude: 11.5022,
    delivery_cost: 2000,
    status: 'in_transit',
    created_at: '2024-01-16T09:00:00Z',
    updated_at: '2024-01-16T10:15:00Z',
    assigned_rider_id: 'rider-2',
    assigned_at: '2024-01-16T09:15:00Z',
    picked_up_at: '2024-01-16T09:45:00Z',
    otp_code: '789012'
  },
  {
    id: '3',
    delivery_id: 'TRD-1014',
    merchant_id: 'merchant-1',
    product_description: 'Cuisinart Blender 1.5L',
    product_value: 85000,
    currency: 'FCFA',
    customer_name: 'Yves Mbarga',
    customer_phone: '691223344',
    delivery_address: 'Mendong Marche',
    delivery_latitude: 3.8345,
    delivery_longitude: 11.4876,
    delivery_cost: 2000,
    status: 'assigned',
    created_at: '2024-01-16T11:30:00Z',
    updated_at: '2024-01-16T11:30:00Z',
    assigned_rider_id: 'rider-3',
    assigned_at: '2024-01-16T11:35:00Z',
    otp_code: '345678'
  },
  {
    id: '4',
    delivery_id: 'TRD-1017',
    merchant_id: 'merchant-1',
    product_description: 'MacBook Air M3 13" Midnight',
    product_value: 850000,
    currency: 'FCFA',
    customer_name: 'Aicha Bello',
    customer_phone: '699881122',
    delivery_address: 'Akwa Boulevard de la Liberte',
    delivery_latitude: 3.8723,
    delivery_longitude: 11.4987,
    delivery_cost: 1500,
    status: 'delivered',
    created_at: '2024-01-16T08:00:00Z',
    updated_at: '2024-01-16T14:30:00Z',
    assigned_rider_id: 'rider-1',
    assigned_at: '2024-01-16T08:20:00Z',
    picked_up_at: '2024-01-16T09:00:00Z',
    delivered_at: '2024-01-16T14:30:00Z',
    otp_code: '901234'
  },
  {
    id: '5',
    delivery_id: 'TRD-1016',
    merchant_id: 'merchant-1',
    product_description: 'Nike Air Force 1 White Size 42',
    product_value: 65000,
    currency: 'FCFA',
    customer_name: 'Paul Nguema',
    customer_phone: '655443322',
    delivery_address: 'Bonapriso Marche',
    delivery_latitude: 3.8654,
    delivery_longitude: 11.5123,
    delivery_cost: 1000,
    status: 'delivered',
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T17:30:00Z',
    assigned_rider_id: 'rider-2',
    assigned_at: '2024-01-15T14:10:00Z',
    picked_up_at: '2024-01-15T14:30:00Z',
    delivered_at: '2024-01-15T17:00:00Z',
    otp_code: '567890'
  },
  {
    id: '6',
    delivery_id: 'TRD-1015',
    merchant_id: 'merchant-1',
    product_description: 'Sony WH-1000XM5 Headphones Black',
    product_value: 280000,
    currency: 'FCFA',
    customer_name: 'Linda Kom',
    customer_phone: '678990011',
    delivery_address: 'Logbessou Universite',
    delivery_latitude: 3.8234,
    delivery_longitude: 11.5345,
    delivery_cost: 3000,
    status: 'failed',
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T17:30:00Z',
    assigned_rider_id: 'rider-1',
    assigned_at: '2024-01-15T14:10:00Z',
    picked_up_at: '2024-01-15T14:30:00Z',
    delivered_at: '2024-01-15T17:00:00Z',
    failure_reason: 'Customer was not available at the address. Called multiple times but no answer.',
    rider_notes: 'Customer was not available at the address. Called multiple times but no answer.',
    otp_code: '111222'
  }
];

export const mockStats: DeliveryStats = {
  total_deliveries: 6,
  active_deliveries: 3,
  awaiting_assignment: 1,
  in_transit: 1,
  delivered: 2,
  failed: 1,
  total_spending: 11000,
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
    address_text: 'Centre Ville Place de l\'Etoile',
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
    address_text: 'Mvolye Carrefour',
    latitude: 3.8567,
    longitude: 11.5234,
    area: 'Mvolye',
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
  { text: 'Centre Ville Place de l\'Etoile', lat: 3.8625, lon: 11.5167, area: 'Centre Ville' },
  { text: 'Mvan Carrefour', lat: 3.8456, lon: 11.5023, area: 'Mvan' },
  { text: 'Mvog-Mbi Carrefour', lat: 3.8567, lon: 11.4987, area: 'Mvog-Mbi' },
  { text: 'Nlongkak Carrefour', lat: 3.8712, lon: 11.4890, area: 'Nlongkak' },
  { text: 'Messa Carrefour', lat: 3.8645, lon: 11.4789, area: 'Messa' },
  { text: 'Odza Carrefour', lat: 3.8234, lon: 11.5123, area: 'Odza' },
  { text: 'Mvolye Carrefour', lat: 3.8567, lon: 11.5234, area: 'Mvolye' },
  { text: 'Etoudi Carrefour', lat: 3.8901, lon: 11.5345, area: 'Etoudi' },
  { text: 'Ngoa-Ekelle Carrefour', lat: 3.8456, lon: 11.4876, area: 'Ngoa-Ekelle' },
  { text: 'Briqueterie Carrefour', lat: 3.8678, lon: 11.4923, area: 'Briqueterie' },
  { text: 'Mfoundi Carrefour', lat: 3.8789, lon: 11.5067, area: 'Mfoundi' },
  { text: 'Tsinga Carrefour', lat: 3.8567, lon: 11.5234, area: 'Tsinga' },
];
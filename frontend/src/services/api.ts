import { Delivery, DeliveryStats, DeliveryListResponse, AddressSearchResult, CreateDeliveryRequest, DeliveryCostCalculation } from '../types';

const API_BASE_URL = 'http://localhost:8080';

// Default merchant ID for demo purposes
const DEFAULT_MERCHANT_ID = '00000000-0000-0000-0000-000000000001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'API request failed');
  }

  return result.data;
}

// Delivery APIs
export async function getDeliveries(
  status?: string,
  page: number = 1,
  perPage: number = 10
): Promise<DeliveryListResponse> {
  const params = new URLSearchParams({
    merchant_id: DEFAULT_MERCHANT_ID,
    page: page.toString(),
    per_page: perPage.toString(),
  });
  
  if (status && status !== 'all') {
    params.append('status', status);
  }

  return fetchApi<DeliveryListResponse>(`/api/deliveries?${params.toString()}`);
}

export async function getDeliveryById(id: string): Promise<Delivery> {
  return fetchApi<Delivery>(`/api/deliveries/${id}`);
}

export async function getDeliveryStats(): Promise<DeliveryStats> {
  const params = new URLSearchParams({
    merchant_id: DEFAULT_MERCHANT_ID,
  });
  return fetchApi<DeliveryStats>(`/api/deliveries/stats?${params.toString()}`);
}

export async function createDelivery(request: CreateDeliveryRequest): Promise<Delivery> {
  return fetchApi<Delivery>('/api/deliveries', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function calculateDeliveryCost(addressId: string): Promise<DeliveryCostCalculation> {
  return fetchApi<DeliveryCostCalculation>('/api/deliveries/calculate-cost', {
    method: 'POST',
    body: JSON.stringify({ address_id: addressId }),
  });
}

// Address APIs
export async function searchAddresses(query: string, limit: number = 10): Promise<AddressSearchResult[]> {
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
  });
  const response = await fetchApi<{ results: AddressSearchResult[] }>(`/api/addresses/search?${params.toString()}`);
  return response.results;
}

export async function getSavedAddresses(): Promise<AddressSearchResult[]> {
  const params = new URLSearchParams({
    merchant_id: DEFAULT_MERCHANT_ID,
  });
  return fetchApi<AddressSearchResult[]>(`/api/addresses/saved?${params.toString()}`);
}

// Merchant APIs
export async function getMerchantProfile(): Promise<{ business_name: string; email: string }> {
  return fetchApi<{ business_name: string; email: string }>('/api/merchant/profile');
}

export async function getWalletBalance(): Promise<{ balance: number; currency: string }> {
  return fetchApi<{ balance: number; currency: string }>('/api/merchant/wallet');
}

import { Delivery, DeliveryStats, DeliveryListResponse, AddressSearchResult, CreateDeliveryRequest, DeliveryCostCalculation, RegisterRequest, LoginRequest, AuthResponse, Merchant } from '../types';

const API_BASE_URL = 'http://localhost:3033';

const TOKEN_KEY = 'trida_token';
const MERCHANT_ID_KEY = 'trida_merchant_id';

// Token management
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getMerchantId(): string | null {
  return localStorage.getItem(MERCHANT_ID_KEY);
}

export function setMerchantId(id: string): void {
  localStorage.setItem(MERCHANT_ID_KEY, id);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(MERCHANT_ID_KEY);
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiError {
  success: boolean;
  error: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    // If 401, token is invalid/expired — remove it
    if (response.status === 401) {
      removeToken();
      throw new Error('Session expired. Please log in again.');
    }

    const error: ApiError = await response.json().catch(() => ({ success: false, error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'API request failed');
  }

  return result.data;
}

// Auth APIs
export async function register(request: RegisterRequest): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getCurrentUser(): Promise<Merchant> {
  return fetchApi<Merchant>('/api/auth/me');
}

// Delivery APIs
export async function getDeliveries(
  status?: string,
  page: number = 1,
  perPage: number = 10
): Promise<DeliveryListResponse> {
  const merchantId = getMerchantId();
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  
  if (merchantId) {
    params.append('merchant_id', merchantId);
  }
  if (status && status !== 'all') {
    params.append('status', status);
  }

  return fetchApi<DeliveryListResponse>(`/api/deliveries?${params.toString()}`);
}

export async function getDeliveryById(id: string): Promise<Delivery> {
  return fetchApi<Delivery>(`/api/deliveries/${id}`);
}

export async function getDeliveryStats(): Promise<DeliveryStats> {
  const merchantId = getMerchantId();
  const params = new URLSearchParams();
  if (merchantId) {
    params.append('merchant_id', merchantId);
  }
  return fetchApi<DeliveryStats>(`/api/deliveries/stats?${params.toString()}`);
}

export async function createDelivery(request: CreateDeliveryRequest): Promise<Delivery> {
  return fetchApi<Delivery>('/api/deliveries', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function calculateDeliveryCost(latitude: number, longitude: number): Promise<DeliveryCostCalculation> {
  return fetchApi<DeliveryCostCalculation>('/api/deliveries/calculate-cost', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
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
  const merchantId = getMerchantId();
  const params = new URLSearchParams();
  if (merchantId) {
    params.append('merchant_id', merchantId);
  }
  return fetchApi<AddressSearchResult[]>(`/api/addresses/saved?${params.toString()}`);
}

// Merchant APIs
export async function getMerchantProfile(): Promise<Merchant> {
  return fetchApi<Merchant>('/api/merchant/profile');
}

export async function updateMerchantProfile(data: Partial<Merchant>): Promise<Merchant> {
  return fetchApi<Merchant>('/api/merchant/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getWalletBalance(): Promise<{ balance: number; currency: string }> {
  return fetchApi<{ balance: number; currency: string }>('/api/merchant/wallet');
}

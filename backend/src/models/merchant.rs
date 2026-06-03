use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "merchant_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum MerchantStatus {
    PendingApproval,
    Active,
    Suspended,
    Rejected,
}

impl MerchantStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            MerchantStatus::PendingApproval => "pending_approval",
            MerchantStatus::Active => "active",
            MerchantStatus::Suspended => "suspended",
            MerchantStatus::Rejected => "rejected",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "business_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum BusinessType {
    Electronics,
    Fashion,
    Beauty,
    Pharmacy,
    Food,
    HomeAppliances,
    GeneralMerchandise,
    Other,
}

impl BusinessType {
    pub fn as_str(&self) -> &'static str {
        match self {
            BusinessType::Electronics => "electronics",
            BusinessType::Fashion => "fashion",
            BusinessType::Beauty => "beauty",
            BusinessType::Pharmacy => "pharmacy",
            BusinessType::Food => "food",
            BusinessType::HomeAppliances => "home_appliances",
            BusinessType::GeneralMerchandise => "general_merchandise",
            BusinessType::Other => "other",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Merchant {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub business_name: String,
    pub business_type: BusinessType,
    pub business_address: String,
    pub business_phone: String,
    pub business_email: Option<String>,
    pub owner_name: String,
    pub owner_phone: String,
    pub national_id: Option<String>,
    pub status: MerchantStatus,
    pub dispatch_latitude: f64,
    pub dispatch_longitude: f64,
    pub wallet_balance: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Merchant data returned in API responses (excludes password_hash)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerchantResponse {
    pub id: Uuid,
    pub email: String,
    pub business_name: String,
    pub business_type: BusinessType,
    pub business_address: String,
    pub business_phone: String,
    pub business_email: Option<String>,
    pub owner_name: String,
    pub owner_phone: String,
    pub national_id: Option<String>,
    pub status: MerchantStatus,
    pub dispatch_latitude: f64,
    pub dispatch_longitude: f64,
    pub wallet_balance: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Merchant> for MerchantResponse {
    fn from(m: Merchant) -> Self {
        Self {
            id: m.id,
            email: m.email,
            business_name: m.business_name,
            business_type: m.business_type,
            business_address: m.business_address,
            business_phone: m.business_phone,
            business_email: m.business_email,
            owner_name: m.owner_name,
            owner_phone: m.owner_phone,
            national_id: m.national_id,
            status: m.status,
            dispatch_latitude: m.dispatch_latitude,
            dispatch_longitude: m.dispatch_longitude,
            wallet_balance: m.wallet_balance,
            created_at: m.created_at,
            updated_at: m.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct MerchantStats {
    pub total_deliveries: i64,
    pub active_deliveries: i64,
    pub total_spending: i64,
    pub wallet_balance: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    // Step 1: Business Information
    pub business_name: String,
    pub business_type: String,
    pub business_address: String,
    pub business_phone: String,
    pub business_email: Option<String>,
    // Step 2: Owner Information
    pub owner_name: String,
    pub owner_phone: String,
    pub national_id: Option<String>,
    // Step 3: Security
    pub email: String,
    pub password: String,
    // Step 4: Terms
    pub accept_terms: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub merchant: MerchantResponse,
}

impl Merchant {
    #[allow(dead_code)]
    pub fn new(
        email: String,
        business_name: String,
        business_type: BusinessType,
        business_address: String,
        business_phone: String,
        owner_name: String,
        owner_phone: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            email,
            password_hash: String::new(),
            business_name,
            business_type,
            business_address,
            business_phone,
            business_email: None,
            owner_name,
            owner_phone,
            national_id: None,
            status: MerchantStatus::PendingApproval,
            dispatch_latitude: 3.8480,
            dispatch_longitude: 11.5022,
            wallet_balance: 0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

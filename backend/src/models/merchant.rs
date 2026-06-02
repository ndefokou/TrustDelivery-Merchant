use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Merchant {
    pub id: Uuid,
    pub email: String,
    pub business_name: String,
    pub phone: String,
    pub address: String,
    pub dispatch_latitude: f64,
    pub dispatch_longitude: f64,
    pub wallet_balance: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerchantStats {
    pub total_deliveries: i64,
    pub active_deliveries: i64,
    pub total_spending: i64,
    pub wallet_balance: i64,
}

impl Merchant {
    pub fn new(
        email: String,
        business_name: String,
        phone: String,
        address: String,
        dispatch_latitude: f64,
        dispatch_longitude: f64,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            email,
            business_name,
            phone,
            address,
            dispatch_latitude,
            dispatch_longitude,
            wallet_balance: 0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}
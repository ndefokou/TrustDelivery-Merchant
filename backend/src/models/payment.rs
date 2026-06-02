use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "payment_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "payment_method", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PaymentMethod {
    OrangeMoney,
    MtnMomo,
    MerchantWallet,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: Uuid,
    pub delivery_id: Uuid,
    pub merchant_id: Uuid,
    pub amount: i64,
    pub currency: String,
    pub payment_method: PaymentMethod,
    pub status: PaymentStatus,
    pub transaction_reference: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRequest {
    pub delivery_id: Uuid,
    pub payment_method: PaymentMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentConfirmation {
    pub transaction_reference: String,
    pub status: PaymentStatus,
}

impl Payment {
    pub fn new(
        delivery_id: Uuid,
        merchant_id: Uuid,
        amount: i64,
        payment_method: PaymentMethod,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            delivery_id,
            merchant_id,
            amount,
            currency: "FCFA".to_string(),
            payment_method,
            status: PaymentStatus::Pending,
            transaction_reference: None,
            created_at: Utc::now(),
            completed_at: None,
        }
    }
}
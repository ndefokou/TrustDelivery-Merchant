use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DeliveryStatus {
    AwaitingAssignment,
    Assigned,
    InTransit,
    Delivered,
    Failed,
}

impl Default for DeliveryStatus {
    fn default() -> Self {
        Self::AwaitingAssignment
    }
}

impl std::fmt::Display for DeliveryStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DeliveryStatus::AwaitingAssignment => write!(f, "Awaiting Assignment"),
            DeliveryStatus::Assigned => write!(f, "Assigned"),
            DeliveryStatus::InTransit => write!(f, "In Transit"),
            DeliveryStatus::Delivered => write!(f, "Delivered"),
            DeliveryStatus::Failed => write!(f, "Failed"),
        }
    }
}

impl std::str::FromStr for DeliveryStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "awaiting_assignment" | "awaiting assignment" => Ok(Self::AwaitingAssignment),
            "assigned" => Ok(Self::Assigned),
            "in_transit" | "in transit" => Ok(Self::InTransit),
            "delivered" => Ok(Self::Delivered),
            "failed" => Ok(Self::Failed),
            _ => Err(format!("Unknown delivery status: {}", s)),
        }
    }
}

impl From<String> for DeliveryStatus {
    fn from(s: String) -> Self {
        s.as_str().parse().unwrap_or(Self::AwaitingAssignment)
    }
}

impl From<&str> for DeliveryStatus {
    fn from(s: &str) -> Self {
        s.parse().unwrap_or(Self::AwaitingAssignment)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CollectionStatus {
    Pending,
    Collected,
    NotCollected,
}

impl Default for CollectionStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::fmt::Display for CollectionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CollectionStatus::Pending => write!(f, "Pending"),
            CollectionStatus::Collected => write!(f, "Collected"),
            CollectionStatus::NotCollected => write!(f, "Not Collected"),
        }
    }
}

impl std::str::FromStr for CollectionStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(Self::Pending),
            "collected" => Ok(Self::Collected),
            "not_collected" | "not collected" => Ok(Self::NotCollected),
            _ => Err(format!("Unknown collection status: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentMethod {
    OrangeMoney,
    MtnMomo,
    MerchantWallet,
}

impl std::fmt::Display for PaymentMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaymentMethod::OrangeMoney => write!(f, "Orange Money"),
            PaymentMethod::MtnMomo => write!(f, "MTN MoMo"),
            PaymentMethod::MerchantWallet => write!(f, "Merchant Wallet"),
        }
    }
}

impl std::str::FromStr for PaymentMethod {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "orange_money" => Ok(Self::OrangeMoney),
            "mtn_momo" => Ok(Self::MtnMomo),
            "merchant_wallet" => Ok(Self::MerchantWallet),
            _ => Err(format!("Unknown payment method: {}", s)),
        }
    }
}

impl From<String> for PaymentMethod {
    fn from(s: String) -> Self {
        s.as_str().parse().unwrap_or(Self::OrangeMoney)
    }
}

impl From<&str> for PaymentMethod {
    fn from(s: &str) -> Self {
        s.parse().unwrap_or(Self::OrangeMoney)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[allow(dead_code)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
}

impl Default for PaymentStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::str::FromStr for PaymentStatus {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(Self::Pending),
            "completed" => Ok(Self::Completed),
            "failed" => Ok(Self::Failed),
            _ => Err(format!("Unknown payment status: {}", s)),
        }
    }
}

impl From<String> for PaymentStatus {
    fn from(s: String) -> Self {
        s.as_str().parse().unwrap_or(Self::Pending)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateDeliveryRequest {
    #[validate(length(min = 5, max = 255, message = "Product description must be between 5 and 255 characters"))]
    pub product_description: String,
    
    #[validate(range(min = 1, message = "Product value must be greater than 0"))]
    pub product_value: i64,
    
    #[validate(length(min = 3, max = 100, message = "Customer name must be between 3 and 100 characters"))]
    pub customer_name: String,
    
    #[validate(length(min = 9, max = 15, message = "Invalid phone number format"))]
    pub customer_phone: String,
    
    pub delivery_address: String,
    pub delivery_latitude: f64,
    pub delivery_longitude: f64,
    pub payment_method: PaymentMethod,
    pub collect_payment: bool,
    #[validate(range(min = 1, message = "Amount to collect must be greater than 0"))]
    pub amount_to_collect: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryCostCalculation {
    pub distance_km: f64,
    pub delivery_cost: i64,
    pub currency: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct DeliveryRow {
    pub id: Uuid,
    pub merchant_id: Uuid,
    pub rider_id: Option<Uuid>,
    pub customer_name: String,
    pub customer_phone: String,
    pub delivery_address: String,
    pub delivery_latitude: Option<f64>,
    pub delivery_longitude: Option<f64>,
    pub product_description: String,
    pub product_value: i64,
    pub delivery_cost: i64,
    pub otp_code: Option<String>,
    pub status: String,
    pub failure_reason: Option<String>,
    pub failure_notes: Option<String>,
    pub assigned_at: Option<DateTime<Utc>>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub expected_delivery_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub collect_payment: bool,
    #[sqlx(default)]
    pub amount_to_collect: Option<i64>,
    #[sqlx(default)]
    pub amount_collected: Option<i64>,
    #[sqlx(default)]
    pub collection_status: Option<String>,
    #[sqlx(default)]
    pub collected_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Delivery {
    pub id: Uuid,
    pub delivery_id: String,
    pub merchant_id: Uuid,
    pub product_description: String,
    pub product_value: i64,
    pub currency: String,
    pub customer_name: String,
    pub customer_phone: String,
    pub delivery_address: String,
    pub delivery_latitude: Option<f64>,
    pub delivery_longitude: Option<f64>,
    pub delivery_cost: i64,
    pub status: DeliveryStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub assigned_rider_id: Option<Uuid>,
    pub assigned_at: Option<DateTime<Utc>>,
    pub picked_up_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub failure_reason: Option<String>,
    pub rider_notes: Option<String>,
    pub otp_code: Option<String>,
    pub collect_payment: bool,
    pub amount_to_collect: Option<i64>,
    pub amount_collected: Option<i64>,
    pub collection_status: Option<String>,
    pub collected_at: Option<DateTime<Utc>>,
}

impl From<DeliveryRow> for Delivery {
    fn from(row: DeliveryRow) -> Self {
        Self {
            id: row.id,
            delivery_id: format!("TRD-{}", &row.id.to_string()[..8].to_uppercase()),
            merchant_id: row.merchant_id,
            product_description: row.product_description,
            product_value: row.product_value,
            currency: "FCFA".to_string(),
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            delivery_address: row.delivery_address,
            delivery_latitude: row.delivery_latitude,
            delivery_longitude: row.delivery_longitude,
            delivery_cost: row.delivery_cost,
            status: row.status.parse().unwrap_or(DeliveryStatus::AwaitingAssignment),
            created_at: row.created_at,
            updated_at: row.updated_at,
            assigned_rider_id: row.rider_id,
            assigned_at: row.assigned_at,
            picked_up_at: row.started_at,
            delivered_at: row.completed_at,
            failure_reason: row.failure_reason,
            rider_notes: row.failure_notes,
            otp_code: row.otp_code,
            collect_payment: row.collect_payment,
            amount_to_collect: row.amount_to_collect,
            amount_collected: row.amount_collected,
            collection_status: row.collection_status,
            collected_at: row.collected_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryListResponse {
    pub deliveries: Vec<Delivery>,
    pub total: i64,
    pub page: i32,
    pub per_page: i32,
    pub total_pages: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryStats {
    pub total_deliveries: i64,
    pub active_deliveries: i64,
    pub awaiting_assignment: i64,
    pub in_transit: i64,
    pub delivered: i64,
    pub failed: i64,
    pub total_spending: i64,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryTimelineEvent {
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub description: String,
    pub completed: bool,
}
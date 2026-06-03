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
        match s {
            "awaiting_assignment" => Ok(Self::AwaitingAssignment),
            "assigned" => Ok(Self::Assigned),
            "in_transit" => Ok(Self::InTransit),
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
#[serde(rename_all = "snake_case")]
#[allow(dead_code)]
pub enum FailureReason {
    CustomerUnavailable,
    WrongAddress,
    PhoneUnreachable,
    CustomerRefusedProduct,
    Other,
}

impl std::fmt::Display for FailureReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FailureReason::CustomerUnavailable => write!(f, "Customer Unavailable"),
            FailureReason::WrongAddress => write!(f, "Wrong Address"),
            FailureReason::PhoneUnreachable => write!(f, "Phone Unreachable"),
            FailureReason::CustomerRefusedProduct => write!(f, "Customer Refused Product"),
            FailureReason::Other => write!(f, "Other"),
        }
    }
}

impl std::str::FromStr for FailureReason {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "customer_unavailable" => Ok(Self::CustomerUnavailable),
            "wrong_address" => Ok(Self::WrongAddress),
            "phone_unreachable" => Ok(Self::PhoneUnreachable),
            "customer_refused_product" => Ok(Self::CustomerRefusedProduct),
            "other" => Ok(Self::Other),
            _ => Err(format!("Unknown failure reason: {}", s)),
        }
    }
}

impl From<String> for FailureReason {
    fn from(s: String) -> Self {
        s.as_str().parse().unwrap_or(Self::Other)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
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
    
    pub delivery_address_id: Uuid,
    pub payment_method: PaymentMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryCostCalculation {
    pub distance_km: f64,
    pub delivery_cost: i64,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Delivery {
    pub id: Uuid,
    pub delivery_id: String,
    pub merchant_id: Uuid,
    pub product_description: String,
    pub product_value: i64,
    pub currency: String,
    pub customer_name: String,
    pub customer_phone: String,
    pub delivery_address_id: Uuid,
    pub delivery_address_text: String,
    pub distance_km: f64,
    pub delivery_cost: i64,
    pub status: String,
    pub payment_method: String,
    pub payment_status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub assigned_rider_id: Option<Uuid>,
    pub assigned_at: Option<DateTime<Utc>>,
    pub picked_up_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub failure_reason: Option<String>,
    pub rider_notes: Option<String>,
    pub otp_code: Option<String>,
    pub otp_verified: bool,
    pub delivery_photo_url: Option<String>,
    pub delivery_gps_coordinates: Option<String>,
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
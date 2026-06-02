use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Address {
    pub id: Uuid,
    pub address_text: String,
    pub latitude: f64,
    pub longitude: f64,
    pub area: Option<String>,
    pub is_saved: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressSearchResult {
    pub id: Option<Uuid>,
    pub address_text: String,
    pub latitude: f64,
    pub longitude: f64,
    pub area: Option<String>,
    pub is_saved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressAutocompleteRequest {
    pub query: String,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressAutocompleteResponse {
    pub results: Vec<AddressSearchResult>,
}

impl Address {
    pub fn new(address_text: String, latitude: f64, longitude: f64, area: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            address_text,
            latitude,
            longitude,
            area,
            is_saved: false,
            created_at: Utc::now(),
        }
    }
}
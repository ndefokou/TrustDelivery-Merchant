use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;
use crate::models::{CreateDeliveryRequest, DeliveryStatus};
use crate::services::delivery_service;
use crate::utils::response::{ApiResponse, ApiError};

pub async fn get_deliveries(
    pool: web::Data<PgPool>,
    query: web::Query<DeliveryQueryParams>,
) -> HttpResponse {
    let merchant_id = match query.merchant_id {
        Some(id) => id,
        None => return HttpResponse::BadRequest().json(ApiError::new("merchant_id is required")),
    };

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(10);
    let status_filter = query.status.as_ref().and_then(|s| match s.as_str() {
        "awaiting_assignment" => Some(DeliveryStatus::AwaitingAssignment),
        "assigned" => Some(DeliveryStatus::Assigned),
        "in_transit" => Some(DeliveryStatus::InTransit),
        "delivered" => Some(DeliveryStatus::Delivered),
        "failed" => Some(DeliveryStatus::Failed),
        _ => None,
    });

    match delivery_service::get_deliveries(&pool, merchant_id, page, per_page, status_filter).await {
        Ok(response) => HttpResponse::Ok().json(ApiResponse::success(response)),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn create_delivery(
    pool: web::Data<PgPool>,
    merchant_id: web::ReqData<Uuid>,
    body: web::Json<CreateDeliveryRequest>,
) -> HttpResponse {
    let request = body.into_inner();

    // Validate input
    if let Err(e) = request.validate() {
        return HttpResponse::BadRequest().json(ApiError::new(&format!("Validation error: {}", e)));
    }

    // Validate Cameroon phone number
    if !is_valid_cameroon_phone(&request.customer_phone) {
        return HttpResponse::BadRequest().json(ApiError::new("Invalid Cameroon phone number format"));
    }

    match delivery_service::create_delivery(&pool, *merchant_id, request).await {
        Ok(delivery) => HttpResponse::Created().json(ApiResponse::success(delivery)),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn get_delivery_by_id(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let delivery_id = path.into_inner();

    match delivery_service::get_delivery_by_id(&pool, delivery_id).await {
        Ok(Some(delivery)) => HttpResponse::Ok().json(ApiResponse::success(delivery)),
        Ok(None) => HttpResponse::NotFound().json(ApiError::new("Delivery not found")),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn get_delivery_stats(
    pool: web::Data<PgPool>,
    query: web::Query<MerchantIdParam>,
) -> HttpResponse {
    let merchant_id = match query.merchant_id {
        Some(id) => id,
        None => return HttpResponse::BadRequest().json(ApiError::new("merchant_id is required")),
    };

    match delivery_service::get_delivery_stats(&pool, merchant_id).await {
        Ok(stats) => HttpResponse::Ok().json(ApiResponse::success(stats)),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn calculate_delivery_cost(
    pool: web::Data<PgPool>,
    merchant_id: web::ReqData<Uuid>,
    body: web::Json<CalculateCostRequest>,
) -> HttpResponse {
    let request = body.into_inner();

    match delivery_service::calculate_cost(&pool, *merchant_id, request.address_id).await {
        Ok(calculation) => HttpResponse::Ok().json(ApiResponse::success(calculation)),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn get_delivery_timeline(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let delivery_id = path.into_inner();

    match delivery_service::get_delivery_timeline(&pool, delivery_id).await {
        Ok(timeline) => HttpResponse::Ok().json(ApiResponse::success(timeline)),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

fn is_valid_cameroon_phone(phone: &str) -> bool {
    // Cameroon phone numbers: 9 digits starting with 6XX
    let phone = phone.replace("+237", "").replace(" ", "");
    phone.len() == 9 && phone.starts_with('6')
}

#[derive(Debug, serde::Deserialize)]
pub struct DeliveryQueryParams {
    pub merchant_id: Option<Uuid>,
    pub page: Option<i32>,
    pub per_page: Option<i32>,
    pub status: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct MerchantIdParam {
    pub merchant_id: Option<Uuid>,
}

#[derive(Debug, serde::Deserialize)]
pub struct CalculateCostRequest {
    pub address_id: Uuid,
}
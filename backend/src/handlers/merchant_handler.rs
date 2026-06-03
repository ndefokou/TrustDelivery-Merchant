use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::merchant::MerchantResponse;
use crate::services::merchant_service;
use crate::utils::response::{ApiResponse, ApiError};

pub async fn get_merchant_profile(
    pool: web::Data<PgPool>,
    merchant_id: web::ReqData<Uuid>,
) -> HttpResponse {
    let merchant_id = merchant_id.into_inner();

    match merchant_service::get_merchant_by_id(&pool, merchant_id).await {
        Ok(Some(merchant)) => {
            let response = MerchantResponse::from(merchant);
            HttpResponse::Ok().json(ApiResponse::success(response))
        }
        Ok(None) => HttpResponse::NotFound().json(ApiError::new("Merchant not found")),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn update_merchant_profile(
    pool: web::Data<PgPool>,
    merchant_id: web::ReqData<Uuid>,
    body: web::Json<UpdateProfileRequest>,
) -> HttpResponse {
    let merchant_id = merchant_id.into_inner();

    match merchant_service::update_merchant_profile(&pool, merchant_id, body.into_inner()).await {
        Ok(merchant) => {
            let response = MerchantResponse::from(merchant);
            HttpResponse::Ok().json(ApiResponse::success(response))
        }
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn get_wallet_balance(
    pool: web::Data<PgPool>,
    merchant_id: web::ReqData<Uuid>,
) -> HttpResponse {
    let merchant_id = merchant_id.into_inner();

    match merchant_service::get_wallet_balance(&pool, merchant_id).await {
        Ok(balance) => HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
            "balance": balance,
            "currency": "FCFA"
        }))),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateProfileRequest {
    pub business_name: Option<String>,
    pub business_address: Option<String>,
    pub business_phone: Option<String>,
    pub business_email: Option<String>,
    pub owner_name: Option<String>,
    pub owner_phone: Option<String>,
    pub national_id: Option<String>,
    pub dispatch_latitude: Option<f64>,
    pub dispatch_longitude: Option<f64>,
}
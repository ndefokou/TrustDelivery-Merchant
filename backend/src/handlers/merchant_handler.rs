use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::Merchant;
use crate::services::merchant_service;
use crate::utils::response::{ApiResponse, ApiError};

pub async fn get_merchant_profile(
    pool: web::Data<PgPool>,
    query: web::Query<MerchantIdQuery>,
) -> HttpResponse {
    let merchant_id = match query.merchant_id {
        Some(id) => id,
        None => return HttpResponse::BadRequest().json(ApiError::new("merchant_id is required")),
    };

    match merchant_service::get_merchant_by_id(&pool, merchant_id).await {
        Ok(Some(merchant)) => HttpResponse::Ok().json(ApiResponse::success(merchant)),
        Ok(None) => HttpResponse::NotFound().json(ApiError::new("Merchant not found")),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn get_wallet_balance(
    pool: web::Data<PgPool>,
    query: web::Query<MerchantIdQuery>,
) -> HttpResponse {
    let merchant_id = match query.merchant_id {
        Some(id) => id,
        None => return HttpResponse::BadRequest().json(ApiError::new("merchant_id is required")),
    };

    match merchant_service::get_wallet_balance(&pool, merchant_id).await {
        Ok(balance) => HttpResponse::Ok().json(ApiResponse::success(serde_json::json!({
            "balance": balance,
            "currency": "FCFA"
        }))),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct MerchantIdQuery {
    pub merchant_id: Option<Uuid>,
}
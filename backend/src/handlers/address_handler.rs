use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use crate::models::{AddressSearchResult, AddressAutocompleteResponse};
use crate::services::address_service;
use crate::utils::response::{ApiResponse, ApiError};

pub async fn search_addresses(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
) -> HttpResponse {
    let query_text = query.query.clone().unwrap_or_default();
    let limit = query.limit.unwrap_or(10);

    if query_text.len() < 2 {
        return HttpResponse::Ok().json(ApiResponse::success(AddressAutocompleteResponse {
            results: vec![],
        }));
    }

    match address_service::search_addresses(&pool, &query_text, limit).await {
        Ok(results) => HttpResponse::Ok().json(ApiResponse::success(AddressAutocompleteResponse {
            results,
        })),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

pub async fn get_saved_addresses(
    pool: web::Data<PgPool>,
    query: web::Query<MerchantIdQuery>,
) -> HttpResponse {
    let merchant_id = match query.merchant_id {
        Some(id) => id,
        None => return HttpResponse::BadRequest().json(ApiError::new("merchant_id is required")),
    };

    match address_service::get_saved_addresses(&pool, merchant_id).await {
        Ok(addresses) => HttpResponse::Ok().json(ApiResponse::success(addresses)),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct SearchQuery {
    pub query: Option<String>,
    pub limit: Option<i32>,
}

#[derive(Debug, serde::Deserialize)]
pub struct MerchantIdQuery {
    pub merchant_id: Option<uuid::Uuid>,
}
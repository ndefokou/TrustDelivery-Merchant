use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;

use crate::config::AppConfig;
use crate::models::merchant::{LoginRequest, RegisterRequest};
use crate::middleware::auth::extract_merchant_id_from_request;
use crate::services::auth_service;
use crate::utils::response::{ApiError, ApiResponse};

/// POST /api/auth/register
pub async fn register(
    pool: web::Data<PgPool>,
    config: web::Data<AppConfig>,
    body: web::Json<RegisterRequest>,
) -> HttpResponse {
    match auth_service::register_merchant(&pool, body.into_inner(), &config.jwt_secret).await {
        Ok(auth_response) => HttpResponse::Created().json(ApiResponse::success(auth_response)),
        Err(e) => {
            if e.contains("already exists") {
                HttpResponse::Conflict().json(ApiError::new(&e))
            } else {
                HttpResponse::BadRequest().json(ApiError::new(&e))
            }
        }
    }
}

/// POST /api/auth/login
pub async fn login(
    pool: web::Data<PgPool>,
    config: web::Data<AppConfig>,
    body: web::Json<LoginRequest>,
) -> HttpResponse {
    match auth_service::login_merchant(&pool, body.into_inner(), &config.jwt_secret).await {
        Ok(auth_response) => HttpResponse::Ok().json(ApiResponse::success(auth_response)),
        Err(e) => {
            if e.contains("Invalid email or password") {
                HttpResponse::Unauthorized().json(ApiError::new(&e))
            } else {
                HttpResponse::BadRequest().json(ApiError::new(&e))
            }
        }
    }
}

/// GET /api/auth/me — returns current authenticated merchant profile
/// This endpoint is in the public scope but manually validates the JWT
pub async fn get_current_user(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    config: web::Data<AppConfig>,
) -> HttpResponse {
    // Manually extract and validate the JWT token
    let merchant_id = match extract_merchant_id_from_request(&req, &config.jwt_secret) {
        Ok(id) => id,
        Err(e) => {
            return HttpResponse::Unauthorized().json(ApiError::new(&e));
        }
    };

    match auth_service::get_merchant_by_id(&pool, merchant_id).await {
        Ok(Some(merchant)) => {
            let response = crate::models::merchant::MerchantResponse::from(merchant);
            HttpResponse::Ok().json(ApiResponse::success(response))
        }
        Ok(None) => HttpResponse::NotFound().json(ApiError::new("Merchant not found")),
        Err(e) => HttpResponse::InternalServerError().json(ApiError::new(&e.to_string())),
    }
}

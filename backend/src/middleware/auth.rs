use actix_web::{
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage, middleware::Next,
};
use uuid::Uuid;

use crate::config::AppConfig;
use crate::services::auth_service::verify_token;

/// Extract and validate JWT token from the Authorization header.
/// Returns the merchant UUID if valid, or an error message if not.
pub fn extract_merchant_id_from_request(
    req: &actix_web::HttpRequest,
    jwt_secret: &str,
) -> Result<Uuid, String> {
    // Get the Authorization header
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or("Missing Authorization header")?;

    // Check for "Bearer <token>" format
    let parts: Vec<&str> = auth_header.splitn(2, ' ').collect();
    if parts.len() != 2 || parts[0] != "Bearer" {
        return Err("Invalid Authorization header format. Expected: Bearer <token>".to_string());
    }

    let token = parts[1];

    // Verify the token
    let claims = verify_token(token, jwt_secret)
        .map_err(|e| format!("Invalid or expired token: {}", e))?;

    // Parse the merchant ID from the token subject
    let merchant_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| format!("Invalid merchant ID in token: {}", e))?;

    Ok(merchant_id)
}

/// Actix-web `from_fn` compatible middleware for JWT authentication.
/// Extracts the Bearer token, validates it, and injects the merchant_id
/// into the request extensions so handlers can access it via `web::ReqData<Uuid>`.
pub async fn auth_middleware(
    req: ServiceRequest,
    next: Next<impl actix_web::body::MessageBody>,
) -> Result<ServiceResponse<impl actix_web::body::MessageBody>, Error> {
    // Get JWT secret from app_data
    let config = req
        .app_data::<actix_web::web::Data<AppConfig>>()
        .expect("AppConfig not found in app_data");

    match extract_merchant_id_from_request(req.request(), &config.jwt_secret) {
        Ok(merchant_id) => {
            // Inject the merchant_id into request extensions
            req.extensions_mut().insert(merchant_id);
            let res = next.call(req).await?;
            Ok(res)
        }
        Err(e) => {
            log::warn!("Auth middleware rejected request: {}", e);
            Err(actix_web::error::ErrorUnauthorized(
                serde_json::json!({"success": false, "error": e}),
            ))
        }
    }
}

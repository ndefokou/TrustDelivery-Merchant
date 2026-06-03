use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::merchant::{AuthResponse, BusinessType, LoginRequest, Merchant, MerchantResponse, MerchantStatus, RegisterRequest};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String,       // merchant id
    pub email: String,
    pub exp: i64,          // expiration as unix timestamp
    pub iat: i64,          // issued at
}

/// Hash a password using bcrypt
pub async fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    hash(password, DEFAULT_COST)
}

/// Verify a password against a bcrypt hash
pub fn verify_password(password: &str, hash: &str) -> Result<bool, bcrypt::BcryptError> {
    verify(password, hash)
}

/// Create a JWT token for a merchant
pub fn create_token(merchant: &Merchant, jwt_secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = Utc::now();
    let claims = TokenClaims {
        sub: merchant.id.to_string(),
        email: merchant.email.clone(),
        iat: now.timestamp(),
        exp: (now + Duration::days(7)).timestamp(), // 7 day expiry
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
}

/// Verify a JWT token and return the claims
pub fn verify_token(token: &str, jwt_secret: &str) -> Result<TokenClaims, jsonwebtoken::errors::Error> {
    let token_data = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}

/// Validate password strength: min 8 chars, at least one uppercase, at least one number
fn validate_password(password: &str) -> Result<(), String> {
    if password.len() < 8 {
        return Err("Password must be at least 8 characters".to_string());
    }
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err("Password must contain at least one uppercase letter".to_string());
    }
    if !password.chars().any(|c| c.is_numeric()) {
        return Err("Password must contain at least one number".to_string());
    }
    Ok(())
}

/// Parse business_type string into enum, defaulting to GeneralMerchandise
fn parse_business_type(s: &str) -> BusinessType {
    match s {
        "electronics" => BusinessType::Electronics,
        "fashion" => BusinessType::Fashion,
        "beauty" => BusinessType::Beauty,
        "pharmacy" => BusinessType::Pharmacy,
        "food" => BusinessType::Food,
        "home_appliances" => BusinessType::HomeAppliances,
        "general_merchandise" => BusinessType::GeneralMerchandise,
        "other" => BusinessType::Other,
        _ => BusinessType::GeneralMerchandise,
    }
}

/// Register a new merchant
pub async fn register_merchant(
    pool: &PgPool,
    request: RegisterRequest,
    jwt_secret: &str,
) -> Result<AuthResponse, String> {
    // Validate required fields
    if request.email.is_empty() || request.password.is_empty() || request.business_name.is_empty() {
        return Err("Email, password, and business name are required".to_string());
    }

    if request.business_address.is_empty() || request.business_phone.is_empty() {
        return Err("Business address and business phone are required".to_string());
    }

    if request.owner_name.is_empty() || request.owner_phone.is_empty() {
        return Err("Owner name and owner phone are required".to_string());
    }

    if !request.accept_terms {
        return Err("You must accept the terms and conditions".to_string());
    }

    // Validate password strength
    validate_password(&request.password)?;

    // Check if email already exists
    let existing = sqlx::query_as::<_, Merchant>(
        "SELECT id, email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude, CAST(wallet_balance AS BIGINT), created_at, updated_at FROM merchants WHERE email = $1"
    )
    .bind(&request.email)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    if existing.is_some() {
        return Err("A merchant with this email already exists".to_string());
    }

    // Hash the password
    let password_hash = hash_password(&request.password)
        .await
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    let business_type = parse_business_type(&request.business_type);

    // Insert the new merchant (auto-approved since admin panel is not yet implemented)
    let merchant = sqlx::query_as::<_, Merchant>(
        r#"
        INSERT INTO merchants (email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude, wallet_balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 3.8480, 11.5022, 0)
        RETURNING id, email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude, CAST(wallet_balance AS BIGINT), created_at, updated_at
        "#
    )
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.business_name)
    .bind(&business_type)
    .bind(&request.business_address)
    .bind(&request.business_phone)
    .bind(&request.business_email)
    .bind(&request.owner_name)
    .bind(&request.owner_phone)
    .bind(&request.national_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to create merchant: {}", e))?;

    // Create JWT token
    let token = create_token(&merchant, jwt_secret)
        .map_err(|e| format!("Failed to create token: {}", e))?;

    Ok(AuthResponse {
        token,
        merchant: MerchantResponse::from(merchant),
    })
}

/// Login a merchant
pub async fn login_merchant(
    pool: &PgPool,
    request: LoginRequest,
    jwt_secret: &str,
) -> Result<AuthResponse, String> {
    // Validate input
    if request.email.is_empty() || request.password.is_empty() {
        return Err("Email and password are required".to_string());
    }

    // Find merchant by email
    let merchant = sqlx::query_as::<_, Merchant>(
        "SELECT id, email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude, CAST(wallet_balance AS BIGINT), created_at, updated_at FROM merchants WHERE email = $1"
    )
    .bind(&request.email)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let merchant = merchant.ok_or("Invalid email or password")?;

    // Verify password
    let valid = verify_password(&request.password, &merchant.password_hash)
        .map_err(|e| format!("Password verification error: {}", e))?;

    if !valid {
        return Err("Invalid email or password".to_string());
    }

    // Check merchant status
    match merchant.status {
        MerchantStatus::PendingApproval => {
            return Err("Your account is pending approval. You will be notified once an administrator reviews your application.".to_string());
        }
        MerchantStatus::Suspended => {
            return Err("Your account has been suspended. Please contact support for assistance.".to_string());
        }
        MerchantStatus::Rejected => {
            return Err("Your account application has been rejected. Please contact support for more information.".to_string());
        }
        MerchantStatus::Active => {
            // OK — proceed with login
        }
    }

    // Create JWT token
    let token = create_token(&merchant, jwt_secret)
        .map_err(|e| format!("Failed to create token: {}", e))?;

    Ok(AuthResponse {
        token,
        merchant: MerchantResponse::from(merchant),
    })
}

/// Get merchant by ID (used by auth middleware)
pub async fn get_merchant_by_id(
    pool: &PgPool,
    merchant_id: Uuid,
) -> Result<Option<Merchant>, sqlx::Error> {
    sqlx::query_as::<_, Merchant>(
        r#"
        SELECT id, email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude,
               CAST(wallet_balance AS BIGINT), created_at, updated_at
        FROM merchants
        WHERE id = $1
        "#
    )
    .bind(merchant_id)
    .fetch_optional(pool)
    .await
}

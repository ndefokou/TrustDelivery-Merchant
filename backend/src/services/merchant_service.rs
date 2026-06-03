use sqlx::PgPool;
use uuid::Uuid;
use crate::models::Merchant;
use crate::handlers::merchant_handler::UpdateProfileRequest;

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

pub async fn update_merchant_profile(
    pool: &PgPool,
    merchant_id: Uuid,
    request: UpdateProfileRequest,
) -> Result<Merchant, sqlx::Error> {
    let merchant = sqlx::query_as::<_, Merchant>(
        r#"
        UPDATE merchants
        SET
            business_name = COALESCE($2, business_name),
            business_address = COALESCE($3, business_address),
            business_phone = COALESCE($4, business_phone),
            business_email = COALESCE($5, business_email),
            owner_name = COALESCE($6, owner_name),
            owner_phone = COALESCE($7, owner_phone),
            national_id = COALESCE($8, national_id),
            dispatch_latitude = COALESCE($9, dispatch_latitude),
            dispatch_longitude = COALESCE($10, dispatch_longitude),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude,
                  CAST(wallet_balance AS BIGINT), created_at, updated_at
        "#
    )
    .bind(merchant_id)
    .bind(request.business_name)
    .bind(request.business_address)
    .bind(request.business_phone)
    .bind(request.business_email)
    .bind(request.owner_name)
    .bind(request.owner_phone)
    .bind(request.national_id)
    .bind(request.dispatch_latitude)
    .bind(request.dispatch_longitude)
    .fetch_one(pool)
    .await?;

    Ok(merchant)
}

pub async fn get_wallet_balance(
    pool: &PgPool,
    merchant_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let balance: i64 = sqlx::query_scalar(
        "SELECT CAST(wallet_balance AS BIGINT) FROM merchants WHERE id = $1"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    Ok(balance)
}

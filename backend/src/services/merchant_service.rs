use sqlx::PgPool;
use uuid::Uuid;
use crate::models::Merchant;

pub async fn get_merchant_by_id(
    pool: &PgPool,
    merchant_id: Uuid,
) -> Result<Option<Merchant>, sqlx::Error> {
    sqlx::query_as::<_, Merchant>(
        r#"
        SELECT id, email, business_name, phone, address, dispatch_latitude, dispatch_longitude,
               wallet_balance, created_at, updated_at
        FROM merchants
        WHERE id = $1
        "#
    )
    .bind(merchant_id)
    .fetch_optional(pool)
    .await
}

pub async fn get_wallet_balance(
    pool: &PgPool,
    merchant_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let balance: i64 = sqlx::query_scalar(
        "SELECT wallet_balance FROM merchants WHERE id = $1"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    Ok(balance)
}
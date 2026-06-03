pub mod migrations;

use sqlx::postgres::PgPool;

#[allow(dead_code)]
pub async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    migrations::run_migrations(pool).await
}
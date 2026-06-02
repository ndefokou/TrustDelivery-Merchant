pub mod migrations;

use sqlx::postgres::PgPool;

pub async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    migrations::run_migrations(pool).await
}
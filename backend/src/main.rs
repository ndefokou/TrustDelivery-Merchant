use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use sqlx::postgres::PgPoolOptions;

mod config;
mod db;
mod handlers;
mod middleware;
mod models;
mod services;
mod utils;

use crate::config::AppConfig;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let config = AppConfig::from_env();
    
    log::info!("Starting TrustDelivery Merchant API server");
    log::info!("Server running at http://{}", config.server_addr());

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to create database pool");

    // Run migrations
    db::migrations::run_migrations(&pool).await.expect("Failed to run migrations");

    let config_data = web::Data::new(config.clone());

    HttpServer::new(move || {
        let cors = Cors::permissive();
        
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(config_data.clone())
            .wrap(cors)
            .configure(handlers::routes::configure)
    })
    .bind(config.server_addr())?
    .run()
    .await
}
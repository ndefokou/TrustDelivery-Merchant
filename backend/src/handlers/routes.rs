use actix_web::web;
use actix_web::middleware::from_fn;
use crate::handlers::{delivery_handler, address_handler, merchant_handler, auth_handler};
use crate::middleware::auth::auth_middleware;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg
        // Auth routes (public — no middleware)
        // Registered as standalone routes to avoid conflict with protected /api scope
        .route("/api/auth/register", web::post().to(auth_handler::register))
        .route("/api/auth/login", web::post().to(auth_handler::login))
        .route("/api/auth/me", web::get().to(auth_handler::get_current_user))
        // Protected delivery routes (require JWT auth)
        .service(
            web::scope("/api/deliveries")
                .wrap(from_fn(auth_middleware))
                .route("", web::get().to(delivery_handler::get_deliveries))
                .route("", web::post().to(delivery_handler::create_delivery))
                .route("/stats", web::get().to(delivery_handler::get_delivery_stats))
                .route("/calculate-cost", web::post().to(delivery_handler::calculate_delivery_cost))
                .route("/{id}", web::get().to(delivery_handler::get_delivery_by_id))
                .route("/{id}/timeline", web::get().to(delivery_handler::get_delivery_timeline))
        )
        // Protected address routes
        .service(
            web::scope("/api/addresses")
                .wrap(from_fn(auth_middleware))
                .route("/search", web::get().to(address_handler::search_addresses))
                .route("/saved", web::get().to(address_handler::get_saved_addresses))
        )
        // Protected merchant routes
        .service(
            web::scope("/api/merchant")
                .wrap(from_fn(auth_middleware))
                .route("/profile", web::get().to(merchant_handler::get_merchant_profile))
                .route("/profile", web::put().to(merchant_handler::update_merchant_profile))
                .route("/wallet", web::get().to(merchant_handler::get_wallet_balance))
        )
        // Health check (public)
        .route("/health", web::get().to(|| async { "OK" }));
}

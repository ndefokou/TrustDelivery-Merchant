use actix_web::web;
use crate::handlers::{delivery_handler, address_handler, merchant_handler};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg
        // Delivery routes
        .service(
            web::scope("/api/deliveries")
                .route("", web::get().to(delivery_handler::get_deliveries))
                .route("", web::post().to(delivery_handler::create_delivery))
                .route("/stats", web::get().to(delivery_handler::get_delivery_stats))
                .route("/calculate-cost", web::post().to(delivery_handler::calculate_delivery_cost))
                .route("/{id}", web::get().to(delivery_handler::get_delivery_by_id))
                .route("/{id}/timeline", web::get().to(delivery_handler::get_delivery_timeline))
        )
        // Address routes
        .service(
            web::scope("/api/addresses")
                .route("/search", web::get().to(address_handler::search_addresses))
                .route("/saved", web::get().to(address_handler::get_saved_addresses))
        )
        // Merchant routes
        .service(
            web::scope("/api/merchant")
                .route("/profile", web::get().to(merchant_handler::get_merchant_profile))
                .route("/wallet", web::get().to(merchant_handler::get_wallet_balance))
        )
        // Health check
        .route("/health", web::get().to(|| async { "OK" }));
}
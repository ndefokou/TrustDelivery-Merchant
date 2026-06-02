use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{
    Delivery, DeliveryListResponse, DeliveryStats, DeliveryTimelineEvent,
    DeliveryStatus, CreateDeliveryRequest, DeliveryCostCalculation,
};
use crate::models::delivery::PaymentMethod;
use super::pricing_service;

pub async fn get_deliveries(
    pool: &PgPool,
    merchant_id: Uuid,
    page: i32,
    per_page: i32,
    status_filter: Option<DeliveryStatus>,
) -> Result<DeliveryListResponse, sqlx::Error> {
    let offset = (page - 1) * per_page;
    
    let status_str = status_filter.as_ref().map(|s| match s {
        DeliveryStatus::AwaitingAssignment => "awaiting_assignment",
        DeliveryStatus::Assigned => "assigned",
        DeliveryStatus::InTransit => "in_transit",
        DeliveryStatus::Delivered => "delivered",
        DeliveryStatus::Failed => "failed",
    });

    let deliveries = if let Some(status) = status_str {
        sqlx::query_as::<_, Delivery>(
            r#"
            SELECT id, delivery_id, merchant_id, product_description, product_value, currency,
                   customer_name, customer_phone, delivery_address_id, delivery_address_text,
                   distance_km, delivery_cost, status, payment_method, payment_status, created_at, 
                   updated_at, assigned_rider_id, assigned_at, picked_up_at, delivered_at, 
                   failure_reason, rider_notes, otp_code, otp_verified, delivery_photo_url, 
                   delivery_gps_coordinates
            FROM deliveries
            WHERE merchant_id = $1 AND status = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            "#
        )
        .bind(merchant_id)
        .bind(status)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Delivery>(
            r#"
            SELECT id, delivery_id, merchant_id, product_description, product_value, currency,
                   customer_name, customer_phone, delivery_address_id, delivery_address_text,
                   distance_km, delivery_cost, status, payment_method, payment_status, created_at, 
                   updated_at, assigned_rider_id, assigned_at, picked_up_at, delivered_at, 
                   failure_reason, rider_notes, otp_code, otp_verified, delivery_photo_url, 
                   delivery_gps_coordinates
            FROM deliveries
            WHERE merchant_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(merchant_id)
        .bind(per_page as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await?
    };

    let total: i64 = if let Some(status) = status_str {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = $2"
        )
        .bind(merchant_id)
        .bind(status)
        .fetch_one(pool)
        .await?
    } else {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1"
        )
        .bind(merchant_id)
        .fetch_one(pool)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i32;

    Ok(DeliveryListResponse {
        deliveries,
        total,
        page,
        per_page,
        total_pages,
    })
}

pub async fn get_delivery_by_id(
    pool: &PgPool,
    delivery_id: Uuid,
) -> Result<Option<Delivery>, sqlx::Error> {
    sqlx::query_as::<_, Delivery>(
        r#"
        SELECT id, delivery_id, merchant_id, product_description, product_value, currency,
               customer_name, customer_phone, delivery_address_id, delivery_address_text,
               distance_km, delivery_cost, status, payment_method, payment_status, created_at, 
               updated_at, assigned_rider_id, assigned_at, picked_up_at, delivered_at, 
               failure_reason, rider_notes, otp_code, otp_verified, delivery_photo_url, 
               delivery_gps_coordinates
        FROM deliveries
        WHERE id = $1
        "#
    )
    .bind(delivery_id)
    .fetch_optional(pool)
    .await
}

pub async fn create_delivery(
    pool: &PgPool,
    merchant_id: Uuid,
    request: CreateDeliveryRequest,
) -> Result<Delivery, sqlx::Error> {
    // Get address details
    let address = sqlx::query!(
        "SELECT id, address_text, latitude, longitude, area, is_saved, created_at FROM addresses WHERE id = $1",
        request.delivery_address_id
    )
    .fetch_one(pool)
    .await?;

    // Get merchant's dispatch location
    let merchant = sqlx::query!(
        "SELECT dispatch_latitude, dispatch_longitude FROM merchants WHERE id = $1",
        merchant_id
    )
    .fetch_one(pool)
    .await?;

    // Calculate distance
    let distance_km = pricing_service::calculate_distance(
        merchant.dispatch_latitude,
        merchant.dispatch_longitude,
        address.latitude,
        address.longitude,
    );

    // Calculate cost
    let delivery_cost = pricing_service::calculate_delivery_cost(distance_km);

    // Generate delivery ID
    let delivery_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM deliveries")
        .fetch_one(pool)
        .await?;
    let delivery_id = format!("TRD-{}", 1001 + delivery_count as i32);

    let payment_method_str = match request.payment_method {
        PaymentMethod::OrangeMoney => "orange_money",
        PaymentMethod::MtnMomo => "mtn_momo",
        PaymentMethod::MerchantWallet => "merchant_wallet",
    };

    // Insert delivery
    let delivery = sqlx::query_as::<_, Delivery>(
        r#"
        INSERT INTO deliveries (
            delivery_id, merchant_id, product_description, product_value, currency,
            customer_name, customer_phone, delivery_address_id, delivery_address_text,
            distance_km, delivery_cost, status, payment_method, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'awaiting_assignment', $12, 'pending')
        RETURNING id, delivery_id, merchant_id, product_description, product_value, currency,
                  customer_name, customer_phone, delivery_address_id, delivery_address_text,
                  distance_km, delivery_cost, status, payment_method, payment_status, created_at, 
                  updated_at, assigned_rider_id, assigned_at, picked_up_at, delivered_at, 
                  failure_reason, rider_notes, otp_code, otp_verified, delivery_photo_url, 
                  delivery_gps_coordinates
        "#
    )
    .bind(&delivery_id)
    .bind(merchant_id)
    .bind(&request.product_description)
    .bind(request.product_value)
    .bind("FCFA")
    .bind(&request.customer_name)
    .bind(&request.customer_phone)
    .bind(request.delivery_address_id)
    .bind(&address.address_text)
    .bind(distance_km)
    .bind(delivery_cost)
    .bind(payment_method_str)
    .fetch_one(pool)
    .await?;

    Ok(delivery)
}

pub async fn get_delivery_stats(
    pool: &PgPool,
    merchant_id: Uuid,
) -> Result<DeliveryStats, sqlx::Error> {
    let total_deliveries: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let awaiting_assignment: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'awaiting_assignment'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let in_transit: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'in_transit'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let delivered: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'delivered'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let failed: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'failed'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let total_spending: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(delivery_cost), 0) FROM deliveries WHERE merchant_id = $1 AND payment_status = 'completed'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let active_deliveries = awaiting_assignment + in_transit;

    Ok(DeliveryStats {
        total_deliveries,
        active_deliveries,
        awaiting_assignment,
        in_transit,
        delivered,
        failed,
        total_spending,
        currency: "FCFA".to_string(),
    })
}

pub async fn calculate_cost(
    pool: &PgPool,
    merchant_id: Uuid,
    address_id: Uuid,
) -> Result<DeliveryCostCalculation, sqlx::Error> {
    // Get address
    let address = sqlx::query!(
        "SELECT latitude, longitude FROM addresses WHERE id = $1",
        address_id
    )
    .fetch_one(pool)
    .await?;

    // Get merchant's dispatch location
    let merchant = sqlx::query!(
        "SELECT dispatch_latitude, dispatch_longitude FROM merchants WHERE id = $1",
        merchant_id
    )
    .fetch_one(pool)
    .await?;

    // Calculate distance
    let distance_km = pricing_service::calculate_distance(
        merchant.dispatch_latitude,
        merchant.dispatch_longitude,
        address.latitude,
        address.longitude,
    );

    // Calculate cost
    let delivery_cost = pricing_service::calculate_delivery_cost(distance_km);

    Ok(DeliveryCostCalculation {
        distance_km,
        delivery_cost,
        currency: "FCFA".to_string(),
    })
}

pub async fn get_delivery_timeline(
    pool: &PgPool,
    delivery_id: Uuid,
) -> Result<Vec<DeliveryTimelineEvent>, sqlx::Error> {
    let delivery = sqlx::query!(
        "SELECT status, created_at, assigned_at, picked_up_at, delivered_at FROM deliveries WHERE id = $1",
        delivery_id
    )
    .fetch_one(pool)
    .await?;

    let mut timeline = Vec::new();

    // Created event
    timeline.push(DeliveryTimelineEvent {
        status: "Created".to_string(),
        timestamp: delivery.created_at,
        description: "Delivery request created".to_string(),
        completed: true,
    });

    // Awaiting Assignment
    timeline.push(DeliveryTimelineEvent {
        status: "Awaiting Assignment".to_string(),
        timestamp: delivery.created_at,
        description: "Waiting for rider assignment".to_string(),
        completed: matches!(delivery.status.as_str(), "awaiting_assignment" | "assigned" | "in_transit" | "delivered"),
    });

    // Assigned
    if let Some(assigned_at) = delivery.assigned_at {
        timeline.push(DeliveryTimelineEvent {
            status: "Assigned".to_string(),
            timestamp: assigned_at,
            description: "Rider assigned to delivery".to_string(),
            completed: matches!(delivery.status.as_str(), "assigned" | "in_transit" | "delivered"),
        });
    }

    // In Transit
    if let Some(picked_up_at) = delivery.picked_up_at {
        timeline.push(DeliveryTimelineEvent {
            status: "In Transit".to_string(),
            timestamp: picked_up_at,
            description: "Package picked up, in transit".to_string(),
            completed: matches!(delivery.status.as_str(), "in_transit" | "delivered"),
        });
    }

    // Delivered
    if let Some(delivered_at) = delivery.delivered_at {
        timeline.push(DeliveryTimelineEvent {
            status: "Delivered".to_string(),
            timestamp: delivered_at,
            description: "Package delivered successfully".to_string(),
            completed: matches!(delivery.status.as_str(), "delivered"),
        });
    }

    Ok(timeline)
}
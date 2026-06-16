use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{
    Delivery, DeliveryListResponse, DeliveryStats, DeliveryTimelineEvent,
    DeliveryStatus, CreateDeliveryRequest, DeliveryCostCalculation,
    DeliveryRow,
};
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
        DeliveryStatus::AwaitingAssignment => "AWAITING_ASSIGNMENT",
        DeliveryStatus::Assigned => "ASSIGNED",
        DeliveryStatus::InTransit => "IN_TRANSIT",
        DeliveryStatus::Delivered => "DELIVERED",
        DeliveryStatus::Failed => "FAILED",
    });

    let rows: Vec<DeliveryRow> = if let Some(status) = status_str {
        sqlx::query_as::<_, DeliveryRow>(
            r#"
            SELECT id, merchant_id, rider_id, customer_name, customer_phone,
                   delivery_address, delivery_latitude, delivery_longitude,
                   product_description, product_value, delivery_fee, otp_code,
                   status, failure_reason, failure_notes, assigned_at, started_at,
                   completed_at, expected_delivery_time, created_at, updated_at
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
        sqlx::query_as::<_, DeliveryRow>(
            r#"
            SELECT id, merchant_id, rider_id, customer_name, customer_phone,
                   delivery_address, delivery_latitude, delivery_longitude,
                   product_description, product_value, delivery_fee, otp_code,
                   status, failure_reason, failure_notes, assigned_at, started_at,
                   completed_at, expected_delivery_time, created_at, updated_at
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

    let total_pages = ((total as f64) / (per_page as f64)).ceil() as i32;

    let deliveries: Vec<Delivery> = rows.into_iter().map(|r| r.into()).collect();

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
    let row: Option<DeliveryRow> = sqlx::query_as::<_, DeliveryRow>(
        r#"
        SELECT id, merchant_id, rider_id, customer_name, customer_phone,
               delivery_address, delivery_latitude, delivery_longitude,
               product_description, product_value, delivery_fee, otp_code,
               status, failure_reason, failure_notes, assigned_at, started_at,
               completed_at, expected_delivery_time, created_at, updated_at
        FROM deliveries
        WHERE id = $1
        "#
    )
    .bind(delivery_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|r| r.into()))
}

pub async fn create_delivery(
    pool: &PgPool,
    merchant_id: Uuid,
    request: CreateDeliveryRequest,
) -> Result<Delivery, sqlx::Error> {
    let merchant = sqlx::query_as::<_, (f64, f64)>(
        "SELECT dispatch_latitude, dispatch_longitude FROM merchants WHERE id = $1"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let (dispatch_lat, dispatch_lon) = merchant;

    let distance_km = pricing_service::calculate_distance(
        dispatch_lat,
        dispatch_lon,
        request.delivery_latitude,
        request.delivery_longitude,
    );

    let delivery_cost = pricing_service::calculate_delivery_cost(distance_km);

    let row: DeliveryRow = sqlx::query_as::<_, DeliveryRow>(
        r#"
        INSERT INTO deliveries (
            merchant_id, customer_name, customer_phone,
            delivery_address, delivery_latitude, delivery_longitude,
            product_description, product_value, delivery_fee,
            status, assigned_at, started_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'AWAITING_ASSIGNMENT', NULL, NULL)
        RETURNING id, merchant_id, rider_id, customer_name, customer_phone,
                  delivery_address, delivery_latitude, delivery_longitude,
                  product_description, product_value, delivery_fee, otp_code,
                  status, failure_reason, failure_notes, assigned_at, started_at,
                  completed_at, expected_delivery_time, created_at, updated_at
        "#
    )
    .bind(merchant_id)
    .bind(&request.customer_name)
    .bind(&request.customer_phone)
    .bind(&request.delivery_address)
    .bind(request.delivery_latitude)
    .bind(request.delivery_longitude)
    .bind(&request.product_description)
    .bind(request.product_value)
    .bind(delivery_cost)
    .fetch_one(pool)
    .await?;

    Ok(row.into())
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
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'AWAITING_ASSIGNMENT'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let in_transit: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'IN_TRANSIT'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let delivered: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'DELIVERED'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let failed: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND status = 'FAILED'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let total_spending: i64 = sqlx::query_scalar(
        "SELECT COALESCE(CAST(SUM(delivery_fee) AS BIGINT), 0) FROM deliveries WHERE merchant_id = $1"
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
    latitude: f64,
    longitude: f64,
) -> Result<DeliveryCostCalculation, sqlx::Error> {
    let merchant = sqlx::query_as::<_, (f64, f64)>(
        "SELECT dispatch_latitude, dispatch_longitude FROM merchants WHERE id = $1"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let (dispatch_lat, dispatch_lon) = merchant;

    let distance_km = pricing_service::calculate_distance(
        dispatch_lat,
        dispatch_lon,
        latitude,
        longitude,
    );

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
    let delivery = sqlx::query_as::<_, (String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT status, created_at, assigned_at, started_at, completed_at FROM deliveries WHERE id = $1"
    )
    .bind(delivery_id)
    .fetch_one(pool)
    .await?;

    let (status, created_at, assigned_at, started_at, completed_at) = delivery;

    let mut timeline = Vec::new();

    timeline.push(DeliveryTimelineEvent {
        status: "Created".to_string(),
        timestamp: created_at,
        description: "Delivery request created".to_string(),
        completed: true,
    });

    timeline.push(DeliveryTimelineEvent {
        status: "Awaiting Assignment".to_string(),
        timestamp: created_at,
        description: "Waiting for rider assignment".to_string(),
        completed: matches!(status.as_str(), "AWAITING_ASSIGNMENT" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED"),
    });

    if let Some(assigned_at) = assigned_at {
        timeline.push(DeliveryTimelineEvent {
            status: "Assigned".to_string(),
            timestamp: assigned_at,
            description: "Rider assigned to delivery".to_string(),
            completed: matches!(status.as_str(), "ASSIGNED" | "IN_TRANSIT" | "DELIVERED"),
        });
    }

    if let Some(started_at) = started_at {
        timeline.push(DeliveryTimelineEvent {
            status: "In Transit".to_string(),
            timestamp: started_at,
            description: "Package picked up, in transit".to_string(),
            completed: matches!(status.as_str(), "IN_TRANSIT" | "DELIVERED"),
        });
    }

    if let Some(completed_at) = completed_at {
        timeline.push(DeliveryTimelineEvent {
            status: "Delivered".to_string(),
            timestamp: completed_at,
            description: "Package delivered successfully".to_string(),
            completed: matches!(status.as_str(), "DELIVERED"),
        });
    }

    Ok(timeline)
}
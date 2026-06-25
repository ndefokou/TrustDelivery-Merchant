use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{
    Delivery, DeliveryListResponse, DeliveryStats, DeliveryTimelineEvent,
    DeliveryStatus, CreateDeliveryRequest, DeliveryCostCalculation,
    DeliveryRow,
};
use super::pricing_service;
use rand::Rng;

fn generate_otp() -> String {
    format!("{:04}", rand::thread_rng().gen_range(1000..9999))
}

/// Find the best available carrier for auto-assignment
/// Priority: performance_score DESC, completed_deliveries DESC, failed_deliveries ASC
pub async fn find_best_carrier(
    pool: &PgPool,
) -> Result<Option<(Uuid, String)>, sqlx::Error> {
    let result = sqlx::query_as::<_, (Option<Uuid>, Option<String>)>(
        r#"
        SELECT r.id, r.full_name
        FROM carriers r
        WHERE 
            COALESCE(LOWER(r.status::text), CASE WHEN r.is_active THEN 'active' ELSE 'suspended' END) = 'active'
            AND COALESCE(r.is_verified, true) = true
            AND r.id NOT IN (
                SELECT COALESCE(assigned_carrier_id, carrier_id) FROM deliveries 
                WHERE COALESCE(assigned_carrier_id, carrier_id) IS NOT NULL 
                AND LOWER(status::text) IN ('assigned', 'in_transit')
            )
        ORDER BY 
            r.performance_score DESC NULLS LAST,
            r.completed_deliveries DESC,
            r.failed_deliveries ASC
        LIMIT 1
        "#
    )
    .fetch_optional(pool)
    .await?;

    Ok(result.and_then(|(id, name)| {
        match (id, name) {
            (Some(id), Some(name)) => Some((id, name)),
            _ => None,
        }
    }))
}

/// Get count of active deliveries for a carrier
pub async fn get_carrier_active_deliveries(
    pool: &PgPool,
    carrier_id: Uuid,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE assigned_carrier_id = $1 AND LOWER(status::text) IN ('awaiting_assignment', 'assigned', 'in_transit')"
    )
    .bind(carrier_id)
    .fetch_one(pool)
    .await
}

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

    let rows: Vec<DeliveryRow> = if let Some(status) = status_str {
        sqlx::query_as::<_, DeliveryRow>(
            r#"
            SELECT id, merchant_id, assigned_carrier_id, customer_name, customer_phone,
                   delivery_address, delivery_latitude, delivery_longitude,
                   product_description, product_value, delivery_cost, otp_code,
                   status, failure_reason, failure_notes, assigned_at, started_at,
                   completed_at, expected_delivery_time, created_at, updated_at
            FROM deliveries
            WHERE merchant_id = $1 AND LOWER(status::text) = $2
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
            SELECT id, merchant_id, assigned_carrier_id, customer_name, customer_phone,
                   delivery_address, delivery_latitude, delivery_longitude,
                   product_description, product_value, delivery_cost, otp_code,
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
            "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND LOWER(status::text) = $2"
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
        SELECT id, merchant_id, assigned_carrier_id, customer_name, customer_phone,
               delivery_address, delivery_latitude, delivery_longitude,
               product_description, product_value, delivery_cost, otp_code,
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
    
    let otp_code = generate_otp();

    // Try to auto-assign the best available carrier
    let best_carrier = find_best_carrier(pool).await.ok().flatten();
    
    let (carrier_id, status, assigned_at): (Option<Uuid>, &str, Option<chrono::DateTime<chrono::Utc>>) = 
        match best_carrier {
            Some((carrier_id, _carrier_name)) => {
                // Successfully found a carrier - assign immediately
                (Some(carrier_id), "assigned", Some(chrono::Utc::now()))
            },
            None => {
                // No carrier available - keep in awaiting status
                (None, "awaiting_assignment", None)
            }
        };

    let row: DeliveryRow = sqlx::query_as::<_, DeliveryRow>(
        r#"
        INSERT INTO deliveries (
            merchant_id, assigned_carrier_id, customer_name, customer_phone,
            delivery_address, delivery_latitude, delivery_longitude,
            delivery_address_text, distance_km,
            product_description, product_value, delivery_cost,
            otp_code, status, assigned_at, started_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $5, $8, $9, $10, $11, $12, $13, $14, NULL)
        RETURNING id, merchant_id, assigned_carrier_id, customer_name, customer_phone,
                  delivery_address, delivery_latitude, delivery_longitude,
                  product_description, product_value, delivery_cost, otp_code,
                  status, failure_reason, failure_notes, assigned_at, started_at,
                  completed_at, expected_delivery_time, created_at, updated_at
        "#
    )
    .bind(merchant_id)
    .bind(carrier_id)
    .bind(&request.customer_name)
    .bind(&request.customer_phone)
    .bind(&request.delivery_address)
    .bind(request.delivery_latitude)
    .bind(request.delivery_longitude)
    .bind(distance_km)
    .bind(&request.product_description)
    .bind(request.product_value)
    .bind(delivery_cost)
    .bind(&otp_code)
    .bind(status)
    .bind(assigned_at)
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
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND LOWER(status::text) = 'awaiting_assignment'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let in_transit: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND LOWER(status::text) = 'in_transit'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let delivered: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND LOWER(status::text) = 'delivered'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let failed: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deliveries WHERE merchant_id = $1 AND LOWER(status::text) = 'failed'"
    )
    .bind(merchant_id)
    .fetch_one(pool)
    .await?;

    let total_spending: i64 = sqlx::query_scalar(
        "SELECT COALESCE(CAST(SUM(delivery_cost) AS BIGINT), 0) FROM deliveries WHERE merchant_id = $1"
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
        description: "Waiting for carrier assignment".to_string(),
        completed: matches!(status.to_lowercase().as_str(), "awaiting_assignment" | "assigned" | "in_transit" | "delivered"),
    });

    if let Some(assigned_at) = assigned_at {
        timeline.push(DeliveryTimelineEvent {
            status: "Assigned".to_string(),
            timestamp: assigned_at,
            description: "Carrier assigned to delivery".to_string(),
            completed: matches!(status.to_lowercase().as_str(), "assigned" | "in_transit" | "delivered"),
        });
    }

    if let Some(started_at) = started_at {
        timeline.push(DeliveryTimelineEvent {
            status: "In Transit".to_string(),
            timestamp: started_at,
            description: "Package picked up, in transit".to_string(),
            completed: matches!(status.to_lowercase().as_str(), "in_transit" | "delivered"),
        });
    }

    if let Some(completed_at) = completed_at {
        timeline.push(DeliveryTimelineEvent {
            status: "Delivered".to_string(),
            timestamp: completed_at,
            description: "Package delivered successfully".to_string(),
            completed: matches!(status.to_lowercase().as_str(), "delivered"),
        });
    }

    Ok(timeline)
}
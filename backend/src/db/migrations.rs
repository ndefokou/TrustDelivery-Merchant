use sqlx::postgres::PgPool;

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    log::info!("Running database migrations...");

    // Create enum types
    sqlx::query(
        r#"
        DO $$ BEGIN
            CREATE TYPE delivery_status AS ENUM ('awaiting_assignment', 'assigned', 'in_transit', 'delivered', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN
            CREATE TYPE payment_method AS ENUM ('orange_money', 'mtn_momo', 'merchant_wallet');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN
            CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN
            CREATE TYPE failure_reason AS ENUM ('customer_unavailable', 'wrong_address', 'phone_unreachable', 'customer_refused_product', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        "#,
    )
    .execute(pool)
    .await?;

    // Create merchants table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS merchants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            business_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address TEXT NOT NULL,
            dispatch_latitude DOUBLE PRECISION NOT NULL DEFAULT 3.8480,
            dispatch_longitude DOUBLE PRECISION NOT NULL DEFAULT 11.5022,
            wallet_balance BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create addresses table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS addresses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            address_text TEXT NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            area VARCHAR(100),
            is_saved BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create deliveries table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS deliveries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            delivery_id VARCHAR(20) UNIQUE NOT NULL,
            merchant_id UUID NOT NULL REFERENCES merchants(id),
            product_description TEXT NOT NULL,
            product_value BIGINT NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
            customer_name VARCHAR(100) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            delivery_address_id UUID NOT NULL REFERENCES addresses(id),
            delivery_address_text TEXT NOT NULL,
            distance_km DOUBLE PRECISION NOT NULL,
            delivery_cost BIGINT NOT NULL,
            status delivery_status NOT NULL DEFAULT 'awaiting_assignment',
            payment_method payment_method NOT NULL,
            payment_status payment_status NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            assigned_rider_id UUID,
            assigned_at TIMESTAMPTZ,
            picked_up_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            failure_reason failure_reason,
            rider_notes TEXT,
            otp_code VARCHAR(6),
            otp_verified BOOLEAN NOT NULL DEFAULT false,
            delivery_photo_url TEXT,
            delivery_gps_coordinates VARCHAR(100)
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create payments table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            delivery_id UUID NOT NULL REFERENCES deliveries(id),
            merchant_id UUID NOT NULL REFERENCES merchants(id),
            amount BIGINT NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
            payment_method payment_method NOT NULL,
            status payment_status NOT NULL DEFAULT 'pending',
            transaction_reference VARCHAR(100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes (split into separate queries for Supabase pooler compatibility)
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_deliveries_merchant_id ON deliveries(merchant_id);",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at);",
    )
    .execute(pool)
    .await?;

    log::info!("Migrations completed successfully");
    Ok(())
}
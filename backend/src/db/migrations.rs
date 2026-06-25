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

    // Create merchant_status enum type
    sqlx::query(
        r#"
        DO $$ BEGIN
            CREATE TYPE merchant_status AS ENUM ('pending_approval', 'active', 'suspended', 'rejected');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        "#,
    )
    .execute(pool)
    .await?;

    // Create business_type enum type
    sqlx::query(
        r#"
        DO $$ BEGIN
            CREATE TYPE business_type AS ENUM ('electronics', 'fashion', 'beauty', 'pharmacy', 'food', 'home_appliances', 'general_merchandise', 'other');
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
            password_hash VARCHAR(255) NOT NULL DEFAULT '',
            business_name VARCHAR(255) NOT NULL,
            business_type business_type NOT NULL DEFAULT 'general_merchandise',
            business_address TEXT NOT NULL,
            business_phone VARCHAR(20) NOT NULL,
            business_email VARCHAR(255),
            owner_name VARCHAR(255) NOT NULL,
            owner_phone VARCHAR(20) NOT NULL,
            national_id VARCHAR(50),
            status merchant_status NOT NULL DEFAULT 'pending_approval',
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

    // Add new columns to existing merchants table (if they don't exist)
    sqlx::query(
        r#"
        DO $$ BEGIN
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '';
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_type business_type NOT NULL DEFAULT 'general_merchandise';
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255) NOT NULL DEFAULT '';
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20) NOT NULL DEFAULT '';
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
            ALTER TABLE merchants ADD COLUMN IF NOT EXISTS status merchant_status NOT NULL DEFAULT 'pending_approval';
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;
        "#,
    )
    .execute(pool)
    .await?;

    // Rename old columns if they exist (phone -> business_phone, address -> business_address)
    // Only rename if the old column exists and new one doesn't
    sqlx::query(
        r#"
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'merchants' AND column_name = 'phone'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'merchants' AND column_name = 'business_phone'
            ) THEN
                ALTER TABLE merchants RENAME COLUMN phone TO business_phone;
                ALTER TABLE merchants RENAME COLUMN address TO business_address;
            END IF;
        END $$;
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
            delivery_address_id UUID REFERENCES addresses(id),
            delivery_address_text TEXT NOT NULL,
            delivery_address TEXT NOT NULL DEFAULT '',
            delivery_latitude DOUBLE PRECISION,
            delivery_longitude DOUBLE PRECISION,
            distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
            delivery_cost BIGINT NOT NULL DEFAULT 0,
            status delivery_status NOT NULL DEFAULT 'awaiting_assignment',
            payment_method payment_method NOT NULL DEFAULT 'orange_money',
            payment_status payment_status NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            assigned_carrier_id UUID,
            assigned_at TIMESTAMPTZ,
            picked_up_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            failure_reason failure_reason,
            carrier_notes TEXT,
            otp_code VARCHAR(6),
            otp_verified BOOLEAN NOT NULL DEFAULT false,
            delivery_photo_url TEXT,
            delivery_gps_coordinates VARCHAR(100),
            collect_payment BOOLEAN NOT NULL DEFAULT false,
            amount_to_collect BIGINT,
            amount_collected BIGINT,
            collection_status VARCHAR(20),
            collected_at TIMESTAMPTZ
        );
        "#,
    )
    .execute(pool)
    .await?;

    // Alter existing columns if they have wrong types (force alter without checking)
    sqlx::query(
        r#"
        ALTER TABLE deliveries 
        ALTER COLUMN delivery_cost TYPE BIGINT USING COALESCE(delivery_cost::NUMERIC::BIGINT, 0),
        ALTER COLUMN product_value TYPE BIGINT USING COALESCE(product_value::NUMERIC::BIGINT, 0),
        ALTER COLUMN delivery_latitude TYPE DOUBLE PRECISION USING COALESCE(delivery_latitude::NUMERIC::DOUBLE PRECISION, 0),
        ALTER COLUMN delivery_longitude TYPE DOUBLE PRECISION USING COALESCE(delivery_longitude::NUMERIC::DOUBLE PRECISION, 0),
        ALTER COLUMN distance_km TYPE DOUBLE PRECISION USING COALESCE(distance_km::NUMERIC::DOUBLE PRECISION, 0)
        "#
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
    
    // Seed demo data
    seed_demo_data(pool).await?;
    
    Ok(())
}

async fn seed_demo_data(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Check if demo merchant already exists
    let merchant_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM merchants WHERE id = '00000000-0000-0000-0000-000000000001')"
    )
    .fetch_one(pool)
    .await?;

    let deliveries_exist: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM deliveries LIMIT 1)"
    )
    .fetch_one(pool)
    .await?;

    if merchant_exists && deliveries_exist {
        log::info!("Demo data already exists, skipping seed");
        
        // Update demo merchant password hash if it's empty (fix for existing data)
        sqlx::query(
            r#"
            UPDATE merchants 
            SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHA4COYz6TtxMQJqhN8/X4.Dz4vVkZrPW8.d0'
            WHERE id = '00000000-0000-0000-0000-000000000001' 
            AND (password_hash = '' OR password_hash IS NULL)
            "#
        )
        .execute(pool)
        .await?;
        
        return Ok(());
    }

    log::info!("Seeding demo data...");

    // Insert demo merchant (with active status so demo data works without approval flow)
    // Password: Demo1234 (bcrypt hash)
    if !merchant_exists {
        sqlx::query(
            r#"
            INSERT INTO merchants (id, email, password_hash, business_name, business_type, business_address, business_phone, business_email, owner_name, owner_phone, national_id, status, dispatch_latitude, dispatch_longitude, wallet_balance)
            VALUES ('00000000-0000-0000-0000-000000000001', 'demo@electroshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHA4COYz6TtxMQJqhN8/X4.Dz4vVkZrPW8.d0', 'Electroshop', 'electronics', 'Bastos, Yaoundé', '+237677123456', 'demo@electroshop.com', 'Demo Owner', '+237677123456', NULL, 'active', 3.8808, 11.5022, 500000)
            "#
        )
        .execute(pool)
        .await?;
    }

    // Insert some saved addresses if table is empty
    let addresses_exist: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM addresses LIMIT 1)"
    )
    .fetch_one(pool)
    .await?;

    if !addresses_exist {
        let addresses = vec![
            ("Bastos Carrefour Tradex", 3.8808, 11.5022, "Bastos"),
            ("Centre Ville Place de l'Étoile", 3.8625, 11.5167, "Centre Ville"),
            ("Mvan Carrefour", 3.8456, 11.5023, "Mvan"),
            ("Nlongkak Carrefour", 3.8712, 11.4890, "Nlongkak"),
            ("Bonapriso Marché", 3.8654, 11.5123, "Bonapriso"),
            ("Essos Hôpital", 3.8891, 11.5234, "Essos"),
            ("Mendong Marché", 3.8345, 11.4876, "Mendong"),
            ("Akwa Boulevard de la Liberté", 3.8723, 11.4987, "Akwa"),
            ("Logbessou Université", 3.8234, 11.5345, "Logbessou"),
        ];

        for (text, lat, lon, area) in addresses {
            sqlx::query(
                r#"
                INSERT INTO addresses (address_text, latitude, longitude, area, is_saved)
                VALUES ($1, $2, $3, $4, true)
                "#
            )
            .bind(text)
            .bind(lat)
            .bind(lon)
            .bind(area)
            .execute(pool)
            .await?;
        }
    }
    
    // Insert sample deliveries
    let deliveries = vec![
        ("TRD-1013", "Le Creuset Cast Iron Pan 26cm", 45000, "Estelle Fotsio", "682556677",
         "Essos Hôpital", 5.5, 1500, "awaiting_assignment", "orange_money", "completed"),
        ("TRD-1018", "Samsung Galaxy S24 Ultra 256GB Black", 450000, "John Doe", "677123456",
         "Bastos Carrefour Tradex", 7.4, 2000, "in_transit", "mtn_momo", "completed"),
        ("TRD-1014", "Cuisinart Blender 1.5L", 85000, "Yves Mbarga", "691223344",
         "Mendong Marché", 9.2, 2000, "assigned", "merchant_wallet", "pending"),
        ("TRD-1017", "MacBook Air M3 13\" Midnight", 850000, "Aicha Bello", "699881122",
         "Akwa Boulevard de la Liberté", 4.1, 1500, "delivered", "orange_money", "completed"),
        ("TRD-1016", "Nike Air Force 1 White Size 42", 65000, "Paul Nguema", "655443322",
         "Bonapriso Marché", 2.6, 1000, "delivered", "mtn_momo", "completed"),
        ("TRD-1015", "Sony WH-1000XM5 Headphones Black", 280000, "Linda Kom", "678990011",
         "Logbessou Université", 11.8, 3000, "failed", "mtn_momo", "completed"),
    ];
    
    for (delivery_id, product, value, customer, phone, address_text, distance, cost, status, payment_method, payment_status) in deliveries {
        // Get a random address id
        let address_id: uuid::Uuid = sqlx::query_scalar(
            "SELECT id FROM addresses ORDER BY RANDOM() LIMIT 1"
        )
        .fetch_one(pool)
        .await?;
        
        let assigned_at = if status != "awaiting_assignment" {
            Some(chrono::Utc::now() - chrono::Duration::hours(24))
        } else {
            None
        };
        
        let picked_up_at = if status == "in_transit" || status == "delivered" || status == "failed" {
            Some(chrono::Utc::now() - chrono::Duration::hours(20))
        } else {
            None
        };
        
        let delivered_at = if status == "delivered" {
            Some(chrono::Utc::now() - chrono::Duration::hours(12))
        } else {
            None
        };
        
        let failure_reason = if status == "failed" {
            Some("customer_unavailable")
        } else {
            None
        };
        
        let carrier_notes = if status == "failed" {
            Some("Customer was not available at the address. Called multiple times but no answer.")
        } else {
            None
        };
        
        sqlx::query(
            r#"
            INSERT INTO deliveries (
                delivery_id, merchant_id, product_description, product_value, currency,
                customer_name, customer_phone, delivery_address_id, delivery_address_text,
                distance_km, delivery_cost, status, payment_method, payment_status,
                assigned_at, picked_up_at, delivered_at, failure_reason, carrier_notes, otp_verified
            )
            VALUES ($1, '00000000-0000-0000-0000-000000000001', $2, $3, 'FCFA', $4, $5, $6, $7, $8, $9, $10::delivery_status, $11::payment_method, $12::payment_status, $13, $14, $15, $16::failure_reason, $17,
                CASE WHEN $15 IS NOT NULL THEN true ELSE false END)
            "#
        )
        .bind(delivery_id)
        .bind(product)
        .bind(value)
        .bind(customer)
        .bind(phone)
        .bind(address_id)
        .bind(address_text)
        .bind(distance)
        .bind(cost)
        .bind(status)
        .bind(payment_method)
        .bind(payment_status)
        .bind(assigned_at)
        .bind(picked_up_at)
        .bind(delivered_at)
        .bind(failure_reason)
        .bind(carrier_notes)
        .execute(pool)
        .await?;
    }
    
    log::info!("Demo data seeded successfully");
    Ok(())
}
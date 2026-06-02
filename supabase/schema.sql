-- TrustDelivery Merchant Portal Database Schema
-- Run this in your Supabase SQL Editor

-- Create enum types
CREATE TYPE delivery_status AS ENUM ('awaiting_assignment', 'assigned', 'in_transit', 'delivered', 'failed');
CREATE TYPE payment_method AS ENUM ('orange_money', 'mtn_momo', 'merchant_wallet');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE failure_reason AS ENUM ('customer_unavailable', 'wrong_address', 'phone_unreachable', 'customer_refused_product', 'other');

-- Create merchants table
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

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_text TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    area VARCHAR(100),
    is_saved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deliveries table
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

-- Create payments table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deliveries_merchant_id ON deliveries(merchant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_addresses_search ON addresses USING gin(to_tsvector('simple', address_text));

-- Insert demo merchant (for testing)
INSERT INTO merchants (id, email, business_name, phone, address, dispatch_latitude, dispatch_longitude, wallet_balance)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@merchant.com',
    'Demo Electronics Store',
    '677123456',
    'Bastos, Yaoundé',
    3.8480,
    11.5022,
    50000
) ON CONFLICT (id) DO NOTHING;

-- Insert sample addresses for Yaoundé
INSERT INTO addresses (id, address_text, latitude, longitude, area, is_saved) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Bastos Carrefour Tradex', 3.8808, 11.5022, 'Bastos', true),
    ('10000000-0000-0000-0000-000000000002', 'Bastos Ecobank', 3.8795, 11.5010, 'Bastos', true),
    ('10000000-0000-0000-0000-000000000003', 'Centre Ville Place de l''Étoile', 3.8625, 11.5167, 'Centre Ville', false),
    ('10000000-0000-0000-0000-000000000004', 'Mvan Carrefour', 3.8456, 11.5023, 'Mvan', false),
    ('10000000-0000-0000-0000-000000000005', 'Nlongkak Carrefour', 3.8712, 11.4890, 'Nlongkak', false)
ON CONFLICT DO NOTHING;

-- Create function to generate delivery ID
CREATE OR REPLACE FUNCTION generate_delivery_id()
RETURNS VARCHAR AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_id FROM 5) AS INTEGER)), 1000) + 1 
    INTO next_num 
    FROM deliveries;
    
    RETURN 'TRD-' || next_num::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your auth setup)
CREATE POLICY "Merchants can view their own data" ON merchants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view addresses" ON addresses
    FOR SELECT USING (true);

CREATE POLICY "Merchants can view their deliveries" ON deliveries
    FOR SELECT USING (true);

CREATE POLICY "Merchants can create deliveries" ON deliveries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Merchants can update their deliveries" ON deliveries
    FOR UPDATE USING (true);

-- Create view for delivery statistics
CREATE OR REPLACE VIEW delivery_stats AS
SELECT 
    merchant_id,
    COUNT(*) AS total_deliveries,
    COUNT(*) FILTER (WHERE status IN ('awaiting_assignment', 'assigned', 'in_transit')) AS active_deliveries,
    COUNT(*) FILTER (WHERE status = 'awaiting_assignment') AS awaiting_assignment,
    COUNT(*) FILTER (WHERE status = 'in_transit') AS in_transit,
    COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed,
    COALESCE(SUM(delivery_cost) FILTER (WHERE payment_status = 'completed'), 0) AS total_spending
FROM deliveries
GROUP BY merchant_id;
# TrustDelivery Merchant Portal

A production-quality merchant dashboard for delivery management, built with Rust (Actix-web) backend and React TypeScript frontend with Supabase database.

## Features

### Delivery Management
- **Create Deliveries**: Complete delivery creation flow with:
  - Product description and value input
  - Customer name and phone number (Cameroon format validation)
  - Address autocomplete with Yaoundé locations
  - Automatic distance and cost calculation
  - Payment method selection (Orange Money, MTN MoMo, Merchant Wallet)

### Pricing Rules
- 0-3 km: 1,000 FCFA
- 3-6 km: 1,500 FCFA
- 6-10 km: 2,000 FCFA
- 10+ km: 3,000 FCFA

### Dashboard
- Active deliveries overview
- Deliveries awaiting assignment
- In-transit deliveries
- Delivered deliveries
- Failed deliveries
- Total delivery spending

### Delivery Tracking
- Status timeline with visual progress
- Status badges (Awaiting Assignment, Assigned, In Transit, Delivered, Failed)
- Proof of delivery with OTP verification
- GPS coordinates placeholder
- Delivery photo placeholder

### Failed Delivery Handling
- Failure reasons display
- Rider notes
- Customer Unavailable, Wrong Address, Phone Unreachable, Customer Refused Product, Other

## Tech Stack

### Backend
- **Rust** with Actix-web framework
- **PostgreSQL** (Supabase)
- **SQLx** for database operations

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **date-fns** for date formatting

## Project Structure

```
TrustDelivery-Merchant/
├── backend/
│   ├── src/
│   │   ├── config.rs          # App configuration
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   └── migrations.rs  # Database migrations
│   │   ├── handlers/
│   │   │   ├── mod.rs
│   │   │   ├── routes.rs      # API routes
│   │   │   ├── delivery_handler.rs
│   │   │   ├── address_handler.rs
│   │   │   └── merchant_handler.rs
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── delivery.rs
│   │   │   ├── address.rs
│   │   │   ├── merchant.rs
│   │   │   └── payment.rs
│   │   ├── services/
│   │   │   ├── mod.rs
│   │   │   ├── delivery_service.rs
│   │   │   ├── address_service.rs
│   │   │   ├── merchant_service.rs
│   │   │   └── pricing_service.rs
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   └── response.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreateDelivery.tsx
│   │   │   └── DeliveryDetails.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   └── mockData.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
├── supabase/
│   └── schema.sql
└── README.md
```

## Setup Instructions

### Prerequisites
- Rust (latest stable)
- Node.js 18+
- Supabase account

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Get your database connection string from Project Settings > Database

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# Run the backend
cargo run
```

The API will be available at `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Deliveries
- `GET /api/deliveries` - List all deliveries (with pagination)
- `POST /api/deliveries` - Create a new delivery
- `GET /api/deliveries/:id` - Get delivery by ID
- `GET /api/deliveries/stats` - Get delivery statistics
- `POST /api/deliveries/calculate-cost` - Calculate delivery cost

### Addresses
- `GET /api/addresses/search` - Search addresses (autocomplete)
- `GET /api/addresses/saved` - Get saved addresses

### Merchant
- `GET /api/merchant/profile` - Get merchant profile
- `GET /api/merchant/wallet` - Get wallet balance

## Environment Variables

### Backend (.env)
```
HOST=0.0.0.0
PORT=8080
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

## Development Notes

### Assumptions
- Merchant is already authenticated (no login/registration pages)
- Default merchant ID is used for demo purposes
- Distance calculation uses Haversine formula
- Address autocomplete includes mock Yaoundé locations

### Future Enhancements
- Real authentication with Supabase Auth
- Real-time delivery tracking with WebSockets
- Push notifications for delivery updates
- Integration with payment providers
- Rider mobile app integration
- Admin dashboard for delivery management

## License

MIT License
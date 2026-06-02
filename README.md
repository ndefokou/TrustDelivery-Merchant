# TrustDelivery

A centralized delivery management platform for businesses in Yaoundé, providing end-to-end tracking and accountability for every delivery.

## Problem Statement

Many businesses in Yaoundé sell products through WhatsApp, Facebook, Instagram, and physical shops. Once a product leaves the shop, they lose visibility over what happens next.

**Common issues include:**

- Products not being delivered
- Products being stolen or misplaced
- Customers claiming they never received the product
- Riders claiming customers were unavailable
- No centralized tracking system
- No reliable proof of delivery

TrustDelivery solves this by providing a centralized delivery management platform where every delivery is tracked from creation to completion.

---

## The Ecosystem

The platform consists of three main actors:

```text
Merchant → Creates Delivery Request
    ↓
Administrator → Assigns Delivery
    ↓
Rider → Executes Delivery
    ↓
Delivery Result → Merchant + Administrator Updated
```

---

## Features

### Merchant Portal

The Merchant Portal is for businesses that want products delivered (online stores, WhatsApp sellers, Instagram sellers, electronics shops, fashion stores, pharmacies).

**Key Capabilities:**
- Create delivery requests with product and customer information
- Automatic delivery cost calculation based on distance
- Real-time delivery tracking
- Payment via Orange Money, MTN MoMo, or Merchant Wallet
- Delivery history and proof of delivery (OTP verification)

**Delivery Statuses:**
- Awaiting Assignment
- Assigned
- In Transit
- Delivered
- Failed

### Administrator Portal

The Administrator Portal is the operational center of TrustDelivery.

**Key Capabilities:**
- Dashboard with active riders, deliveries, and revenue metrics
- Delivery queue management
- Rider assignment based on workload, area, availability, and performance
- Rider management (create, update, suspend, remove)
- Delivery monitoring with status filters
- Rider performance reports (daily, weekly, monthly)
- Revenue reports (daily, weekly, monthly, yearly)

### Rider Portal

The Rider Portal is designed to be mobile-first.

**Key Capabilities:**
- View assigned deliveries
- Start delivery (status becomes "In Transit")
- Complete delivery with OTP verification
- Report failed deliveries with reasons
- Daily expense tracking (fuel, repairs, parking, other)

**Failed Delivery Reasons:**
- Customer Unavailable
- Wrong Address
- Phone Unreachable
- Customer Refused Product
- Other

---

## Core Value Proposition

TrustDelivery is not just a delivery application. It is a **delivery accountability platform**.

Every delivery has:
- A merchant who requested it
- An administrator who assigned it
- A rider responsible for it
- A verifiable delivery outcome

This creates transparency, trust, and operational control for businesses in Yaoundé.

---

## Future Roadmap

### Version 2
- GPS live tracking
- Route optimization
- Customer notifications
- Delivery photos
- Merchant wallet
- Cash-On-Delivery management

### Version 3
- Douala expansion
- Mobile apps (Android/iPhone)
- Rider earnings management
- AI-assisted route planning
- Nationwide delivery network

---

## Getting Started

*Documentation to be added as development progresses.*

---

## License

*License information to be added.*
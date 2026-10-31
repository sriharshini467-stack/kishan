# 🌾 KisanSetu (किसानसेतु) — Direct Farm-to-Buyer Marketplace & Agri-Advisory

> **Empowering farmers through direct digital trade, localized harvest insights, and transparent agricultural commerce.**

---

## 📌 Executive Summary

Agriculture sustains a massive percentage of the workforce and forms the backbone of food security. However, smallholder farmers frequently suffer from **information asymmetry**, **unpredictable weather events**, and **limited direct market access**. Heavy reliance on traditional intermediaries and commission agents leads to compressed margins and unfair pricing, while delayed access to agronomical guidance and disease advisories results in devastating post-harvest losses.

**KisanSetu** acts as a direct digital bridge that connects farmers, food hubs, and agricultural collectives directly with commercial buyers (restaurants, grocers, retail supermarkets, and wholesale distributors). By pairing a high-volume B2B produce marketplace with real-time harvest weather alerts, 10-minute dynamic stock reservation, tiered bulk pricing, and multilingual localized access across 6 Indian languages, KisanSetu delivers fair pricing, operational transparency, and actionable data.

---

## 🎯 Target Users

1. **Primary Producers (Farmers & Farm Collectives)**: Independent growers, Farmer Producer Organizations (FPOs), Community Supported Agriculture (CSAs), and regional aggregation hubs.
2. **Agri-Buyers & Commercial Procurers**: Restaurants, cloud kitchens, hotel chains, supermarket retailers, grocery outlets, and bulk Mandi wholesale distributors.
3. **Rural Service Providers & Mandi Facilitators**: Logistics partners, quality sorters, and agricultural extension field coordinators.

---

## 🚀 Key Objectives

- **Eliminate Middlemen**: Facilitate peer-to-peer trade connecting farmers directly to verified commercial buyers to boost grower margins.
- **Dynamic Inventory Protection**: Prevent overselling and price speculation through atomic stock-locking checkout transactions.
- **Localized Multilingual Interface**: Provide effortless accessibility in 6 languages: **English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), and Marathi (मराठी)**.
- **Actionable Agronomy & Harvest Context**: Deliver real-time localized weather telemetry and post-harvest storage advisories.
- **Automated Communication**: Keep farmers and buyers synchronized via transactional SMS and WhatsApp notifications for every lifecycle stage.

---

## 🌟 Core Features & Modules

### 1. Multilingual Support (i18n)
- Dynamic in-app translation across **English, Hindi, Telugu, Tamil, Kannada, and Marathi**.
- Immediate switching via top navigation and integrated into user registration.

### 2. Dual-Role Architecture & Frictionless Auth
- **Phone-Based Authentication**: 10-digit mobile number registration with secure `bcryptjs` password hashing and JWT persistence.
- **Post-Signup Role Selector (`/select-role`)**:
  - **Supplier Category**: Independent Farmers, Food Hubs / FPOs, Community Supported Agriculture (CSAs).
  - **Buyer Category**: Restaurants & Hospitality, Retail Grocers, Bulk Mandi Distributors, and Household buying groups.
- **One-Click Demo Profiles**: Pre-seeded accounts for instant evaluation as Ramesh (Farmer), Anita (Restaurant Buyer), or GreenGrocers (Wholesaler).

### 3. Produce Listings & Local Line Enhancements
- **Tiered Bulk Wholesale Pricing**: Automatic discount calculation based on procurement volume (e.g., Retail 1–25 kg, Commercial 26–100 kg, Mandi Bulk >100 kg).
- **Harvest Freshness Badges**: Calculated dynamically from harvest timestamp:
  - `Picked Today 🌟` (< 16 hours)
  - `Harvested Yesterday` (16–40 hours)
  - `Fresh (2 days ago)` (40–72 hours)
  - `Farm Cured & Stored` (> 72 hours)
- **Fulfillment Windows**: Configurable farm-gate pickup and dispatch slots (e.g., *Daily 6:30 AM - 11:30 AM*).

### 4. Dynamic 10-Minute Stock Locking & Checkout
- **Atomic Stock Reservation**: When a buyer adds produce to their cart, inventory is reserved exclusively for **10 minutes** to eliminate double-booking during peak procurement hours.
- Automatic timer sweeper that gracefully releases expired reservations back to active marketplace stock if checkout is not completed.
- Flexible payment simulation (Cash on Farm Pickup, Pay on Direct Delivery, and Simulated Instant UPI).

### 5. 5-Stage Order State Machine & Partial Order Acceptance
- **State Machine**: `Requested` ➔ `Accepted` ➔ `Ready for Pickup` ➔ `Completed` (or `Cancelled`).
- **Partial Order Acceptance Endpoint**: Farmers can accept partial quantities (e.g., accepting 30 kg out of a requested 40 kg based on morning harvest yields). The system automatically recalculates order totals, updates APMC fees, returns unfulfilled stock to inventory, and notifies the buyer.

### 6. AI Kisan Sathi & Live Weather Telemetry
- Agricultural advisories factoring in live humidity, wind speeds, and precipitation risks.
- Clear storage vs. field harvesting recommendations (e.g., advising covered shed storage during rain warnings).

### 7. Transactional Alerts (Twilio & Brevo Gateway)
- Dispatches transactional SMS and WhatsApp notifications to farmers when new orders arrive, and to buyers when orders are accepted, adjusted, or marked ready for pickup.
- Audit trail logging all inventory changes (initial lots, lock reservations, releases, and fulfillments).

---

## 🛠️ Tech Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Axios |
| **Backend** | Node.js, Express.js (REST APIs), JSON Web Tokens (JWT), Bcrypt.js |
| **Database & ODM** | MongoDB, Mongoose schemas (`User`, `Product`, `Order`, `StockLock`, `InventoryHistory`) |
| **External APIs** | OpenWeatherMap API, Twilio / Brevo SMS & WhatsApp Gateway |
| **Dev & Deployment** | Node.js v22 ESM, Cloud Run, Git/GitHub |

---

## 📁 Project Directory Structure

```plaintext
├── models/                     # MongoDB Mongoose Schemas
│   ├── User.js                 # User credentials, language, primary and sub-roles
│   ├── Product.js              # Produce catalog with tiered pricing & freshness
│   ├── Order.js                # 5-stage order state machine & partial accept
│   ├── StockLock.js            # 10-minute atomic cart reservation with TTL
│   └── InventoryHistory.js     # Audit trail for stock changes & fulfillments
├── routes/                     # Express REST API Controllers
│   ├── auth.ts                 # Signup, login, and role selection
│   ├── products.ts             # Produce CRUD & one-tap stock toggle
│   ├── orders.ts               # Lock-stock checkout & partial acceptance
│   ├── weather.ts              # Harvest weather telemetry & advisory
│   └── notifications.ts        # Twilio/Brevo notification gateway logs
├── server/
│   └── db.ts                   # In-memory store & stock lock sweeper
├── src/
│   ├── components/             # Reusable UI Components
│   │   ├── Navbar.tsx          # Responsive bar with language & role switcher
│   │   ├── ProductCard.tsx     # Tiered pricing, freshness badge, lock actions
│   │   ├── OrderStatusStepper.tsx # Visual 5-stage stepper component
│   │   ├── CartDrawer.tsx      # Slideover with 10-minute lock countdown
│   │   ├── PartialAcceptModal.tsx # Farmer quantity adjustment modal
│   │   ├── NewProductModal.tsx # Produce listing builder
│   │   ├── WeatherWidget.tsx   # Live weather telemetry card
│   │   └── NotificationCenter.tsx # SMS/WhatsApp notification logs viewer
│   ├── context/
│   │   ├── AuthContext.tsx     # Auth state, JWT persistence, demo profiles
│   │   ├── LanguageContext.tsx # Dynamic i18n translation context
│   │   └── CartContext.tsx     # 10-minute lock state & checkout flow
│   ├── i18n/
│   │   └── translations.ts     # Dictionaries for EN, HI, TE, TA, KN, MR
│   ├── pages/
│   │   ├── AuthPage.tsx        # Registration and login forms
│   │   ├── RoleSelectionPage.tsx # Post-signup visual role selection
│   │   ├── SupplierDashboard.tsx # Farmer workspace (Emerald/Gold theme)
│   │   └── BuyerDashboard.tsx  # Procurement desk (Teal/Slate theme)
│   ├── AppRoutes.tsx           # Protected routes with role checking
│   ├── App.tsx                 # Root application wrapper
│   └── types.ts                # TypeScript interfaces and domain types
├── index.html                  # HTML5 entry with metadata and Google Fonts
├── metadata.json               # Application metadata configuration
├── package.json                # Project dependencies and npm scripts
├── server.ts                   # Full-stack Express + Vite server entry point
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite & Tailwind CSS plugins
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v20 or higher recommended)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/kisansetu.git
cd kisansetu

# Install dependencies
npm install
```

### 3. Configuration
Copy the sample environment variables:
```bash
cp .env.example .env
```
Key environment variables:
- `PORT`: Server port (default: `3000`)
- `JWT_SECRET`: Secret key for JWT session generation
- `OPENWEATHER_API_KEY`: (Optional) OpenWeatherMap API key
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`: (Optional) Twilio SMS credentials

### 4. Running the Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` with both the Express REST APIs and Vite React frontend mounted together.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📈 Potential Impact

- **+15% to 20% Income Increase for Farmers**: Directly eliminating middleman margins and price distortion.
- **Reduced Post-Harvest Loss**: Real-time harvest advisories and scheduled pickup windows minimize spoilage of perishables.
- **Fair Sourcing for Commercial Buyers**: Guaranteed transparent pricing, authentic farmer-origin tracking, and bulk volume discounts.

---

## 🔮 Limitations & Future Scope

### Current Limitations
- **Simulated Payment Gateway**: Supports simulated UPI and Cash on Pickup/Delivery; live UPI deep linking is not yet connected to a banking switch.
- **Network Dependency**: Requires standard internet connectivity for live stock locking.

### Future Roadmap
1. **Live Banking & UPI Autopay Settlements**: Integrating NPCI UPI auto-split escrows for instantaneous payment upon pickup confirmation.
2. **Offline IVR & Voice Call Support**: Dial-in phone system for farmers in remote low-bandwidth zones to update stock via voice prompts.
3. **Cold-Chain & GPS Fleet Tracking**: Live telematics tracking temperature-controlled transit from farm gate to restaurant kitchens.
4. **Computer Vision Crop Diagnostics**: Camera-based leaf photo disease diagnosis with instant bio-pesticide recommendations.

---

## 📄 License
This project is licensed under the Apache-2.0 License.

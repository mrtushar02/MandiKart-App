# MandiKart

MandiKart is an agriculture marketplace project designed to connect farmers, users/buyers, administrators, and logistics teams in a single digital ecosystem.

## Project Overview
The platform is divided into four major app modules:

1. FarmerApp
   - Farmer-facing marketplace and inventory management
2. UserApp
   - Buyer-facing experience for browsing, ordering, and tracking
3. Admin
   - Platform oversight, moderation, and analytics
4. Logistic
   - Delivery, route, and fulfillment coordination

Each module contains two code subfolders:
- frontend
- backend

## Folder Structure

```text
MandiKart/
├── FarmerApp/
│   ├── frontend/
│   ├── backend/
│   ├── Frontend.md
│   └── Backend.md
├── UserApp/
│   ├── frontend/
│   ├── backend/
│   ├── Frontend.md
│   └── Backend.md
├── Admin/
│   ├── frontend/
│   ├── backend/
│   ├── Frontend.md
│   └── Backend.md
├── Logistic/
│   ├── frontend/
│   ├── backend/
│   ├── Frontend.md
│   └── Backend.md
├── README.md
├── 00_PROJECT_MASTER_GUIDE.md
├── 01_FRONTEND_DEV_GUIDE.md
├── 02_BACKEND_DEV_GUIDE.md
└── ...
```

## Module Responsibilities

### FarmerApp
- Manage produce listings
- Track inventory and crop availability
- View and respond to buyer requests
- Manage sales and fulfillment visibility

### UserApp
- Discover produce
- Compare prices and listings
- Place buyer orders
- Track delivery status

### Admin
- Manage platform users
- Monitor orders and disputes
- Review analytics and business insights
- Control verification and moderation flows

### Logistic
- Handle pickup scheduling
- Coordinate transport and route planning
- Update delivery status
- Manage exceptions and delays

## Development Approach
This repository follows a modular development setup where every domain has separate frontend and backend responsibilities. The docs in the root folder provide the master plan, frontend guidance, and backend guidance for the full project lifecycle.

## Quick Start & App Execution Guide

### 1. Installation
Install all monorepo dependencies from the project root:
```bash
npm install
```

### 2. Environment Configuration
Copy the root `.env.example` to `.env` or use localized `.env.example` files in each subproject:
```bash
cp .env.example .env
```

### 3. Microservice Backends & Ports

| Service | Directory | Port | Run Command |
| :--- | :--- | :--- | :--- |
| **Farmer Backend** | `FarmerApp/mandikart-farmer-backend` | `4000` | `npm run dev:farmer` |
| **User/Buyer Backend** | `UserApp/backend` | `4001` | `npm run dev:user` |
| **Logistics Backend** | `Logistic/backend` | `4002` | `npm run dev:logistic` |
| **Admin Backend** | `Admin/backend` | `4003` | `npm run dev:admin` |

### 4. Frontend Web & Mobile Applications

| Application | Technology | Directory | Run Command |
| :--- | :--- | :--- | :--- |
| **Admin Web Console** | React + Vite + TS | `Admin/Frontend` | `npm run dev:admin-frontend` |
| **Logistics Web Dashboard** | React + Vite + TS | `Logistic/frontend` | `npm run dev:logistic-frontend` |
| **Farmer Mobile App** | React Native / Expo | `FarmerApp/mandikart-farmer-frontend` | `npm run dev:farmer-app` |
| **User/Buyer Mobile App** | React Native / Expo | `UserApp/Frontend` | `npm run dev:user-app` |
| **Logistics Partner App** | React Native / Expo | `Logistic/partner-app` | `npm run dev:partner-app` |

### 5. Build Verification
Build all monorepo packages, shared libraries, and web frontends:
```bash
npm run build
```

## Notes
- Shared libraries are located in `packages/` (`@mandikart/shared-core`, `@mandikart/shared-types`, `@mandikart/shared-config`).
- All backends connect to Supabase for synchronized real-time data flow.
- Mobile apps support both web preview (`npm run dev:...` then press `w`) and physical device/emulator testing via Expo Go.
# Smart Mobility Upgrade Roadmap

## Current Baseline

The existing project already includes:

- Google-based authentication
- Ride creation and joining
- Ride groups with chat
- Polls and expense splitting
- Next.js frontend and Express + Prisma backend

Key current code areas:

- Frontend ride dashboard: `Client/src/components/pool/pool-dashboard.tsx`
- Frontend pool pages: `Client/src/app/pools/page.tsx`
- Backend ride flows: `backend/src/controllers/ride.controller.ts`
- Current data model: `backend/prisma/schema.prisma`

## Product Gap vs Target Brief

To become a market-ready smart mobility platform, the project still needs:

1. Mobile-first product design
2. Verified identity and trust system
3. AI-based ride matching and ranking
4. Real-time ride tracking and trip states
5. Booking and scheduling for recurring commutes
6. Digital payments and fare settlement
7. Safety stack: SOS, trip sharing, emergency contacts
8. Ratings and reviews
9. Corporate mobility management
10. Sustainability metrics and reporting
11. Notification and alert system
12. Admin and operations visibility

## Recommended Product Direction

### Short-term

Upgrade the current app into a mobile-first PWA-style product while keeping the existing stack:

- Frontend: Next.js mobile-first responsive app shell
- Backend: Express + Prisma APIs
- Database: PostgreSQL on Railway
- Auth: Google + profile verification workflow
- Live updates: Socket.io

### Medium-term

If a real app-store mobile app is required, keep the backend and add:

- Expo / React Native client
- Shared API contracts and domain model

This reduces rewrite risk and preserves the backend investment.

## Recommended Information Architecture

### User App

- Home
- Search Rides
- My Trips
- Schedule
- Messages
- Wallet
- Safety
- Profile

### Driver / Ride Creator Flows

- Publish ride
- Manage seats
- Manage requests
- Start trip
- Live tracking
- End trip

### Corporate Mobility

- Programs
- Employee groups
- Route analytics
- Occupancy and cost reports
- Sustainability dashboard

## Backend Domain Changes

Add these major entities to the Prisma schema:

### User Trust and Verification

- `UserVerification`
- `EmergencyContact`
- `UserRating`
- `UserPreference`

### Mobility and Matching

- `SavedCommute`
- `RideSchedule`
- `RideMatchScore`
- `RideWaypoint`
- `TripEvent`
- `LocationPing`

### Commercial Features

- `PaymentTransaction`
- `FareSplit`
- `Promo`
- `SubscriptionPlan`

### Safety

- `SafetyAlert`
- `TripShare`

### Corporate

- `Company`
- `CorporateProgram`
- `EmployeeMembership`
- `CorporateCommuteReport`

### Sustainability

- `SustainabilityMetric`

## AI and Smart Features

### Matching Engine v1

Rank rides using:

- route overlap
- pickup distance
- departure time compatibility
- seat availability
- gender or comfort preferences
- recurring commute similarity
- user trust score

### Matching Engine v2

Add:

- behavioral acceptance patterns
- cancellation risk scoring
- corporate routing optimization

## Feature Phasing

## Phase 1: Product Reframe

Goal: make the app look and behave like a real mobility product.

Deliverables:

- mobile-first dashboard
- quick ride search
- upcoming rides widget
- trust and safety banners
- sustainability summary cards
- ride schedule framing
- cleaner onboarding and profile completion

## Phase 2: Trust, Scheduling, and Ratings

Goal: add the missing product fundamentals.

Deliverables:

- user verification flow
- profile completion progress
- emergency contacts
- ratings and reviews
- recurring commute preferences
- scheduled rides

## Phase 3: Real-Time Trip Operations

Goal: support actual live ride management.

Deliverables:

- trip lifecycle states
- driver start/end trip actions
- live location pings
- rider tracking screen
- trip sharing and SOS

## Phase 4: Payments and Sustainability

Goal: commercial and measurable value.

Deliverables:

- fare splitting records
- payment transaction states
- payment provider integration points
- fuel and CO2 savings dashboard

## Phase 5: Corporate Mobility

Goal: unlock B2B value.

Deliverables:

- company entity and membership
- corporate program dashboard
- employee commute summaries
- route and occupancy analytics

## Recommended Next Build Step

The best immediate step is:

1. Redesign the current pool dashboard into a mobile-first mobility home screen.
2. Expand the Prisma schema for trust, trip state, schedule, ratings, and safety.
3. Add backend endpoints for profile completion, scheduled rides, and ratings.

## Suggested MVP for Evaluation Demo

If the goal is an impressive project/demo quickly, build this slice first:

- mobile-first home dashboard
- ride search and booking
- scheduled commute creation
- trust badges and verified users
- live trip state mock tracking
- safety center with SOS and share trip
- sustainability stats
- conceptual corporate dashboard

This is the highest-ROI path from the current codebase to the brief.

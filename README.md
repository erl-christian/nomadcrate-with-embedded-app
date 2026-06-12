# NomadCrate & BundleIQ

A Shopify storefront and embedded Shopify application built as part of a Shopify Take-Home Assessment.

---

# Project Overview

This project consists of two parts:

## Part 1 — NomadCrate Shopify Theme

NomadCrate is a fictional travel and outdoor gear brand designed for adventurers, digital nomads, and explorers.

The storefront focuses on curated shopping experiences and includes a Smart Pack Builder that helps customers discover product combinations based on their travel needs.

### Features

* Custom Home Page
* Collection Page
* Product Page
* Cart Page
* Responsive Design
* Shopify Liquid Development
* Custom Theme Sections
* Smart Pack Builder Experience

---

## Part 2 — BundleIQ Shopify Embedded App

BundleIQ is an embedded Shopify Admin application that helps merchants create, manage, and evaluate product bundles.

The application provides bundle intelligence through scoring, rankings, recommendations, alerts, and bundle analytics.

### Features

* Bundle Dashboard
* Create Bundle
* Edit Bundle
* Delete Bundle
* Activity Tracking
* Opportunity Scoring
* Bundle Health Analysis
* Ranking System
* Recommendations Engine
* Alert System
* Potential AOV Insights

---

# Technology Stack

## Theme

* Shopify Liquid
* CSS
* Minimal JavaScript

## Embedded App

### Frontend

* React
* React Router
* Vite

### Backend

* Node.js

### Database

* MySQL
* Drizzle ORM

### Shopify

* Shopify Admin API
* Shopify App Bridge
* Embedded App Architecture

---

# Project Structure

```text
qtech-shopify-project/

├── nomadcrate-theme/
│
├── bundleiq-app/
│   ├── app/
│   ├── prisma/
│   ├── public/
│   ├── drizzle/
│   └── ...
│
├── README.md
│
└── APP_DECISIONS.md
```

---

# Database Schema

## bundles

Stores bundle information.

| Column      | Type      |
| ----------- | --------- |
| id          | INT       |
| name        | VARCHAR   |
| description | TEXT      |
| score       | INT       |
| status      | VARCHAR   |
| createdAt   | TIMESTAMP |
| updatedAt   | TIMESTAMP |

---

## bundle_products

Stores products belonging to a bundle.

| Column        | Type    |
| ------------- | ------- |
| id            | INT     |
| bundleId      | INT     |
| productHandle | VARCHAR |
| productTitle  | VARCHAR |
| productPrice  | DECIMAL |
| productType   | VARCHAR |

Relationship:

* Many bundle products belong to one bundle.

---

## activity_logs

Stores bundle history.

| Column    | Type      |
| --------- | --------- |
| id        | INT       |
| bundleId  | INT       |
| action    | VARCHAR   |
| details   | TEXT      |
| createdAt | TIMESTAMP |

Relationship:

* Many activity logs belong to one bundle.

---

# BundleIQ Analytics

BundleIQ evaluates bundle quality using multiple metrics:

## Opportunity Score

Measures overall bundle potential.

Factors include:

* Product Count
* Bundle Value
* Category Coverage

---

## Bundle Health Score

Evaluates overall bundle composition quality.

---

## Bundle Rankings

Ranks bundles by score.

---

## Recommendations

Provides merchant recommendations such as:

* Promote High Opportunity Bundles
* Improve Medium Opportunity Bundles
* Review Low Opportunity Bundles

---

## Alerts

Detects:

* Low Bundle Value
* Low Category Coverage
* Weak Bundle Composition

---

## Potential AOV Increase

Estimates potential Average Order Value impact based on bundle composition.

---

# Installation

## Prerequisites

* Node.js
* npm
* MySQL
* Shopify CLI
* Shopify Partner Account
* Shopify Development Store

---

# Embedded App Setup

Navigate to the application directory:

```bash
cd bundleiq-app
```

Install dependencies:

```bash
npm install
```

Create environment variables:

```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=
SHOPIFY_APP_URL=

DATABASE_URL=
```

---

# Database Setup

Create a MySQL database.

Example:

```sql
CREATE DATABASE bundleiq;
```

Run Drizzle migrations:

```bash
npx drizzle-kit migrate
```

---

# Run Application

Start Shopify development server:

```bash
shopify app dev
```

The application will be available through the Shopify Admin embedded app preview URL.

---

# Theme Setup

Navigate to the theme directory:

```bash
cd nomadcrate-theme
```

Run:

```bash
shopify theme dev
```

Push theme:

```bash
shopify theme push
```

---

# Screenshots

Add screenshots before submission:

* Home Page
* Collection Page
* Product Page
* Cart Page
* BundleIQ Dashboard
* Bundle Management
* Activity Logs

---

# Future Improvements

If more development time were available:

* Sales-Based Analytics
* Order Data Integration
* Automated Bundle Suggestions
* Revenue Forecasting
* Historical Performance Trends
* Merchant Notifications
* Advanced Dashboard Visualizations

---

# Author

Erl Christian L. Albuena

Bachelor of Science in Information Technology

2026 Graduate

Developed for Shopify Take-Home Assessment

```
```

# APP_DECISIONS.md

## Store Concept

### NomadCrate

NomadCrate is a fictional Shopify store focused on travel, outdoor, and adventure essentials.

The brand targets travelers, hikers, digital nomads, and outdoor enthusiasts who need curated gear for different types of adventures.

Instead of a generic e-commerce experience, NomadCrate emphasizes discovery and bundle-based shopping through a Smart Pack Builder that helps customers assemble recommended gear combinations.

---

## Embedded App Concept

### BundleIQ

BundleIQ is a Shopify Embedded App designed to help merchants create, evaluate, and optimize product bundles.

Many merchants create bundles based on intuition and manually decide which products should be grouped together. BundleIQ provides analytics and recommendations that help merchants identify stronger bundle opportunities.

The app focuses on:

* Bundle creation and management
* Opportunity scoring
* Bundle rankings
* Bundle health analysis
* Merchant recommendations
* Activity tracking

---

## Problem Being Solved

Merchants often create bundles without visibility into:

* Bundle value
* Product diversity
* Bundle quality
* Cross-sell opportunities

BundleIQ helps merchants evaluate bundle effectiveness using bundle analytics and recommendation logic.

---

## Key Architecture Decisions

### Shopify Theme

The storefront was built using:

* Shopify Liquid
* CSS
* Minimal JavaScript

Custom sections were used to improve maintainability and allow merchant customization through the Shopify Theme Editor.

Key custom sections include:

* Hero Section
* Featured Collections
* Smart Pack Builder
* Adventure Categories
* Featured Products

---

### Embedded App

The embedded app was built using:

* Vite
* React Router
* Node.js
* Shopify App Bridge
* Shopify Admin API

The Shopify React Router template was used because it provides Shopify OAuth, embedded app support, and authentication flows out of the box.

---

## Database Design

The application uses MySQL with Drizzle ORM.

### bundles

Stores bundle information.

Fields:

* id
* name
* description
* score
* status
* createdAt
* updatedAt

### bundle_products

Stores products associated with a bundle.

Fields:

* id
* bundleId
* productHandle
* productTitle
* productPrice
* productType

Relationship:

* Many bundle_products belong to one bundle

### activity_logs

Stores bundle activity history.

Fields:

* id
* bundleId
* action
* details
* createdAt

Relationship:

* Many activity logs belong to one bundle

---

## Logic-Based Features

BundleIQ includes several logic-driven features:

### Opportunity Score

Bundles are scored based on bundle composition and merchant-defined evaluation criteria.

### Bundle Rankings

Bundles are ranked based on opportunity score.

### Bundle Health Score

Bundle health evaluates:

* Product count
* Category diversity
* Bundle value

### Potential AOV Increase

BundleIQ estimates how bundles may improve Average Order Value (AOV) based on bundle composition.

### Recommendations

The system generates merchant recommendations such as:

* Promote high-performing bundles
* Improve medium-performing bundles
* Review low-performing bundles

### Alerts

Alerts identify:

* Low bundle value
* Low category diversity
* Weak bundle composition

---

## Tradeoffs

### Simplified Analytics

The Opportunity Score and AOV calculations are heuristic-based rather than derived from historical sales data.

This approach was chosen because sales history is not always available during initial bundle creation.

### Shopify Product Sync

BundleIQ reads product information from Shopify when merchants create bundles rather than maintaining a separate product catalog.

This reduces data duplication and keeps product information aligned with Shopify.

### Lightweight MVP Scope

The application focuses on bundle intelligence rather than inventory, order management, or advanced reporting.

This keeps the product focused on solving a single merchant workflow.

---

## What I Would Improve With More Time

If additional development time were available, I would implement:

### Real Sales Analytics

Use Shopify Orders API data to calculate:

* Bundle conversion rate
* Revenue contribution
* Actual AOV improvement

### Automated Bundle Suggestions

Recommend new bundles based on:

* Product categories
* Purchase patterns
* Sales performance

### Historical Trend Analysis

Track bundle performance over time using charts and trend reports.

### Merchant Notifications

Notify merchants when:

* Bundle performance drops
* High-performing bundles are detected
* New opportunities are discovered

### Advanced Dashboard

Add visual analytics including:

* Revenue trends
* Bundle performance charts
* Category performance comparisons

---

## Conclusion

NomadCrate and BundleIQ were designed to demonstrate Shopify theme development, embedded app architecture, product thinking, database design, and merchant-focused analytics.

The project emphasizes usability, bundle optimization, and actionable insights rather than simple CRUD functionality.

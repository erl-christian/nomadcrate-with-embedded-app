# APP_DECISIONS.md

## Store Concept

### NomadCrate

NomadCrate is a fictional Shopify store focused on travel, outdoor, and adventure essentials.

The brand targets travelers, hikers, digital nomads, and outdoor enthusiasts who need reliable gear for different types of adventures. Rather than presenting products as isolated purchases, NomadCrate promotes curated shopping experiences through recommended gear combinations and bundle-oriented purchasing.

A key differentiator of the storefront is the Smart Pack Builder, an interactive feature that helps customers discover products and assemble adventure-ready gear packs based on their needs.

---

# Embedded App Concept

## BundleIQ

BundleIQ is a Shopify Embedded App designed to help merchants create, evaluate, and optimize product bundles.

Many merchants create bundles using intuition or manual product selection without clear insight into bundle quality, cross-sell opportunities, or overall bundle effectiveness. BundleIQ addresses this challenge by providing scoring, analytics, and recommendations that help merchants make more informed merchandising decisions.

The application focuses on:

* Bundle creation and management
* Bundle opportunity scoring
* Bundle rankings
* Bundle health analysis
* Merchant recommendations
* Activity tracking

The goal is to transform bundle creation from a manual process into a data-informed workflow.

---

# Problem Being Solved

Product bundling is a common merchandising strategy, but merchants often lack visibility into the quality and effectiveness of the bundles they create.

Common challenges include:

* Determining whether a bundle provides enough value
* Identifying weak bundle combinations
* Measuring product diversity within bundles
* Discovering cross-sell opportunities
* Prioritizing which bundles should be promoted

BundleIQ provides actionable insights that help merchants create stronger bundles and improve bundle performance.

---

# Key Architecture Decisions

## Shopify Theme

The storefront was built using:

* Shopify Liquid
* CSS
* Minimal JavaScript

The theme prioritizes maintainability and merchant flexibility by leveraging Shopify's section-based architecture.

Custom sections include:

* Hero Section
* Featured Collections
* Adventure Categories
* Featured Products
* Smart Pack Builder

The Smart Pack Builder was selected as the primary interactive feature because it aligns with the store's adventure-focused brand while demonstrating custom storefront functionality beyond standard Shopify themes.

---

## Embedded App

The embedded application was built using:

* React
* React Router
* Vite
* Node.js
* Shopify App Bridge
* Shopify Admin API
* Drizzle ORM
* MySQL

The Shopify React Router template was used as the foundation because it provides:

* Shopify OAuth authentication
* Embedded app support
* Session management
* Shopify Admin integration

This allowed development efforts to focus on solving the merchant workflow problem rather than building authentication infrastructure from scratch.

---

## Authentication and Embedded App Flow

BundleIQ uses Shopify OAuth through Shopify's embedded app architecture.

Store owners and staff authenticate through Shopify Admin, and access to the application is managed through Shopify's authentication and session system.

A separate authentication system was intentionally not implemented because Shopify OAuth already provides secure authentication and authorization for embedded applications.

This decision reduces complexity and follows Shopify platform best practices.

---

# Database Design

BundleIQ uses MySQL with Drizzle ORM.

The database design separates bundle management, bundle-product relationships, and activity tracking into dedicated tables.

## bundles

Stores bundle information.

Fields:

* id
* name
* description
* score
* status
* createdAt
* updatedAt

---

## bundle_products

Stores products associated with a bundle.

Fields:

* id
* bundleId
* productHandle
* productTitle
* productPrice
* productType

Relationship:

* Many bundle products belong to one bundle

---

## activity_logs

Stores bundle activity history.

Fields:

* id
* bundleId
* action
* details
* createdAt

Relationship:

* Many activity logs belong to one bundle

The activity log provides an audit trail of bundle-related actions and supports future enhancements such as user attribution and collaboration tracking.

---

# Logic-Based Features

A primary requirement of the project was demonstrating functionality beyond basic CRUD operations.

BundleIQ includes several logic-driven features designed to support merchant decision-making.

## Opportunity Score

The Opportunity Score is BundleIQ's primary evaluation metric.

Bundles are scored using factors such as:

* Product count
* Bundle value
* Category diversity
* Cross-sell potential

The score allows merchants to quickly identify stronger bundle opportunities and prioritize bundles with greater merchandising potential.

---

## Bundle Rankings

Bundles are automatically ranked according to their Opportunity Score.

This allows merchants to quickly identify top-performing bundle opportunities without manually reviewing every bundle.

---

## Bundle Health Analysis

Bundle health evaluates bundle composition using:

* Product count
* Category coverage
* Bundle value

This provides merchants with a simple indicator of overall bundle quality.

---

## Potential AOV Increase

BundleIQ estimates potential Average Order Value (AOV) improvement based on the value and composition of a bundle.

The feature provides directional insights rather than exact revenue predictions.

---

## Recommendations

BundleIQ generates recommendations to guide merchant actions.

Examples include:

* Promote high-performing bundles
* Improve medium-performing bundles
* Review low-performing bundles
* Increase category diversity
* Add complementary products

---

## Alerts

Alerts help merchants identify potentially weak bundles.

Examples include:

* Low bundle value
* Limited category diversity
* Low Opportunity Score
* Small product count

---

# Tradeoffs

## Simplified Analytics

Opportunity Scores and AOV estimates are heuristic-based rather than derived from historical sales data.

This approach was intentionally chosen because merchants may want to evaluate bundles before sufficient sales history exists.

The MVP prioritizes immediate usability over complex analytical models.

---

## Shopify Product Synchronization

BundleIQ retrieves product information directly from Shopify during bundle creation instead of maintaining a separate product catalog.

Benefits include:

* Reduced data duplication
* Improved consistency
* Lower maintenance overhead

---

## Authentication Scope

A separate role-based access control (RBAC) system was intentionally not implemented.

Because BundleIQ operates as a Shopify Embedded App, authentication and access control are already handled through Shopify OAuth and Shopify Admin permissions.

The MVP focuses on bundle optimization and merchant workflow improvement rather than duplicating Shopify's user management functionality.

---

## Focused MVP Scope

BundleIQ intentionally focuses on bundle intelligence rather than inventory management, order management, or advanced reporting.

This decision keeps the application aligned with a single merchant workflow and demonstrates stronger product focus.

---

# What I Would Improve With More Time

If additional development time were available, the following enhancements would be implemented:

## Real Sales Analytics

Leverage Shopify Orders API data to calculate:

* Bundle conversion rates
* Revenue contribution
* Actual AOV improvement
* Bundle revenue performance

---

## Automated Bundle Suggestions

Generate bundle recommendations using:

* Product categories
* Product relationships
* Purchase behavior
* Historical sales data

---

## Historical Trend Analysis

Track bundle performance over time using:

* Trend reports
* Historical score changes
* Bundle lifecycle analytics

---

## Merchant Notifications

Notify merchants when:

* Bundle performance declines
* High-performing bundles emerge
* New opportunities are identified

---

## Advanced Dashboard Analytics

Introduce richer visual analytics including:

* Revenue trends
* Bundle performance charts
* Category performance comparisons
* Historical bundle rankings

---

# Conclusion

NomadCrate and BundleIQ were designed to demonstrate Shopify theme development, embedded application architecture, database design, merchant workflow optimization, and product thinking.

The project emphasizes actionable merchant insights, bundle optimization, and data-informed decision making rather than simple CRUD functionality.

The overall objective was to create a practical Shopify solution that provides measurable value to merchants while maintaining a focused and scalable MVP architecture.

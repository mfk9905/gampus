# UNILIVE V2 — Database Schema & Data Models

## 1. Models Summary
- `User`: Accounts, verification status, role, login lockout counters.
- `University`: Campuses, geo-coordinates, city/district metadata.
- `Listing`: Core marketplace listings (House, Room, Roommate, Furniture, House Package, House Handover). Includes `riskScore`, `featured`, `premiumUntil`.
- `ListingPackageItem`: Itemized items for furniture package listings.
- `SavedSearch`: Saved user search criteria for automated alert matching.
- `Notification`: User notifications (Search matches, price drops, status changes).
- `ListingPriceHistory`: Tracking price changes over time.
- `Review`: Peer reviews with communication, accuracy, and reliability ratings.
- `RoommateProfile`: Lifestyle preferences for smart matchmaking.
- `HandoverPassport`: Graduation handover verification passports.
- `Payment`: Premium listing payment transaction logs.
- `AuditLog`: Admin action history.
- `AnalyticsEvent`: Platform behavioral tracking events.
- `LoginAttempt`: Rate limit tracking logs.
- `Report`: Moderation flag reports.

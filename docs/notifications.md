# UNILIVE V2 — Notification System Architecture

## 1. Overview
The UNILIVE Notification Center delivers real-time retention and alert notifications to users via database storage and navbar UI drawer.

## 2. Notification Triggers
1. **Saved Search Alert**: When a new listing is published that matches a user's active saved search (`triggerSavedSearchNotifications`).
2. **Favorite Price Drop**: When a favorited listing price is lowered (`notifyFavoritePriceDrop`).
3. **Favorite Status Change**: When a favorited listing status changes to `SOLD`, `RENTED`, or `PASSIVE` (`notifyFavoriteStatusChange`).
4. **Contact Leads**: When a viewer clicks to view contact info.

## 3. Extensibility
The `NotificationService` abstraction allows wrapping with future providers:
- `EmailNotificationProvider` (Sendgrid / Resend)
- `WebNotificationProvider` (Web Push API)
- `PushNotificationProvider` (Firebase Cloud Messaging)

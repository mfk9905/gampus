# UNILIVE — Production Deployment Checklist

Follow this checklist before releasing UNILIVE to real students and external users.

---

## 1. Pre-Deployment Configuration & Secrets

- [ ] **PostgreSQL (Neon) Provisioned**:
  - [ ] Production database created on Neon.tech (Frankfurt / `eu-central-1`).
  - [ ] Pooled connection string copied to `DATABASE_URL` (`-pooler...` with `?pgbouncer=true`).
  - [ ] Direct connection string copied to `DIRECT_URL`.
- [ ] **JWT Key Generated**:
  - [ ] High entropy 64-character secret generated (e.g. `openssl rand -base64 48`).
  - [ ] Set to `JWT_SECRET`. Development secrets (`unilive-dev-jwt-secret...`) rejected.
- [ ] **Resend Configured**:
  - [ ] API Key created and set to `RESEND_API_KEY`.
  - [ ] Production sending domain verified in DNS (`EMAIL_FROM="UNILIVE <noreply@unilive.app>"`).
- [ ] **Cloudinary Configured**:
  - [ ] Account ready, cloud name, API key, and secret configured (`CLOUDINARY_*`).
  - [ ] Direct client-side unsigned uploads disabled.
- [ ] **Pusher Realtime Configured**:
  - [ ] App created, credentials set (`PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`).
- [ ] **Sentry Monitoring**:
  - [ ] Sentry DSN configured for runtime exception tracking.
- [ ] **Environment Validation**:
  - [ ] All required variables entered into Vercel Project Settings (Production Environment).
  - [ ] `ALLOW_PRODUCTION_SEED` set to `false` (or omitted).

---

## 2. Quality Gate & Codebase Verification

Run locally before deploying:

- [ ] `npx prisma validate` — Validates schema definition.
- [ ] `npm test` — Executes unit and security audit test suites.
- [ ] `npx tsc --noEmit` — Type-checks all TypeScript files without error.
- [ ] `npm run build` — Validates Next.js production build and page generation.

---

## 3. Database Migration

- [ ] Run migration deployment against the production database:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify that all tables and indexes are created:
  - [ ] `User`, `Listing`, `University`, `Review`, `Conversation`, `Message`, `Notification`
  - [ ] `RateLimitAttempt`, `LoginAttempt`, `AuditLog`, `HandoverPassport`
  - [ ] Multi-column indexes on `Listing (status, universityId)`, `Listing (status, price)`, `RateLimitAttempt (key, timestamp)`
- [ ] Verify universities seed is populated (run university seed script only if clean database):
  ```bash
  # Ensure ALLOW_PRODUCTION_SEED is false; only seed public universities reference data if needed
  ```

---

## 4. Cloudflare Edge Setup

- [ ] DNS A/CNAME record pointed to Vercel.
- [ ] Proxy status set to **Proxied** (Orange Cloud).
- [ ] SSL/TLS Encryption set to **Full (Strict)**.
- [ ] "Always Use HTTPS" enabled.
- [ ] Minimum TLS Version set to **TLS 1.2**.
- [ ] Cloudflare Bot Fight Mode enabled.

---

## 5. Deployment Execution (Vercel)

- [ ] Link GitHub repository to Vercel project.
- [ ] Configure Build Command:
  ```bash
  npx prisma generate && npx prisma migrate deploy && next build
  ```
- [ ] Deploy branch `main` to Production.
- [ ] Check build and deploy logs for any missing variables or runtime warnings.

---

## 6. Post-Deployment Smoke Test (Real User Verification)

Perform the following manual steps on the live production URL:

1. [ ] **Homepage & Public Pages**:
   - Access `https://unilive.app`. Confirm CSS, responsive layouts, university badges render.
   - Verify `robots.txt` (`https://unilive.app/robots.txt`) and `sitemap.xml`.
2. [ ] **Registration Flow**:
   - Register a new user with `@itu.edu.tr` or `@boun.edu.tr`.
   - Confirm automatic `studentVerified` badge assignment.
   - Verify cookie `auth_token` received with `HttpOnly`, `Secure`, `SameSite=Lax`.
3. [ ] **Login & Brute Force Rate Limiting**:
   - Test invalid password 5 times in succession.
   - Confirm rate limit countdown is displayed and HTTP 429 is returned.
4. [ ] **Password Reset Flow**:
   - Trigger "Şifremi Unuttum" from `/login`.
   - Verify Resend sends the email with reset token link.
   - Click link, set new password on `/reset-password?token=...`.
   - Confirm login with new password succeeds.
5. [ ] **Listing Creation & Cloudinary Upload**:
   - Upload a test photo (JPEG/PNG).
   - Create listing and verify published page displays image from `res.cloudinary.com`.
6. [ ] **Realtime Chat & Anti-Fraud Moderation**:
   - Start a conversation between two test accounts.
   - Send test message containing an IBAN: confirm filter blocks the message with security warning.
   - Send normal message: confirm instant delivery via Pusher.
7. [ ] **Admin RBAC Verification**:
   - Attempt to access `/admin` or `/api/admin/users` with non-admin student account.
   - Confirm access is denied with 403 Forbidden.
   - Log in with ADMIN account: confirm admin dashboard opens and user passwords/hashes are not displayed.
8. [ ] **Security Headers Audit**:
   - Run `curl -I https://unilive.app` and verify presence of:
     - `Strict-Transport-Security`
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `Content-Security-Policy`

---

## 7. Operational Readiness

- [ ] Sentry alerts routed to engineer on-call / email.
- [ ] Resend bounce and reputation alerts configured.
- [ ] Backup procedure documented and tested.
- [ ] Team aware of instant rollback button in Vercel.


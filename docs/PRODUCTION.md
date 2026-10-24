# UNILIVE — Production Operations & Architecture Manual

This document details the production architecture, hosting services, provisioning instructions, security policies, backup workflows, and incident response procedures for the **UNILIVE** platform.

---

## 1. Production Architecture Overview

UNILIVE is architected for high reliability, fast serverless scaling, and strict multi-tier data security:

```
[ User Browser / Client ]
           │
           ▼
[ Cloudflare Edge CDN & WAF ]
   • SSL/TLS Termination (Strict)
   • DDoS Protection & Bot Management
   • Edge Security Headers & Rate Limiting
           │
           ▼
[ Vercel Serverless Hosting ]
   • Next.js 16 App Router (Node.js runtime)
   • Serverless API Routes & SSR Handlers
   • Environment Isolation & Edge Middleware
           │
    ┌──────┴───────────────────────────────────────┐
    │                                              │
    ▼                                              ▼
[ Neon Serverless PostgreSQL ]            [ External SaaS Providers ]
   • DATABASE_URL (Pooled / PgBouncer)       • Cloudinary (Media CDN & Storage)
   • DIRECT_URL (Direct for Migrations)      • Resend (Transactional Email)
   • Automated Point-in-Time Recovery        • Pusher Channels (Real-time Chat)
                                             • Sentry (Telemetry & Error Tracing)
```

---

## 2. Infrastructure Setup & Service Configuration

### 2.1 Neon PostgreSQL Provisioning
1. Create a project on [Neon.tech](https://neon.tech).
2. Select your target region (e.g. Frankfurt `eu-central-1` for lowest latency to Turkey/Europe).
3. Copy the two connection strings:
   - **Pooled connection string** (ends with `-pooler...`): Set as `DATABASE_URL`.
   - **Direct connection string** (without `-pooler`): Set as `DIRECT_URL`.
4. Ensure connection pooling is active. Neon automatically handles connection scaling for Vercel serverless invocations.

### 2.2 Prisma Migration Workflow
In production, **never** execute `prisma db push` or raw dev resets. Always run:

```bash
# Apply pending migration SQLs safely to production
npx prisma migrate deploy
```

In Vercel, you can configure your custom build command:
```bash
npx prisma generate && npx prisma migrate deploy && next build
```
This guarantees that database migrations succeed before traffic is routed to the new deployment.

### 2.3 Resend (Transactional Email)
1. Sign up on [Resend.com](https://resend.com) and create an API Key.
2. Add and verify your domain (e.g. `unilive.app` or `mail.unilive.app`) via DNS records:
   - TXT (DKIM)
   - MX (Feedback / Inbound)
   - TXT (SPF)
3. Set `RESEND_API_KEY` and `EMAIL_FROM="UNILIVE <destek@unilive.app>"` in production environment variables.

### 2.4 Cloudinary (Image Storage & CDN)
1. Create a Cloudinary account.
2. Retrieve `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. In Cloudinary Console -> Settings -> Security:
   - Disable client-side direct uploads (all uploads in UNILIVE are validated server-side in `/api/upload` checking magic bytes, MIME types, and 5MB limit).
   - Ensure PDF/SVG delivery is restricted.
4. Next.js image optimization is pre-configured in `next.config.ts` for `res.cloudinary.com`.

### 2.5 Pusher (Real-Time In-App Messaging)
1. Create a Pusher Channels app (Cluster `eu`).
2. Add credentials:
   - `PUSHER_APP_ID`
   - `PUSHER_SECRET`
   - `NEXT_PUBLIC_PUSHER_KEY`
   - `NEXT_PUBLIC_PUSHER_CLUSTER`
3. Client uses `pusher-js` subscribing to private user channels (`private-user-${userId}`) authenticated via `/api/messages/pusher-auth`.

### 2.6 Sentry (Error Telemetry)
1. Create a project in [Sentry.io](https://sentry.io).
2. Configure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
3. `src/lib/logger.ts` and `src/app/global-error.tsx` report production unhandled exceptions to Sentry while redacting tokens, passwords, and PII.

---

## 3. Cloudflare Configuration

Place Cloudflare in front of the Vercel production domain:

1. **DNS Settings**:
   - Proxy status: **Proxied (Orange Cloud)**.
   - Root CNAME: pointing to `cname.vercel-dns.com`.
2. **SSL / TLS**:
   - Mode: **Full (Strict)**.
   - Edge Certificates: Enable **Always Use HTTPS**, **Minimum TLS Version 1.2**, and **TLS 1.3**.
3. **Security / WAF**:
   - Enable Cloudflare Bot Fight Mode.
   - Configure Rate Limiting rule for `/api/auth/*` (e.g. max 15 requests per minute per IP).
   - Add security header forwarding: Cloudflare passes `CF-Connecting-IP`, which UNILIVE's `getClientIp()` inspects for rate limiting.

---

## 4. Production Environment Variables Reference

| Variable Name | Environment | Required | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Server | Yes | Set to `production`. |
| `DATABASE_URL` | Server | Yes | Neon pooled PostgreSQL connection string with `pgbouncer=true`. |
| `DIRECT_URL` | Server | Yes | Neon direct PostgreSQL connection string for Prisma migrations. |
| `JWT_SECRET` | Server | Yes | 32+ character high-entropy secret string for HS256 tokens. |
| `APP_URL` | Server | Yes | Canonical public URL (e.g. `https://unilive.app`). |
| `NEXT_PUBLIC_APP_URL` | Client/Server | Yes | Public URL for client-side links and meta tags. |
| `RESEND_API_KEY` | Server | Yes | Resend production API key (`re_...`). |
| `EMAIL_FROM` | Server | Yes | Sender address (e.g. `UNILIVE <noreply@unilive.app>`). |
| `CLOUDINARY_CLOUD_NAME` | Server | Yes | Cloudinary cloud identifier. |
| `CLOUDINARY_API_KEY` | Server | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Server | Yes | Cloudinary private API secret (Never expose to client). |
| `PUSHER_APP_ID` | Server | Yes | Pusher application ID. |
| `PUSHER_SECRET` | Server | Yes | Pusher secret key. |
| `NEXT_PUBLIC_PUSHER_KEY` | Client/Server | Yes | Pusher public API key. |
| `NEXT_PUBLIC_PUSHER_CLUSTER`| Client/Server | Yes | Pusher cluster (e.g. `eu`). |
| `SENTRY_DSN` | Server | Optional | Sentry server DSN. |
| `NEXT_PUBLIC_SENTRY_DSN` | Client/Server | Optional | Sentry client DSN. |
| `ALLOW_PRODUCTION_SEED` | Server | Guard | Must **NEVER** be true in production. Guards `prisma/seed.ts`. |

---

## 5. Security & Rate Limiting Architecture

1. **Authentication**:
   - Tokens signed with `HS256` and verified via `jose`.
   - Stored strictly in `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` cookies.
   - Cookie name: `auth_token`. Inactive tokens invalidated upon logout or password reset.
2. **Rate Limiting**:
   - Implemented in `src/lib/rate-limit/index.ts` utilizing database table `RateLimitAttempt`.
   - Operates across multi-instance serverless deployments without Redis.
   - Login lockout: 5 consecutive failed attempts trigger a 5-minute lockout per account/IP.
   - Multi-tier IP throttling: 5 failed attempts (1m block), 10 attempts (5m block), 20 attempts (15m block).
   - Sensitive endpoints protected: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/upload`, `/listings` (write), `/reviews`, `/reports`, `/messages`.
3. **Data Minimization & IDOR**:
   - Admin routes guarded by `requireAdmin()`.
   - Passwords and reset tokens strictly excluded from API outputs.
   - User phone numbers masked on public roommate/listing endpoints unless explicitly enabled by user (`allowPhoneCalls`).
4. **Chat Moderation & Anti-Fraud**:
   - Messages scanned in `chat-moderation-service.ts` for IBANs, phone numbers, WhatsApp evasion, and profanity prior to delivery.

---

## 6. Backup & Recovery Strategy

1. **Neon Automated Backups**:
   - Neon maintains continuous Write-Ahead Log (WAL) archiving allowing Point-in-Time Recovery (PITR) up to 7-30 days depending on plan.
   - Instant branch creation allows testing rollbacks or restoring state into an isolated branch within seconds.
2. **Manual Snapshot Command**:
   ```bash
   pg_dump "$DIRECT_URL" -Fc -f "unilive_backup_$(date +%Y%m%d_%H%M%S).dump"
   ```
3. **Database Restore Command**:
   ```bash
   pg_restore -d "$DIRECT_URL" --clean --no-owner "unilive_backup_TARGET.dump"
   ```

---

## 7. Rollback & Incident Response Runbook

### Rollback Procedure
1. **Instant Vercel Rollback**:
   - In Vercel Dashboard -> Project -> Deployments -> locate the previous stable build.
   - Click `...` -> `Instant Rollback`. Traffic cuts over within seconds.
2. **Database Schema Rollback**:
   - If a migration caused failures, assess if backwards-compatible.
   - If restoration is required, restore the pre-migration Neon branch or snapshot.

### Incident Scenarios

#### A. Database Connection Spike / Pool Exhaustion
- **Symptom**: `PrismaClientInitializationError: Can't reach database server`.
- **Action**: Verify `DATABASE_URL` uses the pooled endpoint (`-pooler.`) with `?pgbouncer=true&connection_limit=10`. Neon serverless pooler handles 10,000+ client connections.

#### B. Rate Limiting Attack / Brute Force Surge
- **Symptom**: High 429 rate in analytics.
- **Action**: Check Cloudflare Security Analytics. Enable Cloudflare Under Attack mode or add an IP/Country challenge rule targeting `/api/auth/*`.

#### C. Compromised API Key
- **Action**:
  1. Rotate key immediately in provider dashboard (Cloudinary, Resend, or Pusher).
  2. Update Vercel Environment Variables.
  3. Redeploy application to apply updated secrets.


# UNILIVE V2 — Security Audit & Controls

## 1. Authentication & Rate Limiting
- **Password Policy**: Minimum 8 characters. Hashed using `bcrypt` (10 rounds).
- **Brute-Force Protection**:
  - IP-based rate limiting via `checkLoginRateLimit` (5 fails = 1 min delay, 10 fails = 5 min delay, 20 fails = 15 min delay).
  - User account temporary lockout after 5 consecutive failed attempts.
  - Counter reset on successful login.
- **Account Enumeration Prevention**:
  - All login errors return generic message: `"E-posta veya şifre hatalı."`
  - Forgot password endpoint responds with identical generic confirmation regardless of email existence.

## 2. Authorization & IDOR Protection
- **Session Tokens**: Signed using `jose` HS256 JWT, stored in `HttpOnly`, `SameSite: Lax` cookies (`unilive_token`).
- **Resource Ownership Checks**:
  - Mutation APIs (`DELETE` listing, `PATCH` status, `DELETE` saved search, `POST` payments) strictly verify `userId === session.userId`.
- **Role-Based Access Control (RBAC)**:
  - Admin endpoints (`/api/admin/*`, `/admin`) verify `session.role === 'ADMIN'`.

## 3. Moderation & Risk Scoring
- **Automated Keyword Detection**:
  - Content evaluated against suspicious keywords (`kapora`, `IBAN`, `western union`, `acil ödeme`, etc.).
  - Generates `riskScore` (0-100). Scores >= 50 flag listing as `"🚨 Riskli İlan"` in Admin Moderation.

## 4. Trust Score 2.0 & Review Abuse Controls
- Users cannot submit reviews for themselves.
- Review rate limiting: Max 1 review per 24 hours between the same user pair.

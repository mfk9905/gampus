# UNILIVE V2 — Automated Testing & Verification Suite

## 1. Test Architecture
UNILIVE V2 incorporates unit and service integration tests for critical business logic:
- **Trust Score 2.0 Calculation**
- **Roommate Lifestyle Matchmaking**
- **Brute-Force Rate Limiting**
- **Moderation Suspicious Keyword Detection**

## 2. Running Verification Suite
```bash
# TypeScript Type Check
npx tsc --noEmit

# Production Build Check
npm run build
```

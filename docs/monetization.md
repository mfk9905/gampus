# UNILIVE V2 — Monetization & Revenue Models

## 1. Premium Listing Packages
Sellers can boost their listings to appear as **🔥 ÖNE ÇIKAN** on campus discovery feeds:

- **3 Günlü Öne Çıkar**: 49 TL
- **7 Günlük Öne Çıkar**: 79 TL (Popular)
- **15 Günlük Öne Çıkar**: 149 TL
- **30 Günlük Öne Çıkar**: 249 TL

*Configured centrally in `src/config/constants.ts`.*

## 2. Payment Gateway Abstraction
Payment transactions are managed through `PaymentService`:
- `PaymentProvider`: Interface for payment processing.
- `MockPaymentProvider`: Default implementation supporting test purchases and status logging (`PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`).
- Ready for seamless plug-in of real Turkish payment gateways (Iyzico, Paytr).

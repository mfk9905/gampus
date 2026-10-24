# UNILIVE V2 — PostgreSQL & PostGIS Migration Strategy

## 1. Migration Strategy
While SQLite is used for MVP development, UNILIVE V2 is designed for zero-friction migration to production PostgreSQL with PostGIS geo-spatial queries.

## 2. Steps to Migrate
1. **Update `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **PostGIS Integration**:
   - Replace manual Haversine distance calculations in `src/lib/utils/distance.ts` with native PostGIS `ST_DistanceSphere(ST_MakePoint(lon, lat), ST_MakePoint(uni_lon, uni_lat))` queries.
3. **Execute Migration**:
   ```bash
   npx prisma migrate dev --name init_postgresql
   ```

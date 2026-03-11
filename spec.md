# Yes Madam Salon Inventory

## Current State
Full-stack app with Motoko backend and React frontend. All data is currently stored in browser localStorage because the backend lacked stable storage -- causing data loss on page refresh from a different device or after cache clear. Backend exists with basic CRUD but uses non-stable Map structures and is missing many entities (Equipment, Attendance, CashLedger, HomeServiceSettlement, rack numbers, staff mobile, etc.).

## Requested Changes (Diff)

### Add
- Stable storage in Motoko backend for all entities so data persists permanently on the server
- Backend APIs for all missing entities: EquipmentItems, EquipmentCheckouts, Attendance, CashEntries, HomeServiceSettlements
- Staff mobile field in backend
- Product rackNumber field in backend
- deleteUsageRecord API

### Modify
- Rewrite main.mo with stable var arrays + preupgrade/postupgrade migration pattern
- All frontend pages to call backend actor instead of localStorage functions
- Keep localStorage as zero-state fallback only during loading

### Remove
- All localStorage-based data persistence (localStorage.ts functions should become backend calls)
- Pre-seeded categories (user wants to manage their own)

## Implementation Plan
1. Rewrite main.mo with stable var arrays for: categories, products, staff, usageRecords, equipmentItems, equipmentCheckouts, attendanceRecords (flattened), cashEntries, homeServiceSettlements -- with preupgrade/postupgrade hooks
2. Add all missing CRUD APIs
3. Update frontend: replace all localStorage calls with backend actor calls (async/await pattern), show loading states while fetching
4. Remove dependency on localStorage for data (keep only for UI state if needed)
5. Validate build and deploy

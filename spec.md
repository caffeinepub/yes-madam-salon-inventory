# Yes Madam Salon Inventory

## Current State

Full-stack salon app with Motoko backend and React frontend. However, the frontend is using **localStorage** for all data storage instead of the Motoko backend. This means:
- Data only exists on the device/browser where it was entered
- Boss report link shows no data on other devices
- The backend canister exists but is not being used by the frontend

The backend has APIs for: Categories, Products, Staff, UsageRecords, Equipment, Attendance, CashLedger, HomeServiceSettlements. It is missing: Pack Tracker functions, deleteAllStaff, deleteAllProducts, updateStaffPin, bulkAddStaff, Staff.pinned field, Product.openingDate field.

## Requested Changes (Diff)

### Add
- All missing backend APIs: Pack Tracker (addPackItem, deletePackItem, getPackItems, addPackArrival, getPackArrivals, addPackDistribution, getPackDistributions, deletePackDistribution), deleteAllStaff, deleteAllProducts, updateStaffPin, bulkAddStaff
- Staff.pinned field in backend
- Product.openingDate field in backend
- New `backendService.ts` that wraps the ICP actor calls
- Loading states in BossReport page

### Modify
- `dataService.ts` to call backend APIs instead of localStorage for Categories, Products, Staff, UsageRecords, Equipment (checkout/items), Attendance, CashLedger, HomeServiceSettlements, PackTracker
- `useQueries.ts` hooks to work with async backend calls
- `AppLayout.tsx`: Change button label from "Boss ka Link" to "Other Device Link"
- `BossReport.tsx`: Add proper loading/error states

### Remove
- localStorage dependency for all core data (Categories, Products, Staff, UsageRecords, Equipment, Attendance, Cash, Pack Tracker)

## Implementation Plan

1. Regenerate Motoko backend with all missing features (openingDate, pinned, pack tracker, deleteAll, bulkAddStaff, updateStaffPin)
2. Create `src/frontend/src/lib/backendService.ts` -- thin wrapper over ICP actor
3. Update `dataService.ts` to re-export from backendService instead of localStorage
4. Update `useQueries.ts` -- all queries become async, mutations call backend
5. Fix AppLayout button label
6. Fix BossReport loading state
7. Validate and deploy

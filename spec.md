# Yes Madam Salon Inventory

## Current State
- Products have openingStock and openingDate fields but updateProduct backend function does NOT allow editing these fields
- Pack Tracker is a "checkout/return" system (take and return model with Full/Half packs)
- Pack Tracker data stored in localStorage via dataService

## Requested Changes (Diff)

### Add
- `updateProductOpening(id, openingStock, openingDate)` backend function to update opening stock and date
- Products page: edit button that opens a form to update opening stock + opening date (and other fields)
- Pack Tracker: "Maal Aaya" (Stock Arrival) section - log when stock arrived, how much, with date
- Pack Tracker: "Kisne Kitna Liya" (Distribution) section - log which staff took how much quantity, with date/time
- Pack Tracker: New types: PackArrival (id, itemId, quantity, date, notes) and PackDistribution (id, itemId, staffId, quantity, date, time, notes)

### Modify
- Pack Tracker completely redesigned: remove old checkout/return model, replace with arrival log + distribution log
- Products edit form to include openingStock and openingDate fields
- backend updateProduct to also accept openingStock and openingDate params

### Remove
- Pack Tracker: checkout/return model (takenAt, returnedAt, packStatus full/half fields)
- Old PackCheckout type and related functions

## Implementation Plan
1. Update backend `updateProduct` to accept openingStock and openingDate params
2. Update backend.d.ts accordingly
3. Update Products page edit modal to include opening stock + opening date fields
4. Redesign Pack Tracker types: PackItem, PackArrival, PackDistribution
5. Update dataService for new pack tracker functions
6. Rewrite PackTracker.tsx with two sections: Stock Arrivals + Distribution Log

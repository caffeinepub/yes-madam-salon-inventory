# Yes Madam Salon Inventory

## Current State
Full-stack salon inventory app with: Dashboard, Usage Entry, Usage History, Charts, Categories, Products, Staff, Attendance, Equipment Checkout, Cash Ledger.
- Equipment page has search in checkout history table, but NOT in Equipment Items list
- Staff page already has search bar
- Categories page has single-add form only, no bulk paste
- Dashboard shows stats, charts, recent usage table, but no live clock and no quick usage entry
- AppLayout sidebar has no clock widget

## Requested Changes (Diff)

### Add
1. **Live Clock in Sidebar** -- A live digital clock widget at the bottom of the sidebar (above footer), showing current time HH:MM:SS updated every second using setInterval
2. **Equipment Items search** -- Search bar above the Equipment Items list in the "Equipment List" card (right side of Equipment page), to filter items by name
3. **Categories Bulk Paste** -- A second tab or section in the "Add Category" card: "Paste Multiple" mode where user can paste a newline-separated or comma-separated list of category names, preview them, and add all at once
4. **Dashboard Quick Usage Entry** -- A compact "Quick Usage Entry" card on the Dashboard page with the same form fields (product searchable dropdown, staff searchable dropdown, quantity, optional client name, date auto-today) and a submit button. Successful submission invalidates usage queries and shows toast.

### Modify
- AppLayout sidebar: add a LiveClock component between nav and footer
- Equipment.tsx: add equipmentItemSearch state and filter equipmentItems list
- Categories.tsx: add a "Paste Multiple" panel with textarea, parse on newline/comma, preview list with remove-per-item, then "Add All" button that calls addMutation in sequence
- Dashboard.tsx: add QuickUsageEntry card below the top stats section (before charts)

### Remove
- Nothing removed

## Implementation Plan
1. Create a LiveClock component (inline in AppLayout or as separate file) using useEffect + setInterval, display HH:MM:SS in sidebar
2. Equipment.tsx: add `equipmentItemSearch` state, filter `equipmentItems` by that search, show a search input above the items list in "Equipment List" card
3. Categories.tsx: add `pasteMode` toggle button in "Add Category" card header, show textarea when in paste mode, parse input on newline+comma, show preview chips with remove button each, "Add All" button to batch-add
4. Dashboard.tsx: import needed hooks (useProducts, useStaff, useAddUsageRecord, useCategories), add QuickUsageEntry section with product/staff searchable popovers, quantity input, submit handler -- positioned before charts section

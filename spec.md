# Yes Madam Salon Inventory

## Current State
Full-stack salon management app with Staff, Products, Usage Entry, and other modules. Staff has a 'Sab Staff Hatao' (clear all) button. Products does not. Each staff and product has a numeric `id` (bigint) but no human-readable short code is displayed or searchable.

## Requested Changes (Diff)

### Add
- 'Sab Products Hatao' button in Products page -- same pattern as 'Sab Staff Hatao' in Staff page (loop through all, delete one by one, confirm dialog)
- Short codes for all staff: format `S` + id padded to 3 digits (e.g., S001, S002). Display the code in the staff table as a column.
- Short codes for all products: format `P` + id padded to 3 digits (e.g., P001, P002). Display in products table as a column.
- In Usage Entry and Dashboard quick-entry: the product and staff search/select dropdowns should also match by code. User types 'S003' and the matching staff name appears. User types 'P012' and the matching product appears.
- When adding a new staff/product, once saved, show/display their generated code so user knows it.

### Modify
- Products.tsx: add 'Sab Products Hatao' button near the Add Product button area.
- Staff.tsx: show code column (S001 etc.) in the table.
- Products.tsx: show code column (P001 etc.) in the table.
- UsageEntry.tsx: update searchable dropdowns for both staff and products to also match against the generated code.
- Dashboard.tsx: update quick-entry dropdowns similarly if they have staff/product search.

### Remove
- Nothing removed.

## Implementation Plan
1. Products.tsx: Add 'Sab Products Hatao' button -- confirm dialog, loop delete all products.
2. Create a utility function `staffCode(id: bigint)` → `S` + Number(id).toString().padStart(3,'0') and `productCode(id: bigint)` → `P` + Number(id).toString().padStart(3,'0')`.
3. Staff.tsx: Add 'Code' column in the table showing the staff code. Make it visible and easy to read.
4. Products.tsx: Add 'Code' column in the table showing the product code.
5. UsageEntry.tsx: In product and staff dropdowns/search, filter by both name and code so typing the code matches the entry.
6. Dashboard.tsx: Same code-based filtering for any staff/product selects.
7. After adding a staff/product, toast message should show the generated code (e.g., 'Priya Sharma added -- Code: S007').

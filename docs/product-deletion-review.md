# Product Deletion Review

**Date:** 2024-05-23
**Reviewer:** Jules

## Overview
This document summarizes the behavior of product deletion in the application, specifically regarding its impact on existing sales data and database integrity.

## Findings

1.  **Soft Delete Mechanism**
    - When a product is deleted via the client (using the `deleteProduct` action), it is **soft-deleted**.
    - The `is_active` flag in the `products` table is set to `false`.
    - The product record remains in the database.

2.  **Database Integrity**
    - Because the product record persists, there are **no foreign key constraint violations**.
    - Existing sales records in the `sales` and `saleItems` tables continue to reference the valid (though inactive) product ID.
    - No database errors or conflicts occur during deletion.

3.  **Sales History Preservation**
    - The `saleItems` table stores a snapshot of the product details at the time of sale:
        - `product_name`
        - `barcode` (nullable)
        - `unit_price`
    - This ensures that historical sales reports and receipts display correct information even after the product is "deleted".

4.  **Limitations**
    - **Barcode Reuse:** The barcode of a soft-deleted product remains reserved in the database due to the unique constraint on the `barcode` column.
    - Consequently, you cannot create a new product with the same barcode as a deleted product unless the original product is hard-deleted or its barcode is cleared.

## Conclusion
The current implementation of product deletion is safe and preserves data integrity. It does not cause errors or conflicts with existing sales. The primary side effect is the inability to reuse barcodes of deleted products without manual intervention or code modification.

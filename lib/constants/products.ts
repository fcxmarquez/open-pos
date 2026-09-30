export const PRODUCTS_PAGE_SIZE = 100;
export const PLU_CODE_REGEX = /^\d{4}$/;

/**
 * POS typeahead cap. A 2-character catalog search matches most products
 * (measured on the development branch: "co" → 2,629 of 3,332 active rows).
 * Postgres still scans them in ~3ms; the cost is shipping and rendering
 * every match. 50 rows is enough to scroll in the dropdown and cuts that
 * payload by about 98% for those short queries.
 */
export const PRODUCT_SEARCH_RESULT_LIMIT = 50;

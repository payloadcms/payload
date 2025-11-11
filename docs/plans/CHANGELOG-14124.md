# Fix: Pagination with Array Field Sorting

**Issue:** #14124

## Problem

Paginated `payload.find()` queries with sorting on array field columns returned incomplete results and duplicated documents across pages.

Example: Requesting 5 documents per page would return only 2-3 documents, with duplicates appearing across different pages.

## Root Cause

When sorting on array fields, the database performs a LEFT JOIN with array field tables, multiplying parent rows by the number of array items:

- 10 parent documents × 3 array items each = 30 rows returned
- `SELECT DISTINCT ON (id, sort_column)` keeps multiple rows per parent
- `LIMIT 5` applies to these 30 multiplied rows → only ~2 parent documents returned

The pagination LIMIT was applied before de-duplication, causing incomplete pages.

## Solution

Modified `selectDistinct` query to use MIN/MAX aggregation on array field sort columns when detected, with GROUP BY on parent ID. This ensures exactly one row per parent document before LIMIT is applied.

**Strategy:**

- Ascending sorts: Use `MIN()` (smallest array value for ordering)
- Descending sorts: Use `MAX()` (largest array value for ordering)
- GROUP BY parent ID collapses multiplied rows to one-per-parent
- LIMIT then applies correctly to parent document count

## Files Changed

- `packages/drizzle/src/queries/getTableColumnFromPath.ts` - Track array field traversal with `isArrayField` flag
- `packages/drizzle/src/queries/buildOrderBy.ts` - Pass array field metadata through query pipeline
- `packages/drizzle/src/queries/selectDistinct.ts` - Apply MIN/MAX aggregation for array field sorts
- `packages/drizzle/src/find/findMany.ts` - Wire orderBy metadata to selectDistinct

## Testing

- Added 3 comprehensive tests in `test/sort/int.spec.ts` for array field pagination scenarios
- All existing tests pass (no regressions)
- Verified with PostgreSQL, SQLite adapters
- MongoDB adapter unaffected (uses different aggregation pipeline)

## Breaking Changes

None. This is a bug fix that makes queries return correct results.

## Migration

Automatic. Queries will now return complete paginated results without duplicates.

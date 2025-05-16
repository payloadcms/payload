# Fix resetColumnsState Function

## Problem

The `resetColumnsState` function was using `setActiveColumns` to reset columns, which wasn't correctly restoring the default columns configuration.

## Solution

- Modified `resetColumnsState` to directly use `refineListData` with the default columns
- Fixed `setActiveColumns` to properly handle column activation while preserving column order
- Simplified the implementation to avoid introducing new functions
- Updated documentation in react-hooks.mdx to reflect these changes

This fix ensures that the restore columns functionality works correctly while keeping the existing API design intact. The changes in this branch are kept minimal to focus solely on fixing the issue with `resetColumnsState`.

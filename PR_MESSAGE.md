# Fix setActiveColumns to maintain column order and preserve active states

## Problem

The implementation of `setActiveColumns` was changed to simply wrap `setColumns`, which caused two issues:

1. It overrode the column order instead of preserving it
2. It changed the active state of ALL columns, not just the ones in the input array

The original behavior of `setActiveColumns` was to specifically set the active state of only the columns specified in the input array, while preserving both the column order and the active state of columns not mentioned.

## Solution

- Updated `setActiveColumns` to take the current columns from the query
- Modified the implementation to only change active state for columns in the input array
- Preserved the existing order of columns and the active state of columns not mentioned
- Added comprehensive documentation in code comments and type definitions
- Added a test to verify both aspects of the behavior

This is a backward compatibility fix that ensures the original function behavior is maintained while still allowing the `setColumns` function to serve its distinct purpose of replacing the entire column list.

## Changes

- Modified the `setActiveColumns` implementation in TableColumnsProvider
- Updated documentation in type definitions and function comments
- Added test component for e2e testing of the functionality
- Enhanced the e2e test to verify both column order preservation and selective active state modification

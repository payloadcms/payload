'use client'

import type { Condition } from 'payload'

/**
 * Path-valued condition that reads from `siblingData` rather than top-level
 * `data`. Used for fields nested under array rows, where each row evaluates
 * its own sibling's `enabled` flag.
 */
export const showWhenRowEnabled: Condition = (_data, siblingData) => {
  return Boolean((siblingData as { enabled?: boolean })?.enabled)
}

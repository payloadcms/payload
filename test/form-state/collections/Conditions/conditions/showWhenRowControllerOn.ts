'use client'

import type { Condition } from 'payload'

/**
 * Path-valued condition that reads from `siblingData` rather than top-level
 * `data`. Used for fields nested under array rows, where each row evaluates
 * its own sibling's controller flag.
 */
export const showWhenRowControllerOn: Condition = (_data, siblingData) => {
  return Boolean((siblingData as { rowController?: boolean })?.rowController)
}

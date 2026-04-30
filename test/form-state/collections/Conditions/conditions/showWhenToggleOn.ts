'use client'

import type { Condition } from 'payload'

/**
 * Path-valued admin.condition: depends on a top-level boolean. Phase 5.4b
 * routes path-valued refs to the client import map so they evaluate
 * synchronously on every keystroke without a server roundtrip.
 */
export const showWhenToggleOn: Condition = (data) => {
  return Boolean((data as { toggle?: boolean })?.toggle)
}

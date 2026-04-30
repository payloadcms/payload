'use client'

import type { Condition } from 'payload'

/**
 * Path-valued condition: depends on a top-level boolean. Bundles to the
 * client and evaluates synchronously per keystroke.
 */
export const showWhenCheckboxOn: Condition = (data) => {
  return Boolean((data as { topLevelCheckbox?: boolean })?.topLevelCheckbox)
}

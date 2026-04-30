'use client'

import type { Condition } from 'payload'

/**
 * Path-valued condition keyed off a top-level select. Demonstrates a non-
 * boolean condition input with multiple downstream fields gated by the same
 * value.
 */
export const showWhenSelectIsB: Condition = (data) => {
  return (data as { topLevelSelect?: string })?.topLevelSelect === 'optionB'
}

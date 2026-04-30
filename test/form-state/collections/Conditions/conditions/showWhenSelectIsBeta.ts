'use client'

import type { Condition } from 'payload'

/**
 * Path-valued condition keyed off a top-level select field. Demonstrates
 * non-boolean condition input + multiple downstream fields gated by the
 * same condition value.
 */
export const showWhenSelectIsBeta: Condition = (data) => {
  return (data as { tier?: string })?.tier === 'beta'
}

'use client'

import type { Condition } from 'payload'

export const showAdvanced: Condition = (data, _siblingData) => {
  return Boolean((data as { showAdvanced?: boolean })?.showAdvanced)
}

'use client'

import type { Condition } from 'payload'

export const showWhenChecked: Condition = (data) => {
  return Boolean((data as { showConditionalFields?: boolean })?.showConditionalFields)
}

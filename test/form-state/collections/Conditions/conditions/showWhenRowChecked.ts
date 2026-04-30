'use client'

import type { Condition } from 'payload'

export const showWhenRowChecked: Condition = (_data, siblingData) => {
  return Boolean((siblingData as { showConditionalFields?: boolean })?.showConditionalFields)
}

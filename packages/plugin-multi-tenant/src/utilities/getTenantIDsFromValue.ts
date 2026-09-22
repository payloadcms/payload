import type { Tenant } from '../types.js'

import { extractID } from './extractID.js'

export const getTenantIDsFromValue = (value: unknown): string[] => {
  if (value === undefined || value === null) {
    return []
  }

  return (Array.isArray(value) ? value : [value]).map((entry) => {
    const id = entry === null || entry === undefined ? undefined : extractID(entry as Tenant)

    return typeof id === 'number' || typeof id === 'string' ? String(id) : ''
  })
}

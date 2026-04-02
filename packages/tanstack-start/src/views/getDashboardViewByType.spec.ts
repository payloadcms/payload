import { describe, expect, it } from 'vitest'

import { DashboardView } from './Dashboard/index.js'
import { getDashboardViewByType } from './getDashboardViewByType.js'

describe('getDashboardViewByType', () => {
  it('should return the TanStack dashboard view component for dashboard routes', () => {
    expect(getDashboardViewByType('dashboard')).toBe(DashboardView)
  })

  it('should return undefined for non-dashboard TanStack view types', () => {
    expect(getDashboardViewByType('document')).toBeUndefined()
    expect(getDashboardViewByType('list')).toBeUndefined()
    expect(getDashboardViewByType(undefined)).toBeUndefined()
  })
})

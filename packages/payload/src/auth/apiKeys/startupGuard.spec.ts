import { describe, expect, it } from 'vitest'

import { shouldRunAPIKeyStartupGuard } from './startupGuard.js'

describe('shouldRunAPIKeyStartupGuard', () => {
  it('should run by default', () => {
    expect(shouldRunAPIKeyStartupGuard({})).toBe(true)
  })

  it('should skip when disableAPIKeyStartupGuard is set', () => {
    expect(shouldRunAPIKeyStartupGuard({ disableAPIKeyStartupGuard: true })).toBe(false)
  })

  it('should skip when the database is not being connected', () => {
    expect(shouldRunAPIKeyStartupGuard({ disableDBConnect: true })).toBe(false)
  })
})

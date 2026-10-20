import { describe, expect, it } from 'vitest'

import { assertPnpmVersion } from './assertPnpmVersion.js'

describe('assertPnpmVersion', () => {
  it('should throw below 11.28.6', () => {
    expect(() => assertPnpmVersion({ version: '11.9.0' })).toThrow(/11\.28\.6/)
  })

  it('should pass at 11.28.6 and above', () => {
    expect(() => assertPnpmVersion({ version: '11.28.6' })).not.toThrow()
    expect(() => assertPnpmVersion({ version: '12.14.0' })).not.toThrow()
  })
})

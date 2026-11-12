import minimist from 'minimist'
import { describe, expect, it } from 'vitest'

import { getForceAcceptWarning } from './parseMigrateArgs.js'

describe('getForceAcceptWarning', () => {
  it.each([
    { argv: ['migrate'], expected: false },
    { argv: ['migrate', '--force-accept-warning'], expected: true },
    { argv: ['migrate', '--force-accept-warning=true'], expected: true },
    { argv: ['migrate', '--forceAcceptWarning'], expected: true },
    { argv: ['migrate', '--no-force-accept-warning'], expected: false },
    { argv: ['migrate', '--force-accept-warning=false'], expected: false },
  ])('should return $expected for $argv', ({ argv, expected }) => {
    expect(getForceAcceptWarning(minimist(argv))).toBe(expected)
  })

  it('should return true when forceAcceptWarning is passed programmatically', () => {
    expect(getForceAcceptWarning({ _: ['migrate'], forceAcceptWarning: true })).toBe(true)
  })
})

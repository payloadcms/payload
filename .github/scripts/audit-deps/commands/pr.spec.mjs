import { describe, expect, it } from 'vitest'

import { buildTitle } from './pr.mjs'

const csvBump = { dependency: 'csv-parse', from: '5.6.0', fromVersion: '5.6.0', to: '7.0.2' }

describe('buildTitle', () => {
  it.each([
    ['main', 'fix(deps): bump csv-parse from 5.6.0 to 7.0.2'],
    ['3.x', 'fix(deps): bump csv-parse from 5.6.0 to 7.0.2 (3.x)'],
  ])('should title a major PR on %s', (ref, title) => {
    expect(buildTitle({ ref, pr: { kind: 'major' }, prBumps: [csvBump] })).toBe(title)
  })

  it('should suffix a 3.x group PR title', () => {
    expect(buildTitle({ ref: '3.x', pr: { kind: 'group' }, prBumps: [csvBump, csvBump] })).toBe(
      'fix(deps): bump the non-major group with 2 updates (3.x)',
    )
  })
})

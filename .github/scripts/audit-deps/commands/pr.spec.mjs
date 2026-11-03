import { describe, expect, it } from 'vitest'

import { buildTitle } from './pr.mjs'

const csvBump = { dependency: 'csv-parse', from: '5.6.0', fromVersion: '5.6.0', to: '7.0.2' }

describe('buildTitle', () => {
  it.each([
    ['a major PR on main', 'main', 'major', 'fix(deps): bump csv-parse from 5.6.0 to 7.0.2'],
    [
      'a group PR on 3.x',
      '3.x',
      'group',
      'fix(deps): bump the non-major group with 2 updates (3.x)',
    ],
  ])('should title %s', (_name, ref, kind, title) => {
    expect(buildTitle({ ref, pr: { kind }, prBumps: [csvBump, csvBump] })).toBe(title)
  })
})

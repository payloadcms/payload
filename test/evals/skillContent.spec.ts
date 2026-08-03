import { describe, expect, it } from 'vitest'

import { loadSkillContext } from './skillContent.js'

describe('loadSkillContext', () => {
  it('returns the skill body concatenated with every reference file', () => {
    const context = loadSkillContext()

    expect(context.length).toBeGreaterThan(0)
    expect(context).toContain('# Reference: FIELDS.md')
    expect(context).toContain('# Reference: HOOKS.md')
  })

  it('is memoized across calls', () => {
    expect(loadSkillContext()).toBe(loadSkillContext())
  })
})

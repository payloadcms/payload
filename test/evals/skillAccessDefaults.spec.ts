import { describe, expect, it } from 'vitest'

import { loadSkillContext } from './skillContent.js'

describe('Payload skill Local API access guidance', () => {
  it('should describe access enforcement as the Local API default', () => {
    const skillContext = loadSkillContext()

    expect(skillContext).toContain('Access control runs by default for Local API operations')
    expect(skillContext).toContain(
      '`overrideAccess: true` - Trusted internal operations that intentionally bypass access control',
    )
    expect(skillContext).not.toMatch(
      /Local API (?:operations )?bypass(?:es)? access control by default/i,
    )
    expect(skillContext).not.toContain('overrideAccess: true` (default)')
    expect(skillContext).not.toMatch(/access control is \*\*skipped by default\*\* in Local API/i)
  })
})

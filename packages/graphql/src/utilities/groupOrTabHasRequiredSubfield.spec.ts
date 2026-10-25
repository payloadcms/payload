import type { Field, Tab } from 'payload'
import { describe, expect, it } from 'vitest'

import { groupOrTabHasRequiredSubfield } from './groupOrTabHasRequiredSubfield.js'

describe('groupOrTabHasRequiredSubfield', () => {
  it('returns false when the entity is marked hidden', () => {
    const hiddenGroup: Field = {
      name: 'meta',
      type: 'group',
      fields: [{ name: 'title', type: 'text', required: true }],
      hidden: true,
    }
    expect(groupOrTabHasRequiredSubfield(hiddenGroup)).toBe(false)
  })

  it('detects direct required subfields in group fields', () => {
    const requiredGroup: Field = {
      name: 'meta',
      type: 'group',
      fields: [{ name: 'title', type: 'text', required: true }],
    }
    expect(groupOrTabHasRequiredSubfield(requiredGroup)).toBe(true)

    const optionalGroup: Field = {
      name: 'meta',
      type: 'group',
      fields: [{ name: 'title', type: 'text', required: false }],
    }
    expect(groupOrTabHasRequiredSubfield(optionalGroup)).toBe(false)
  })

  it('detects direct required subfields in named tabs', () => {
    const namedTabWithRequiredField: Tab = {
      name: 'meta',
      fields: [{ name: 'title', type: 'text', required: true }],
    }
    expect(groupOrTabHasRequiredSubfield(namedTabWithRequiredField)).toBe(true)

    const namedTabWithoutRequiredField: Tab = {
      name: 'meta',
      fields: [{ name: 'title', type: 'text', required: false }],
    }
    expect(groupOrTabHasRequiredSubfield(namedTabWithoutRequiredField)).toBe(false)
  })

  it('detects nested containers with required subfields inside named tabs', () => {
    const namedTabWithNestedGroup: Tab = {
      name: 'meta',
      fields: [
        {
          name: 'nested',
          type: 'group',
          fields: [{ name: 'title', type: 'text', required: true }],
        },
      ],
    }
    expect(groupOrTabHasRequiredSubfield(namedTabWithNestedGroup)).toBe(true)
  })

  it('ignores hidden required subfields inside named tabs', () => {
    const namedTabWithHiddenRequiredField: Tab = {
      name: 'meta',
      fields: [{ name: 'title', type: 'text', required: true, hidden: true }],
    }
    expect(groupOrTabHasRequiredSubfield(namedTabWithHiddenRequiredField)).toBe(false)
  })
})

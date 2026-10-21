import { describe, expect, it } from 'vitest'

import { compileBranchScopeFields } from './compileBranchScopeFields.js'
import { getBranchSharedStructure } from './getBranchSharedStructure.js'

const fields = compileBranchScopeFields({
  fields: [
    {
      name: 'rows',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'title', type: 'text', localized: true },
      ],
    },
  ],
})

describe('getBranchSharedStructure', () => {
  it('should ignore shared labels and row order when locale attachments are compatible', () => {
    const live = {
      rows: [
        { id: 'a', label: 'A', title: { en: 'English' } },
        { id: 'b', label: 'B' },
      ],
    }
    const working = {
      rows: [
        { id: 'b', label: 'B changed' },
        { id: 'a', label: 'A changed', title: { en: 'New English' } },
      ],
    }

    expect(getBranchSharedStructure({ data: working, fields })).toStrictEqual(
      getBranchSharedStructure({ data: live, fields }),
    )
  })

  it('should detect added and removed row identities', () => {
    expect(getBranchSharedStructure({ data: { rows: [{ id: 'a' }] }, fields })).not.toStrictEqual(
      getBranchSharedStructure({ data: { rows: [{ id: 'b' }] }, fields }),
    )
  })

  it('should preserve typed identity distinctions', () => {
    expect(getBranchSharedStructure({ data: { rows: [{ id: 1 }] }, fields })).not.toStrictEqual(
      getBranchSharedStructure({ data: { rows: [{ id: '1' }] }, fields }),
    )
  })

  it('should distinguish absent, null and present shared groups', () => {
    const groupFields = compileBranchScopeFields({
      fields: [
        {
          name: 'group',
          type: 'group',
          fields: [{ name: 'title', type: 'text', localized: true }],
        },
      ],
    })

    expect(getBranchSharedStructure({ data: {}, fields: groupFields })).toStrictEqual({})
    expect(getBranchSharedStructure({ data: { group: null }, fields: groupFields })).toStrictEqual({
      group: null,
    })
    expect(
      getBranchSharedStructure({
        data: { group: { title: { en: 'value' } } },
        fields: groupFields,
      }),
    ).toStrictEqual({ group: {} })
  })

  it.each([{ rows: [{ id: 'a' }, { id: 'a' }] }, { rows: [{}] }])(
    'should reject ambiguous row identities %j',
    ({ rows }) => {
      expect(() => getBranchSharedStructure({ data: { rows }, fields })).toThrow(/row identity/)
    },
  )
})

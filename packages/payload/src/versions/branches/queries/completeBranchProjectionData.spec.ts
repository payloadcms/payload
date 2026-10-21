import type { Field } from '../../../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { completeBranchProjectionData } from './completeBranchProjectionData.js'

describe('completeBranchProjectionData', () => {
  it('should clear omitted group fields and configured locales', () => {
    const fields: Field[] = [
      {
        name: 'group',
        type: 'group',
        fields: [
          { name: 'title', type: 'text', localized: true },
          { name: 'value', type: 'text' },
        ],
      },
    ]

    expect(
      completeBranchProjectionData({
        fields,
        locales: ['en', 'fr'],
        previous: { group: { title: { en: 'Old', fr: 'Ancien' }, value: 'Old' } },
        replacement: { group: { title: { en: 'New' } } },
      }),
    ).toEqual({ group: { title: { en: 'New', fr: null }, value: null } })
  })

  it('should complete retained rows without copying omitted rows', () => {
    const fields: Field[] = [
      {
        name: 'rows',
        type: 'array',
        fields: [
          { name: 'id', type: 'text' },
          { name: 'title', type: 'text' },
        ],
      },
    ]

    expect(
      completeBranchProjectionData({
        fields,
        locales: [],
        previous: {
          rows: [
            { id: 'first', title: 'Old' },
            { id: 'second', title: 'Remove' },
          ],
        },
        replacement: { rows: [{ id: 'first' }] },
      }),
    ).toEqual({ rows: [{ id: 'first', title: null }] })
  })

  it('should preserve opaque JSON values and clear omitted has-many values', () => {
    const fields: Field[] = [
      { name: 'opaque', type: 'json' },
      { name: 'links', type: 'relationship', relationTo: 'posts', hasMany: true },
    ]
    const replacement = { opaque: { id: 'logical', nested: { relationTo: 'posts', value: 3 } } }

    expect(completeBranchProjectionData({ fields, locales: [], replacement })).toEqual({
      ...replacement,
      links: [],
    })
    expect(replacement).not.toHaveProperty('links')
  })
})

import { describe, expect, it } from 'vitest'

import type { SanitizedJoins } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { JoinField } from './types.js'

import { sanitizeJoinField } from './sanitizeJoinField.js'

const pagesFields = [
  {
    type: 'blocks',
    name: 'layout',
    blocks: [
      {
        slug: 'documentList',
        fields: [
          {
            type: 'array',
            name: 'groups',
            fields: [
              {
                type: 'relationship',
                name: 'documents',
                relationTo: 'documents',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: 'array',
    name: 'groups',
    fields: [
      {
        type: 'relationship',
        name: 'documents',
        relationTo: 'documents',
      },
    ],
  },
]

const buildConfig = (): Config =>
  ({
    collections: [
      {
        slug: 'pages',
        fields: pagesFields,
      },
      {
        slug: 'documents',
        fields: [],
      },
    ],
  }) as unknown as Config

const sanitizeTestJoin = (on: string): SanitizedJoins => {
  const field: JoinField = {
    name: 'listedOn',
    type: 'join',
    collection: 'pages',
    on,
  }

  const joins: SanitizedJoins = {}

  sanitizeJoinField({
    config: buildConfig(),
    field,
    joins,
    parentIsLocalized: false,
  })

  return joins
}

describe('sanitizeJoinField', () => {
  it('throws when the join "on" path crosses a blocks field', () => {
    expect(() => sanitizeTestJoin('layout.documentList.groups.documents')).toThrow(
      /crosses a blocks field/,
    )
  })

  it('allows a join "on" path through an array field', () => {
    const joins = sanitizeTestJoin('groups.documents')

    expect(joins.pages).toHaveLength(1)
  })
})

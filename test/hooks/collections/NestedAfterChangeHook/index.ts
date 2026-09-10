import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'
export const nestedAfterChangeHooksSlug = 'nested-after-change-hooks'

type CapturedAfterChangeAction = {
  action: unknown
  operation?: unknown
}

let lastCollectionAfterChangeAction: CapturedAfterChangeAction | undefined
let lastFieldAfterChangeAction: CapturedAfterChangeAction | undefined

export const getLastNestedAfterChangeActions = () => ({
  collection: lastCollectionAfterChangeAction,
  field: lastFieldAfterChangeAction,
})

export const clearLastNestedAfterChangeActions = () => {
  lastCollectionAfterChangeAction = undefined
  lastFieldAfterChangeAction = undefined
}

const NestedAfterChangeHooks: CollectionConfig = {
  slug: nestedAfterChangeHooksSlug,
  hooks: {
    afterChange: [
      ({ action, operation }) => {
        lastCollectionAfterChangeAction = { action, operation }
      },
    ],
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              type: 'text',
              name: 'nestedAfterChange',
              hooks: {
                afterChange: [
                  ({ previousValue, operation, action }) => {
                    lastFieldAfterChangeAction = { action, operation }
                    if (operation === 'update' && typeof previousValue === 'undefined') {
                      throw new Error('previousValue is missing in nested beforeChange hook')
                    }
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: 'lexical',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'nestedBlock',
                fields: [
                  {
                    type: 'text',
                    name: 'nestedAfterChange',
                    hooks: {
                      afterChange: [
                        ({ previousValue, operation }) => {
                          if (operation === 'update' && typeof previousValue === 'undefined') {
                            throw new Error('previousValue is missing in nested beforeChange hook')
                          }
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          }),
          LinkFeature({
            fields: [
              {
                type: 'blocks',
                name: 'linkBlocks',
                blocks: [
                  {
                    slug: 'nestedLinkBlock',
                    fields: [
                      {
                        name: 'nestedRelationship',
                        type: 'relationship',
                        relationTo: 'relations',
                        hooks: {
                          afterChange: [
                            ({ previousValue, operation }) => {
                              if (operation === 'update' && typeof previousValue === 'undefined') {
                                throw new Error(
                                  'previousValue is missing in nested beforeChange hook',
                                )
                              }
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
  ],
  versions: false,
}

export default NestedAfterChangeHooks

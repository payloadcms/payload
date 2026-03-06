import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

import { lexicalAutosaveSlug } from '../../slugs.js'

export const autosaveHookLog: {
  relationshipField?: { operation: string; previousValue: unknown; value: unknown }
} = {}

export const clearAutosaveHookLog = (): void => {
  delete autosaveHookLog.relationshipField
}

export const LexicalAutosave: CollectionConfig = {
  slug: lexicalAutosaveSlug,
  versions: {
    drafts: {
      autosave: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    // The bug occurs when richText is nested inside an array (like a CTA array)
    {
      name: 'cta',
      type: 'array',
      fields: [
        {
          name: 'richText',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [
              ...defaultFeatures,
              BlocksFeature({
                blocks: [
                  {
                    slug: 'textBlock',
                    fields: [
                      {
                        name: 'blockTitle',
                        type: 'text',
                        hooks: {
                          afterChange: [
                            ({ value, previousValue, operation }) => {
                              autosaveHookLog.relationshipField = {
                                operation,
                                previousValue,
                                value,
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
                        slug: 'linkBlock',
                        fields: [
                          {
                            name: 'relationshipInLink',
                            type: 'relationship',
                            relationTo: 'text-fields',
                            hooks: {
                              afterChange: [
                                ({ value, previousValue, operation }) => {
                                  autosaveHookLog.relationshipField = {
                                    operation,
                                    previousValue,
                                    value,
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
    },
  ],
}

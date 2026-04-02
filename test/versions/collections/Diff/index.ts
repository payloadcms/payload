import type { CollectionConfig } from 'payload'

import { diffCollectionSlug, draftCollectionSlug, textCollectionSlug } from '../../slugs.js'

export const Diff: CollectionConfig = {
  slug: diffCollectionSlug,
  fields: [
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'textInArray',
          type: 'text',
        },
      ],
    },
    {
      name: 'arrayLocalized',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'textInArrayLocalized',
          type: 'text',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'SingleRelationshipBlock',
          fields: [
            {
              type: 'text',
              name: 'title',
            },
            {
              type: 'relationship',
              name: 'relatedItem',
              relationTo: [textCollectionSlug],
            },
          ],
        },
        {
          slug: 'ManyRelationshipBlock',
          fields: [
            {
              type: 'text',
              name: 'title',
            },
            {
              type: 'relationship',
              name: 'relatedItem',
              relationTo: [textCollectionSlug],
              hasMany: true,
            },
          ],
        },
        {
          slug: 'TextBlock',
          fields: [
            {
              name: 'textInBlock',
              type: 'text',
            },
          ],
        },
        {
          slug: 'CollapsibleBlock',
          fields: [
            {
              type: 'collapsible',
              label: 'Collapsible',
              fields: [
                {
                  type: 'collapsible',
                  label: 'Nested Collapsible',
                  fields: [
                    {
                      name: 'textInCollapsibleInCollapsibleBlock',
                      type: 'text',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'textInRowInCollapsibleBlock',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          slug: 'TabsBlock',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  name: 'namedTab1InBlock',
                  fields: [
                    {
                      name: 'textInNamedTab1InBlock',
                      type: 'text',
                    },
                  ],
                },
                {
                  label: 'Unnamed Tab 2 In Block',
                  fields: [
                    {
                      name: 'textInUnnamedTab2InBlock',
                      type: 'text',
                    },
                    {
                      name: 'textInUnnamedTab2InBlockAccessFalse',
                      type: 'text',
                      access: {
                        read: () => false,
                      },
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'textInRowInUnnamedTab2InBlock',
                          type: 'text',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'checkbox',
      name: 'checkbox',
    },
    {
      type: 'code',
      name: 'code',
    },
    {
      type: 'collapsible',
      label: 'Collapsible',
      fields: [
        {
          name: 'textInCollapsible',
          type: 'text',
        },
      ],
    },
    {
      type: 'date',
      name: 'date',
    },
    {
      type: 'email',
      name: 'email',
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          name: 'textInGroup',
          type: 'text',
        },
      ],
    },
    {
      type: 'group',
      fields: [
        {
          name: 'textInUnnamedGroup',
          type: 'text',
        },
      ],
    },
    {
      type: 'group',
      label: 'Unnamed Labeled Group',
      fields: [
        {
          name: 'textInUnnamedLabeledGroup',
          type: 'text',
        },
      ],
    },
    {
      type: 'number',
      name: 'number',
    },
    {
      type: 'point',
      name: 'point',
    },
    {
      type: 'json',
      name: 'json',
    },
    {
      type: 'radio',
      name: 'radio',
      options: [
        {
          label: 'Option 1',
          value: 'option1',
        },
        {
          label: 'Option 2',
          value: 'option2',
        },
      ],
    },
    {
      type: 'relationship',
      name: 'relationship',
      relationTo: draftCollectionSlug,
    },
    {
      type: 'relationship',
      name: 'relationshipHasMany',
      hasMany: true,
      relationTo: draftCollectionSlug,
    },
    {
      type: 'relationship',
      name: 'relationshipPolymorphic',
      relationTo: [draftCollectionSlug, 'text'],
    },
    {
      type: 'relationship',
      name: 'relationshipHasManyPolymorphic',
      hasMany: true,
      relationTo: [draftCollectionSlug, 'text'],
    },
    {
      type: 'relationship',
      name: 'relationshipHasManyPolymorphic2',
      hasMany: true,
      relationTo: [draftCollectionSlug, 'text'],
    },
    {
      name: 'zeroDepthRelationship',
      type: 'relationship',
      relationTo: 'users',
      maxDepth: 0,
    },
    {
      name: 'richtext',
      type: 'richText',
    },
    {
      name: 'richtextWithCustomDiff',
      type: 'richText',
      admin: {
        components: {
          Diff: './elements/RichTextDiffComponent/index.js#RichTextDiffComponent',
        },
      },
    },
    {
      fields: [
        {
          name: 'textInRow',
          type: 'text',
        },
      ],
      type: 'row',
    },
    {
      name: 'textCannotRead',
      type: 'text',
      access: {
        read: () => false,
      },
    },
    {
      name: 'select',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: 'option1',
        },
        {
          label: 'Option 2',
          value: 'option2',
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'namedTab1',
          fields: [
            {
              name: 'textInNamedTab1',
              type: 'text',
            },
            {
              name: 'textInNamedTab1ReadFalse',
              type: 'text',
              access: {
                read: () => false,
              },
            },
            {
              name: 'textInNamedTab1UpdateFalse',
              type: 'text',
              access: {
                update: () => false,
              },
            },
          ],
        },
        {
          label: 'Unnamed Tab 2',
          fields: [
            {
              name: 'textInUnnamedTab2',
              type: 'text',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'textInRowInUnnamedTab',
                  type: 'text',
                },
                {
                  name: 'textInRowInUnnamedTabUpdateFalse',
                  type: 'text',
                  access: {
                    update: () => false,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'textArea',
      type: 'textarea',
    },
    {
      name: 'upload',
      relationTo: 'media',
      type: 'upload',
    },
    {
      name: 'uploadHasMany',
      hasMany: true,
      relationTo: 'media',
      type: 'upload',
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 35,
  },
}

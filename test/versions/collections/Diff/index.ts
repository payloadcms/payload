import type { CollectionConfig } from 'payload'

import { diffCollectionSlug, draftCollectionSlug } from '../../slugs.js'

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
      type: 'number',
      name: 'number',
    },
    {
      type: 'point',
      name: 'point',
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
          ],
        },
        {
          label: 'Unnamed Tab 2',
          fields: [
            {
              name: 'textInUnnamedTab2',
              type: 'text',
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
  ],
  versions: {
    maxPerDoc: 35,
  },
}

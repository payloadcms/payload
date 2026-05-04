import type { CollectionConfig } from 'payload'

import { allFieldsLocalizedSlug } from '../../shared.js'

export const AllFieldsLocalized: CollectionConfig = {
  slug: allFieldsLocalizedSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    // Simple localized fields
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
    {
      name: 'textarea',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'number',
      type: 'number',
      localized: true,
    },
    {
      name: 'email',
      type: 'email',
      localized: true,
    },
    {
      name: 'code',
      type: 'code',
      localized: true,
    },
    {
      name: 'json',
      type: 'json',
      localized: true,
    },
    {
      name: 'select',
      type: 'select',
      localized: true,
      options: ['option1', 'option2', 'option3'],
    },
    {
      name: 'radio',
      type: 'radio',
      localized: true,
      options: ['radio1', 'radio2'],
    },
    {
      name: 'checkbox',
      type: 'checkbox',
      localized: true,
    },
    {
      name: 'date',
      type: 'date',
      localized: true,
    },

    // Localized group with localized children
    {
      name: 'localizedGroup',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
        },
      ],
      localized: true,
    },

    // Non-localized group with localized children
    {
      name: 'nonLocalizedGroup',
      type: 'group',
      fields: [
        {
          name: 'localizedText',
          type: 'text',
          localized: true,
        },
        {
          name: 'nonLocalizedText',
          type: 'text',
        },
      ],
    },

    // Localized array with localized children
    {
      name: 'localizedArray',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
          localized: true,
        },
      ],
      localized: true,
    },

    // Non-localized array with localized children
    {
      name: 'nonLocalizedArray',
      type: 'array',
      fields: [
        {
          name: 'localizedItem',
          type: 'text',
          localized: true,
        },
      ],
    },

    // Localized blocks with nested localized fields
    {
      name: 'localizedBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'localizedTextBlock',
          fields: [
            {
              name: 'text',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          slug: 'nestedBlock',
          fields: [
            {
              name: 'nestedArray',
              type: 'array',
              fields: [
                {
                  name: 'item',
                  type: 'text',
                },
              ],
              localized: true,
            },
          ],
        },
      ],
      localized: true,
    },

    // Named tabs with localized tab
    {
      type: 'tabs',
      tabs: [
        {
          name: 'localizedTab',
          fields: [
            {
              name: 'tabText',
              type: 'text',
              localized: true,
            },
          ],
          label: 'Localized Tab',
          localized: true,
        },
        {
          name: 'nonLocalizedTab',
          fields: [
            {
              name: 'localizedInNonLocalizedTab',
              type: 'text',
              localized: true,
            },
          ],
          label: 'Non-Localized Tab',
        },
      ],
    },

    // Unnamed tab (passes through)
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'unnamedTabLocalizedText',
              type: 'text',
              localized: true,
            },
          ],
          label: 'Unnamed Tab',
        },
      ],
    },

    // Deeply nested: localized tab
    {
      type: 'tabs',
      tabs: [
        {
          name: 't1',
          label: 'Deeply Nested Tab',
          localized: true,
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  name: 't2',
                  label: 'Nested Tab Level 2',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                      localized: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // Deeply nested: localized group > non-localized group > localized array
    {
      name: 'g1',
      type: 'group',
      label: 'Deeply Nested Group',
      fields: [
        {
          name: 'g2',
          type: 'group',
          fields: [
            {
              name: 'g2a1',
              type: 'array',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  localized: true,
                },
              ],
              localized: true,
            },
          ],
        },
      ],
      localized: true,
    },

    // relation to self
    {
      name: 'selfRelation',
      type: 'relationship',
      relationTo: allFieldsLocalizedSlug,
    },
  ],
  versions: {
    drafts: {
      localizeStatus: true,
    },
  },
}

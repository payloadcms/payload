import type { CollectionConfig } from 'payload'

export const blocksCollectionSlug = 'blocks-fields'

export const BlocksCollection: CollectionConfig = {
  slug: blocksCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab',
          fields: [
            {
              name: 'tabContent',
              label: 'Content',
              type: 'blocks',
              localized: true,
              blocks: [
                {
                  slug: 'blockInsideTab',
                  fields: [{ type: 'text', name: 'text' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'content',
      label: 'Content',
      type: 'blocks',
      localized: true,
      blocks: [
        {
          slug: 'blockInsideBlock',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'content',
              type: 'blocks',
              blocks: [
                {
                  slug: 'textBlock',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              name: 'array',
              type: 'array',
              fields: [
                {
                  name: 'link',
                  type: 'group',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          // Covers array/blocks fields nested inside presentational wrappers
          // (row, collapsible) and a named group, all within a block's own
          // fields - not to be confused with `array`/`content` above, which
          // are direct children of the block.
          slug: 'nestedContainers',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'rowItems',
                  type: 'array',
                  fields: [{ name: 'label', type: 'text' }],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Collapsible',
              fields: [
                {
                  name: 'collapsibleItems',
                  type: 'array',
                  fields: [{ name: 'label', type: 'text' }],
                },
              ],
            },
            {
              name: 'group',
              type: 'group',
              fields: [
                {
                  name: 'groupItems',
                  type: 'array',
                  fields: [{ name: 'label', type: 'text' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { duplicateFieldsSlug } from '../../slugs.js'

const DuplicateFields: CollectionConfig = {
  slug: duplicateFieldsSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
    {
      name: 'disabledText',
      type: 'text',
      defaultValue: 'duplicate-disabled-default',
      disableDuplicate: true,
    },
    {
      name: 'disabledGroup',
      type: 'group',
      disableDuplicate: true,
      fields: [
        {
          name: 'value',
          type: 'text',
          defaultValue: 'duplicate-disabled-group-default',
          hooks: {
            beforeDuplicate: [
              ({ req, value }) => {
                if (req.context.shouldThrowDisabledDuplicateDescendantHook) {
                  throw new Error('disabled descendant hook should not run')
                }

                return value
              },
            ],
          },
        },
      ],
    },
    {
      name: 'disabledArray',
      type: 'array',
      defaultValue: [{}],
      disableDuplicate: true,
      fields: [
        {
          name: 'value',
          type: 'text',
          defaultValue: 'duplicate-disabled-array-default',
        },
      ],
    },
    {
      name: 'disabledBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'disabledBlock',
          fields: [
            {
              name: 'value',
              type: 'text',
              defaultValue: 'duplicate-disabled-block-default',
            },
          ],
        },
      ],
      defaultValue: [
        {
          blockType: 'disabledBlock',
        },
      ],
      disableDuplicate: true,
    },
    {
      name: 'childDisabledArray',
      type: 'array',
      fields: [
        {
          name: 'preserved',
          type: 'text',
        },
        {
          name: 'reset',
          type: 'text',
          defaultValue: 'duplicate-disabled-child-default',
          disableDuplicate: true,
        },
      ],
    },
    {
      name: 'disabledLocalizedText',
      type: 'text',
      defaultValue: 'duplicate-disabled-localized-default',
      disableDuplicate: true,
      localized: true,
    },
    {
      name: 'disabledHookText',
      type: 'text',
      defaultValue: 'duplicate-disabled-hook-default',
      disableDuplicate: true,
      hooks: {
        beforeDuplicate: [
          ({ req, value }) => {
            if (req.context.shouldThrowDisabledDuplicateHook) {
              throw new Error('disabled hook should not run')
            }

            return value
          },
        ],
      },
    },
  ],
}

export default DuplicateFields

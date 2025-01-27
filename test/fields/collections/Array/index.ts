import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { arrayFieldsSlug } from '../../slugs'
import { ArrayRowLabel } from './LabelComponent'

export const arrayDefaultValue = [{ text: 'row one' }, { text: 'row two' }]

const ArrayFields: CollectionConfig = {
  admin: {
    enableRichTextLink: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'items',
      defaultValue: arrayDefaultValue,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'localizedText',
          type: 'text',
          localized: true,
        },
        {
          name: 'subArray',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
          type: 'array',
        },
      ],
      required: true,
      type: 'array',
    },
    {
      name: 'collapsedArray',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'localized',
      defaultValue: arrayDefaultValue,
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      localized: true,
      required: true,
      type: 'array',
    },
    {
      name: 'readOnly',
      admin: {
        readOnly: true,
      },
      defaultValue: [
        {
          text: 'defaultValue',
        },
        {
          text: 'defaultValue2',
        },
      ],
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'potentiallyEmptyArray',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'groupInRow',
          fields: [
            {
              name: 'textInGroupInRow',
              type: 'text',
            },
          ],
          type: 'group',
        },
      ],
      type: 'array',
    },
    {
      name: 'rowLabelAsFunction',
      admin: {
        components: {
          RowLabel: ({ data }) => data.title,
        },
        description: 'Row labels rendered from a function.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'rowLabelAsComponent',
      admin: {
        components: {
          RowLabel: ArrayRowLabel,
        },
        description: 'Row labels rendered as react components.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'arrayWithMinRows',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      minRows: 2,
      type: 'array',
    },
    {
      name: 'disableSort',
      defaultValue: arrayDefaultValue,
      admin: {
        isSortable: false,
      },
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'nestedArrayLocalized',
      type: 'array',
      fields: [
        {
          type: 'array',
          name: 'array',
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
  slug: arrayFieldsSlug,
  versions: true,
}

export default ArrayFields

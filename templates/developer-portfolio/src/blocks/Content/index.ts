import type { Block } from 'payload/types'

import link from '../../fields/link'

export const Content: Block = {
  slug: 'content',
  fields: [
    {
      name: 'contentFields',
      type: 'array',
      fields: [
        {
          name: 'size',
          type: 'select',
          defaultValue: 'oneThird',
          options: [
            {
              value: 'oneThird',
              label: 'One Third',
            },
            {
              value: 'half',
              label: 'Half',
            },
            {
              value: 'twoThirds',
              label: 'Two Thirds',
            },
            {
              value: 'full',
              label: 'Full',
            },
          ],
        },
        {
          name: 'richText',
          type: 'richText',
        },
        {
          name: 'enableLink',
          type: 'checkbox',
        },
        link({
          overrides: {
            admin: {
              condition: (_, { enableLink }) => Boolean(enableLink),
            },
          },
        }),
      ],
    },
  ],
}

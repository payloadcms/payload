import type { Block } from 'payload/types'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  fields: [
    {
      name: 'mediaFields',
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
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'mediaFit',
          type: 'select',
          defaultValue: 'cover',
          options: [
            {
              value: 'cover',
              label: 'cover',
            },
            {
              value: 'contain',
              label: 'contain',
            },
          ],
        },
      ],
    },
  ],
}

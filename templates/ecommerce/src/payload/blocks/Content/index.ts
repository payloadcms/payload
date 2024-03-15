import type { Block, Field } from 'payload/types'

import { invertBackground } from '../../fields/invertBackground'
import link from '../../fields/link'
import richText from '../../fields/richText'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    options: [
      {
        label: 'One Third',
        value: 'oneThird',
      },
      {
        label: 'Half',
        value: 'half',
      },
      {
        label: 'Two Thirds',
        value: 'twoThirds',
      },
      {
        label: 'Full',
        value: 'full',
      },
    ],
  },
  richText(),
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
]

export const Content: Block = {
  slug: 'content',
  fields: [
    invertBackground,
    {
      name: 'columns',
      type: 'array',
      fields: columnFields,
    },
  ],
}

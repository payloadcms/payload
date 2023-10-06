import type { Block } from '../../../../packages/payload/src/fields/config/types'

import { invertBackground } from '../../fields/invertBackground'
import linkGroup from '../../fields/linkGroup'

export const CallToAction: Block = {
  slug: 'cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  fields: [
    invertBackground,
    {
      name: 'richText',
      label: 'Rich Text',
      type: 'richText',
    },
    linkGroup({
      appearances: ['primary', 'secondary'],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
}

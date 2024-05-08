import type { Block } from 'payload/types'

import { invertBackground } from '../../fields/invertBackground'
import { linkGroup } from '../../fields/linkGroup'
import { richText } from '../../fields/richTextLexical'

export const CallToAction: Block = {
  slug: 'cta',
  fields: [
    invertBackground,
    richText(),
    linkGroup({
      appearances: ['primary', 'secondary'],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
  labels: {
    plural: 'Calls to Action',
    singular: 'Call to Action',
  },
}

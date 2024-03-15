import type { Block } from '../../../../packages/payload/src/fields/config/types.js'

import { slateEditor } from '../../../../packages/richtext-slate/src/index.js'
import { invertBackground } from '../../fields/invertBackground.js'
import linkGroup from '../../fields/linkGroup.js'

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
      editor: slateEditor({}),
    },
    linkGroup({
      appearances: ['primary', 'secondary'],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
}

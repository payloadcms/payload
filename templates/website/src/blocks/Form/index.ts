import type { Block } from 'payload/types'

import { richText } from '../../fields/richText'

export const FormBlock: Block = {
  slug: 'formBlock',
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
    },
    {
      name: 'enableIntro',
      type: 'checkbox',
      label: 'Enable Intro Content',
    },
    richText({
      name: 'introContent',
      admin: {
        condition: (_, { enableIntro }) => Boolean(enableIntro),
      },
      label: 'Intro Content',
    }),
  ],
  graphQL: {
    singularName: 'FormBlock',
  },
  labels: {
    plural: 'Form Blocks',
    singular: 'Form Block',
  },
}

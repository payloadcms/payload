import type { Block } from 'payload/types'

export const Code: Block = {
  slug: 'code',
  fields: [
    {
      name: 'code',
      type: 'code',
      required: true,
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
      ],
    },
  ],
}

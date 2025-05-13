import type { Block } from 'payload'

import { languages } from '../../../collections/Posts/shared.js'
import { codeConverter } from './converter.js'

export const CodeBlock: Block = {
  slug: 'Code',
  admin: {
    jsx: './mdx/jsxBlocks/code/converterClient.js#codeConverterClient',
  },
  jsx: codeConverter,
  fields: [
    {
      type: 'select',
      name: 'language',
      options: Object.entries(languages).map(([key, value]) => ({
        label: value,
        value: key,
      })),
      defaultValue: 'ts',
    },
    {
      admin: {
        components: {
          Field: './collections/Posts/CodeFields.js#Code',
        },
      },
      name: 'code',
      type: 'code',
    },
  ],
}

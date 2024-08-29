import type { Block } from 'payload'

import { languages } from '../../collections/Posts/shared.js'

const CODE_BLOCK_REG_EXP = /^[ \t]*```(\w{1,10})?\s?$/

export const CodeBlock: Block = {
  slug: 'Code',
  jsx: {
    customStartRegex: /^[ \t]*```(\w+)?/,
    customEndRegex: {
      optional: true,
      regExp: /[ \t]*```$/,
    },
    import: ({ openMatch, children }) => {
      const language = openMatch[1]
      return {
        language,
        code: children,
      }
    },
    export: ({ fields }) => {
      return (
        '```' + (fields.language || '') + (fields.code ? '\n' + fields.code : '') + '\n' + '```'
      )
    },
  },
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

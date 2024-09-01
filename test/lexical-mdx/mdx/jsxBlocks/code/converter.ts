import type { BlockJSX } from 'payload'

export const codeConverter: BlockJSX = {
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
    return '```' + (fields.language || '') + (fields.code ? '\n' + fields.code : '') + '\n' + '```'
  },
}

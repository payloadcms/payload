import type { BlockJSX } from 'payload'

export const codeConverter: BlockJSX = {
  customStartRegex: /^[ \t]*```(\w+)?/,
  customEndRegex: {
    optional: true,
    regExp: /[ \t]*```$/,
  },
  doNotTrimChildren: true,
  import: ({ openMatch, children, closeMatch }) => {
    const language = openMatch[1]

    const isSingleLineAndComplete =
      !!closeMatch && !children.includes('\n') && openMatch.input?.trim() !== '```' + language

    if (isSingleLineAndComplete) {
      return {
        language: '',
        code: language + (children?.length ? ` ${children}` : ''),
      }
    }

    return {
      language,
      code: children,
    }
  },
  export: ({ fields }) => {
    return '```' + (fields.language || '') + (fields.code ? '\n' + fields.code : '') + '\n' + '```'
  },
}

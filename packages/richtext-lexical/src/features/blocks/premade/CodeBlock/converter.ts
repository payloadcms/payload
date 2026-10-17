import type { BlockJSX } from 'payload'

/**
 * @internal
 * @experimental - API may change in minor releases
 */
export const codeConverter: BlockJSX = {
  customEndRegex: {
    optional: true,
    regExp: /[ \t]*```$/,
  },
  customStartRegex: /^[ \t]*```(\w+)?/,
  doNotTrimChildren: true,
  export: ({ fields }) => {
    const isSingleLine = !fields.code.includes('\n') && !fields.language?.length
    if (isSingleLine) {
      return '```' + fields.code + '```'
    }

    return '```' + (fields.language || '') + (fields.code ? '\n' + fields.code : '') + '\n' + '```'
  },
  import: ({ children, closeMatch, openMatch }) => {
    const language = openMatch?.[1]

    // Removed first and last \n from children if present
    if (children.startsWith('\n')) {
      children = children.slice(1)
    }
    if (children.endsWith('\n')) {
      children = children.slice(0, -1)
    }

    const isSingleLineAndComplete =
      !!closeMatch && !children.includes('\n') && openMatch?.input?.trim() !== '```' + language

    if (isSingleLineAndComplete) {
      return {
        code: (language || '') + (children?.length ? children : ''), // No need to add space to children as they are not trimmed
        language,
      }
    }

    return {
      code: children,
      language,
    }
  },
}

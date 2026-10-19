/**
 * A minimal ESLint parser that treats files as plain text.
 * This is used for linting MDX/MD files where we only need access
 * to the raw text content (not the AST).
 */

export const meta = {
  name: 'mdx-text-parser',
  version: '1.0.0',
}

/**
 * @param {string} text - The source code text
 * @param {object} options - Parser options
 * @returns {object} - A minimal AST that ESLint can work with
 */
export function parse(text, options) {
  const lines = text.split('\n')
  const lastLine = lines[lines.length - 1]

  return {
    type: 'Program',
    body: [],
    sourceType: 'module',
    tokens: [],
    comments: [],
    loc: {
      start: { line: 1, column: 0 },
      end: { line: lines.length, column: lastLine.length },
    },
    range: [0, text.length],
  }
}

export default { meta, parse }

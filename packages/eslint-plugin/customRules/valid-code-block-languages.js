/**
 * Validates that code block languages in MDX/MD files are supported by the syntax highlighter in the Payload docs website.
 *
 * Additional languages can be loaded but need explicit configuration.
 * This rule enforces a whitelist of known-supported languages.
 *
 * This list should be maintained from: https://github.com/payloadcms/website/blob/main/src/collections/Docs/blocks/shared.ts
 */

/** @type {string[]} */
const SUPPORTED_LANGUAGES = [
  'bash',
  'css',
  'dockerfile',
  'env',
  'graphql',
  'html',
  'http',
  'js',
  'json',
  'jsx',
  'plaintext',
  'scss',
  'sh',
  'text',
  'ts',
  'tsx',
  'vue',
  'yaml',
  'yml',
]

// De-duplicate the list
const SUPPORTED_LANGUAGES_SET = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.toLowerCase()))

// Languages that are definitely NOT supported and commonly misused
const UNSUPPORTED_LANGUAGES = new Set([
  'csv', // Common mistake - no syntax highlighting for CSV
  'tsv', // Tab-separated values
  'log', // Log files
  'console', // Console output (use 'text' or 'bash' instead)
  'output', // Command output (use 'text' instead)
  'terminal', // Use 'bash' or 'sh' instead
  'raw', // Use 'text' instead
  'none', // Use 'text' or 'plaintext' instead
])

/**
 * Regex to match fenced code blocks with language identifier.
 * Captures: language identifier (group 1), line number (implicitly via exec)
 */
const CODE_FENCE_REGEX = /^(`{3,})([a-zA-Z0-9_+-]*)\s*$/gm

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ensure code block languages in MDX/MD files are supported by the syntax highlighter',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      unsupportedLanguage:
        'Code block language "{{language}}" is not supported by the syntax highlighter. Use a supported language like: ts, tsx, js, jsx, json, bash, sh, text, plaintext, diff, graphql, yaml, css, scss, html, markdown.',
      suggestPlaintext:
        'Code block language "{{language}}" is not supported. Consider using "text" or "plaintext" for non-highlighted content.',
      emptyLanguage:
        'Code block has no language specified. Consider adding a language (e.g., ```ts) or use ```text for plain content.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowEmpty: {
            type: 'boolean',
            description: 'Allow code blocks without a language identifier',
            default: true,
          },
          additionalLanguages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional languages to allow beyond the default list',
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {}
    const allowEmpty = options.allowEmpty !== false
    const additionalLanguages = new Set(
      (options.additionalLanguages || []).map((lang) => lang.toLowerCase()),
    )

    // Combine default supported languages with any additional ones
    const allowedLanguages = new Set([...SUPPORTED_LANGUAGES_SET, ...additionalLanguages])

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode()
        const text = sourceCode.getText()

        let match
        CODE_FENCE_REGEX.lastIndex = 0

        while ((match = CODE_FENCE_REGEX.exec(text)) !== null) {
          const fullMatch = match[0]
          const backticks = match[1]
          const language = match[2]
          const matchStart = match.index
          const matchEnd = matchStart + fullMatch.length

          // Calculate line and column from character index
          const lines = text.slice(0, matchStart).split('\n')
          const line = lines.length
          const column = lines[lines.length - 1].length

          // Find the actual location in the source
          const loc = {
            start: { line, column },
            end: { line, column: column + fullMatch.length },
          }

          if (!language) {
            // Empty language
            if (!allowEmpty) {
              context.report({
                loc,
                messageId: 'emptyLanguage',
              })
            }
            continue
          }

          const languageLower = language.toLowerCase()

          // Check if it's a known unsupported language
          if (UNSUPPORTED_LANGUAGES.has(languageLower)) {
            context.report({
              loc,
              messageId: 'suggestPlaintext',
              data: { language },
              fix(fixer) {
                // Calculate the range for just the language part
                const languageStart = matchStart + backticks.length
                const languageEnd = languageStart + language.length
                return fixer.replaceTextRange([languageStart, languageEnd], 'text')
              },
            })
            continue
          }

          // Check if it's in the allowed list
          if (!allowedLanguages.has(languageLower)) {
            context.report({
              loc,
              messageId: 'unsupportedLanguage',
              data: { language },
            })
          }
        }
      },
    }
  },
}

export default rule

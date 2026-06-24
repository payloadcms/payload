/**
 * Warns about Lexical markdown imports and calls that conflict with Payload's editor.
 *
 * Payload ships its own code block and link features (with dedicated node types) and a
 * config-aware heading transformer, so Lexical's `CODE` / `LINK` / `HEADING` transformers
 * and the default transformer groups (which bundle them) do not match a Payload editor.
 * Lexical's `HEADING` in particular matches every level (h1-h6), ignoring the levels
 * enabled in config. Build the transformer list from enabled features instead, or use the
 * `convertMarkdownToLexical` / `convertLexicalToMarkdown` converters.
 *
 * On top of that, several `@lexical/markdown` functions default their `transformers`
 * argument to Lexical's `TRANSFORMERS`. Calling them without an explicit transformer
 * list silently falls back to that mismatching default, so those calls are flagged too.
 */

const REPLACED_TRANSFORMERS = new Set(['CODE', 'LINK'])

const HEADING_TRANSFORMER = 'HEADING'

const TRANSFORMER_GROUPS = new Set([
  'ELEMENT_TRANSFORMERS',
  'MULTILINE_ELEMENT_TRANSFORMERS',
  'TEXT_FORMAT_TRANSFORMERS',
  'TEXT_MATCH_TRANSFORMERS',
  'TRANSFORMERS',
])

/**
 * Functions whose `transformers` parameter falls back to Lexical's default `TRANSFORMERS`
 * when omitted. Maps the imported name to the position of its `transformers` argument.
 */
const DEFAULT_TRANSFORMER_FUNCTIONS = new Map([
  ['$convertFromMarkdownString', 1],
  ['$convertSelectionToMarkdownString', 0],
  ['$convertToMarkdownString', 0],
  ['registerMarkdownShortcuts', 1],
])

/**
 * Matches `@lexical/markdown`, Payload's public passthrough export, and the relative
 * proxy module inside the monorepo.
 */
function isLexicalMarkdownSource(source) {
  return (
    source === '@lexical/markdown' ||
    source === '@payloadcms/richtext-lexical/lexical/markdown' ||
    /lexical-proxy\/@lexical-markdown(\.js)?$/.test(source)
  )
}

/** Whether a node is missing or resolves to `undefined` (`undefined` / `void 0`). */
function isUndefinedArg(node) {
  return (
    !node ||
    (node.type === 'Identifier' && node.name === 'undefined') ||
    (node.type === 'UnaryExpression' && node.operator === 'void')
  )
}

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Lexical markdown transformers and default-transformer calls that conflict with Payload features',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      replacedTransformer:
        "Avoid importing '{{name}}' from '{{source}}'. Payload ships its own {{feature}} feature with a dedicated node type, so Lexical's built-in transformer does not match a Payload editor. Use the transformer from Payload's feature instead.",
      headingTransformer:
        "Avoid importing 'HEADING' from '{{source}}'. Lexical's HEADING transformer matches every level (h1-h6), so it ignores the heading levels enabled in a Payload editor's config. Use the heading feature's PAYLOAD_HEADING transformer instead.",
      transformerGroup:
        "Avoid importing '{{name}}' from '{{source}}'. These default groups bundle Lexical's CODE, LINK and heading transformers, which conflict with Payload's features. Build the transformer list from enabled features, or use convertMarkdownToLexical / convertLexicalToMarkdown.",
      defaultTransformerCall:
        "'{{name}}' falls back to Lexical's default TRANSFORMERS when called without a transformer list, and those bundle the CODE, LINK and heading transformers that conflict with Payload. Pass a transformer list built from enabled features, or use convertMarkdownToLexical / convertLexicalToMarkdown.",
    },
    schema: [],
  },
  create(context) {
    /** Local identifier name -> imported (original) name, for the flagged functions. */
    const trackedFunctions = new Map()

    return {
      CallExpression(node) {
        const { callee } = node

        if (callee.type !== 'Identifier' || !trackedFunctions.has(callee.name)) {
          return
        }

        const importedName = trackedFunctions.get(callee.name)
        const transformersArgIndex = DEFAULT_TRANSFORMER_FUNCTIONS.get(importedName)

        // A spread before the transformers position makes the argument index unknown.
        const hasSpreadBeforeTransformers = node.arguments
          .slice(0, transformersArgIndex)
          .some((arg) => arg.type === 'SpreadElement')

        if (hasSpreadBeforeTransformers) {
          return
        }

        if (isUndefinedArg(node.arguments[transformersArgIndex])) {
          context.report({
            node,
            messageId: 'defaultTransformerCall',
            data: { name: importedName },
          })
        }
      },
      ImportDeclaration(node) {
        const source = node.source.value

        if (typeof source !== 'string' || !isLexicalMarkdownSource(source)) {
          return
        }

        // Skip whole `import type { ... }` declarations.
        if (node.importKind === 'type') {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue
          }

          // Skip inline `import { type Foo }` specifiers.
          if (specifier.importKind === 'type') {
            continue
          }

          const name = specifier.imported.name

          if (REPLACED_TRANSFORMERS.has(name)) {
            context.report({
              node: specifier,
              messageId: 'replacedTransformer',
              data: { name, source, feature: name === 'CODE' ? 'code block' : 'link' },
            })
          } else if (name === HEADING_TRANSFORMER) {
            context.report({
              node: specifier,
              messageId: 'headingTransformer',
              data: { source },
            })
          } else if (TRANSFORMER_GROUPS.has(name)) {
            context.report({
              node: specifier,
              messageId: 'transformerGroup',
              data: { name, source },
            })
          } else if (DEFAULT_TRANSFORMER_FUNCTIONS.has(name)) {
            trackedFunctions.set(specifier.local.name, name)
          }
        }
      },
    }
  },
}

export default rule

import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'
import type { ClientBlock } from 'payload'

import type { Transformer } from '../../../../packages/@lexical/markdown/index.js'
import type { MultilineElementTransformer } from '../../../../packages/@lexical/markdown/MarkdownTransformers.js'

import { extractPropsFromJSXPropsString } from '../../../../utilities/jsx/extractPropsFromJSXPropsString.js'
import { propsToJSXString } from '../../../../utilities/jsx/jsx.js'
import { $createBlockNode, $isBlockNode, BlockNode } from '../nodes/BlocksNode.js'
import { getLexicalToMarkdown } from './getLexicalToMarkdown.js'
import { getMarkdownToLexical } from './getMarkdownToLexical.js'

function createTagRegexes(tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    regExpEnd: new RegExp(`</(${escapedTagName})\\s*>|<${escapedTagName}[^>]*?/>`, 'i'),
    regExpStart: new RegExp(`<(${escapedTagName})([^>]*?)\\s*(/?)>`, 'i'),
  }
}
export const getBlockMarkdownTransformers = ({
  blocks,
}: {
  blocks: ClientBlock[]
}): ((props: {
  allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
  allTransformers: Transformer[]
}) => MultilineElementTransformer)[] => {
  if (!blocks?.length) {
    return []
  }

  const transformers: ((props: {
    allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
    allTransformers: Transformer[]
  }) => MultilineElementTransformer)[] = []

  for (const block of blocks) {
    if (!block.jsx) {
      continue
    }
    const regex = createTagRegexes(block.slug)
    transformers.push(({ allNodes, allTransformers }) => ({
      type: 'multiline-element',
      dependencies: [BlockNode],
      export: (node) => {
        if (!$isBlockNode(node)) {
          return null
        }
        if (node.getFields()?.blockType?.toLowerCase() !== block.slug.toLowerCase()) {
          return null
        }

        const nodeFields = node.getFields()
        const lexicalToMarkdown = getLexicalToMarkdown(allNodes, allTransformers)

        const exportResult = block.jsx!.export({
          fields: nodeFields,
          lexicalToMarkdown,
        })
        if (exportResult === false) {
          return null
        }
        if (typeof exportResult === 'string') {
          return exportResult
        }

        if (exportResult?.children?.length) {
          return `<${nodeFields.blockType}${exportResult.props ? ' ' + propsToJSXString({ props: exportResult.props }) : ''}>\n  ${exportResult.children}\n</${nodeFields.blockType}>`
        }

        return `<${nodeFields.blockType}${exportResult.props ? ' ' + propsToJSXString({ props: exportResult.props }) : ''}/>`
      },
      regExpEnd: block.jsx?.customEndRegex ?? regex.regExpEnd,
      regExpStart: block.jsx?.customStartRegex ?? regex.regExpStart,
      replace: (rootNode, children, openMatch, closeMatch, linesInBetween) => {
        if (block?.jsx?.import) {
          if (!linesInBetween) {
            // convert children to linesInBetween
            let line = ''
            if (children) {
              for (const child of children) {
                line += child.getTextContent()
              }
            }

            linesInBetween = [line]
          }

          const childrenString = linesInBetween.join('\n').trim()

          const propsString = openMatch[2]?.trim()

          const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

          const blockFields = block.jsx.import({
            children: childrenString,
            closeMatch: closeMatch as RegExpMatchArray,
            htmlToLexical: null, // TODO
            markdownToLexical,
            openMatch: openMatch as RegExpMatchArray,
            props: propsString
              ? extractPropsFromJSXPropsString({
                  propsString,
                })
              : {},
          })
          if (blockFields === false) {
            return false
          }

          const node = $createBlockNode({
            blockType: block.slug,
            ...blockFields,
            blockName: blockFields.blockName || '',
          })
          if (node) {
            rootNode.append(node)
          }

          return
        }
        return false // Run next transformer
      },
    }))
  }

  return transformers
}

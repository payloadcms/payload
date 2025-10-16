import type { ClientBlock } from 'payload'

import {
  $parseSerializedNode,
  type ElementNode,
  type Klass,
  type LexicalNode,
  type LexicalNodeReplacement,
  type SerializedLexicalNode,
} from 'lexical'

import type { Transformer } from '../../../../packages/@lexical/markdown/index.js'
import type {
  MultilineElementTransformer,
  TextMatchTransformer,
} from '../../../../packages/@lexical/markdown/MarkdownTransformers.js'

import { extractPropsFromJSXPropsString } from '../../../../utilities/jsx/extractPropsFromJSXPropsString.js'
import { propsToJSXString } from '../../../../utilities/jsx/jsx.js'
import { linesFromStartToContentAndPropsString } from '../../server/markdown/linesFromMatchToContentAndPropsString.js'
import { $createBlockNode, $isBlockNode, BlockNode } from '../nodes/BlocksNode.js'
import {
  $createInlineBlockNode,
  $isInlineBlockNode,
  InlineBlockNode,
} from '../nodes/InlineBlocksNode.js'
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
  inlineBlocks,
}: {
  blocks: ClientBlock[]
  inlineBlocks: ClientBlock[]
}): ((props: {
  allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
  allTransformers: Transformer[]
}) => MultilineElementTransformer | TextMatchTransformer)[] => {
  if (!blocks?.length && !inlineBlocks?.length) {
    return []
  }
  let transformers: ((props: {
    allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
    allTransformers: Transformer[]
  }) => MultilineElementTransformer | TextMatchTransformer)[] = []

  if (blocks?.length) {
    for (const block of blocks) {
      const transformer = getMarkdownTransformerForBlock(block, false)

      if (transformer) {
        transformers = transformers.concat(transformer)
      }
    }
  }

  if (inlineBlocks?.length) {
    for (const block of inlineBlocks) {
      const transformer = getMarkdownTransformerForBlock(block, true)

      if (transformer) {
        transformers = transformers.concat(transformer)
      }
    }
  }

  return transformers
}

function getMarkdownTransformerForBlock(
  block: ClientBlock,
  isInlineBlock: boolean,
): Array<
  (props: {
    allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
    allTransformers: Transformer[]
  }) => MultilineElementTransformer | TextMatchTransformer
> | null {
  if (!block.jsx) {
    return null
  }
  const regex = createTagRegexes(block.slug)
  const toReturn: Array<
    (props: {
      allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>
      allTransformers: Transformer[]
    }) => MultilineElementTransformer | TextMatchTransformer
  > = []

  if (isInlineBlock) {
    toReturn.push(({ allNodes, allTransformers }) => ({
      type: 'text-match',
      dependencies: [InlineBlockNode],
      export: (node) => {
        if (!$isInlineBlockNode(node)) {
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

        const hasProps = exportResult.props && Object.keys(exportResult.props)?.length > 0
        const props = exportResult.props ?? {}

        if (exportResult?.children?.length) {
          return `<${nodeFields.blockType}${hasProps ? ' ' + propsToJSXString({ props }) : ''}>${exportResult.children}</${nodeFields.blockType}>`
        }

        return `<${nodeFields.blockType}${hasProps ? ' ' + propsToJSXString({ props }) : ''}/>`
      },
      getEndIndex: (node, match) => {
        const { endlineLastCharIndex } = linesFromStartToContentAndPropsString({
          isEndOptional: false,
          lines: [node.getTextContent()],
          regexpEndRegex: regex.regExpEnd,
          startLineIndex: 0,
          startMatch: match,
          trimChildren: false,
        })

        return endlineLastCharIndex
      },
      importRegExp: block.jsx?.customStartRegex ?? regex.regExpStart,
      regExp: /___ignoreignoreignore___/g,
      replace(node, match) {
        const { content, propsString } = linesFromStartToContentAndPropsString({
          isEndOptional: false,
          lines: [node.getTextContent()],
          regexpEndRegex: regex.regExpEnd,
          startLineIndex: 0,
          startMatch: {
            ...match,
            index: 0,
          },
          trimChildren: false,
        })

        if (!block?.jsx?.import) {
          // No multiline transformer handled this line successfully
          return
        }

        const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

        const blockFields = block.jsx.import({
          children: content,
          closeMatch: null,
          htmlToLexical: null, // TODO
          markdownToLexical,
          openMatch: match,
          props: propsString
            ? extractPropsFromJSXPropsString({
                propsString,
              })
            : {},
        })
        if (blockFields === false) {
          return
        }

        const inlineBlockNode = $createInlineBlockNode({
          blockType: block.slug,
          ...(blockFields as any),
        })

        node.replace(inlineBlockNode)
      },
    }))

    return toReturn
  }

  toReturn.push(({ allNodes, allTransformers }) => ({
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

      const hasProps = exportResult.props && Object.keys(exportResult.props)?.length > 0
      const props = exportResult.props ?? {}

      if (exportResult?.children?.length) {
        const children = exportResult.children
        let sanitizedChildren = ''

        // Ensure it has a leftpad of at least 2 spaces. The data is saved without those spaces, so we can just blindly add it to every child
        if (children.includes('\n')) {
          for (const child of children.split('\n')) {
            let sanitizedChild = ''
            if (!block?.jsx?.doNotTrimChildren && child !== '') {
              sanitizedChild = '  '
            }
            sanitizedChild += child + '\n'

            sanitizedChildren += sanitizedChild
          }
        } else {
          sanitizedChildren = (block?.jsx?.doNotTrimChildren ? '' : '  ') + children + '\n'
        }

        return `<${nodeFields.blockType}${hasProps ? ' ' + propsToJSXString({ props }) : ''}>\n${sanitizedChildren}</${nodeFields.blockType}>`
      }

      return `<${nodeFields.blockType}${hasProps ? ' ' + propsToJSXString({ props }) : ''}/>`
    },
    handleImportAfterStartMatch: block.jsx?.customEndRegex
      ? undefined
      : ({ lines, rootNode, startLineIndex, startMatch, transformer }) => {
          const regexpEndRegex: RegExp | undefined =
            typeof transformer.regExpEnd === 'object' && 'regExp' in transformer.regExpEnd
              ? transformer.regExpEnd.regExp
              : transformer.regExpEnd

          const isEndOptional =
            transformer.regExpEnd &&
            typeof transformer.regExpEnd === 'object' &&
            'optional' in transformer.regExpEnd
              ? transformer.regExpEnd.optional
              : !transformer.regExpEnd

          const {
            afterEndLine,
            beforeStartLine,
            content: unsanitizedContent,
            endLineIndex,
            propsString,
          } = linesFromStartToContentAndPropsString({
            isEndOptional,
            lines,
            regexpEndRegex,
            startLineIndex,
            startMatch,
            trimChildren: false,
          })

          let content = ''

          if (block?.jsx?.doNotTrimChildren) {
            content = unsanitizedContent.endsWith('\n')
              ? unsanitizedContent.slice(0, -1)
              : unsanitizedContent
          } else {
            // Ensure it has a leftpad of at least 2 spaces. The data is saved without those spaces, so we can just blindly add it to every child
            if (unsanitizedContent.includes('\n')) {
              const split = unsanitizedContent.split('\n')
              let index = 0
              for (const child of split) {
                index++

                if (child.startsWith('  ')) {
                  content += child.slice(2)
                } else {
                  // If one child is misaligned, skip aligning completely, unless it's just empty
                  if (child === '') {
                    content += child
                  } else {
                    content = unsanitizedContent.endsWith('\n')
                      ? unsanitizedContent.slice(0, -1)
                      : unsanitizedContent
                    break
                  }
                }

                content += index === split.length ? '' : '\n'
              }
            } else {
              content =
                (!unsanitizedContent.startsWith('  ')
                  ? unsanitizedContent
                  : unsanitizedContent.slice(2)) + '\n'
            }
          }

          if (!block?.jsx?.import) {
            // No multiline transformer handled this line successfully
            return [false, startLineIndex]
          }

          const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

          const blockFields = block.jsx.import({
            children: content,
            closeMatch: null,
            htmlToLexical: null, // TODO
            markdownToLexical,
            openMatch: startMatch,
            props: propsString
              ? extractPropsFromJSXPropsString({
                  propsString,
                })
              : {},
          })
          if (blockFields === false) {
            return [false, startLineIndex]
          }

          const node = $createBlockNode({
            blockType: block.slug,
            ...blockFields,
          } as any)

          if (node) {
            // Now handle beforeStartLine and afterEndLine. If those are not empty, we need to add them as text nodes before and after the block node.
            // However, those themselves can contain other markdown matches, so we need to parse them as well.
            // Example where this is needed: "Hello <InlineCode>inline code</InlineCode> test."
            let prevNodes: null | SerializedLexicalNode[] = null
            let nextNodes: null | SerializedLexicalNode[] = null
            // TODO: Might not need this prevNodes and nextNodes handling if inline nodes are handled by textmatch transformers

            if (beforeStartLine?.length) {
              prevNodes = markdownToLexical({ markdown: beforeStartLine })?.root?.children ?? []

              const firstPrevNode = prevNodes?.[0]
              if (firstPrevNode) {
                rootNode.append($parseSerializedNode(firstPrevNode))
              }
            }

            rootNode.append(node)

            if (afterEndLine?.length) {
              nextNodes = markdownToLexical({ markdown: afterEndLine })?.root?.children
              const lastChild = rootNode.getChildren()[rootNode.getChildren().length - 1]

              const children = ($parseSerializedNode(nextNodes[0]!) as ElementNode)?.getChildren()
              if (children?.length) {
                for (const child of children) {
                  ;(lastChild as ElementNode).append(child)
                }
              }
            }
          }

          return [true, endLineIndex]
        },
    regExpEnd: block.jsx?.customEndRegex ?? regex.regExpEnd,
    regExpStart: block.jsx?.customStartRegex ?? regex.regExpStart,
    // This replace is ONLY run for ``` code blocks (so any blocks with custom start and end regexes). For others, we use the special JSX handling above:
    type: 'multiline-element',
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

        let childrenString = ''
        if (block?.jsx?.doNotTrimChildren) {
          childrenString = linesInBetween.join('\n')
        } else {
          childrenString = linesInBetween.join('\n').trim()
        }

        const propsString = openMatch[1]?.trim()

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
        } as any)

        if (node) {
          rootNode.append(node)
        }

        return
      }
      return false // Run next transformer
    },
  }))

  return toReturn
}

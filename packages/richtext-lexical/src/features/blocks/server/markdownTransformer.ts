import type { TextMatchTransformer, Transformer } from '@lexical/markdown'
import type { ElementNode, SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { Block } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { $parseSerializedNode } from 'lexical'

import type { MultilineElementTransformer } from '../../../utilities/jsx/lexicalMarkdownCopy.js'
import type { NodeWithHooks } from '../../typesServer.js'

import { getEnabledNodesFromServerNodes } from '../../../lexical/nodes/index.js'
import { extractPropsFromJSXPropsString } from '../../../utilities/jsx/extractPropsFromJSXPropsString.js'
import { propsToJSXString } from '../../../utilities/jsx/jsx.js'
import { linesFromStartToContentAndPropsString } from './linesFromMatchToContentAndPropsString.js'
import { $createServerBlockNode, $isServerBlockNode, ServerBlockNode } from './nodes/BlocksNode.js'
import {
  $createServerInlineBlockNode,
  $isServerInlineBlockNode,
  ServerInlineBlockNode,
} from './nodes/InlineBlocksNode.js'

export function createTagRegexes(tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Regex components
  const openingTag = `<${escapedTagName}`
  const closingTag = `</${escapedTagName}`
  const optionalWhitespace = `\\s*`
  const mandatoryClosingBracket = `>`

  // Assembled regex patterns
  const startPattern = `${openingTag}(?=\\s|>|$)` // Only match the tag name
  const endPattern = `${closingTag}${optionalWhitespace}${mandatoryClosingBracket}`

  return {
    regExpEnd: new RegExp(endPattern, 'i'),
    regExpStart: new RegExp(startPattern, 'i'),
  }
}
export const getBlockMarkdownTransformers = ({
  blocks,
  inlineBlocks,
}: {
  blocks: Block[]
  inlineBlocks: Block[]
}): ((props: {
  allNodes: Array<NodeWithHooks>
  allTransformers: Transformer[]
}) => MultilineElementTransformer | TextMatchTransformer)[] => {
  if (!blocks?.length && !inlineBlocks?.length) {
    return []
  }

  let transformers: ((props: {
    allNodes: Array<NodeWithHooks>
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
  block: Block,
  isInlineBlock: boolean,
): Array<
  (props: {
    allNodes: Array<NodeWithHooks>
    allTransformers: Transformer[]
  }) => MultilineElementTransformer | TextMatchTransformer
> | null {
  if (!block.jsx) {
    return null
  }
  const regex = createTagRegexes(block.slug)
  const toReturn: Array<
    (props: {
      allNodes: Array<NodeWithHooks>
      allTransformers: Transformer[]
    }) => MultilineElementTransformer | TextMatchTransformer
  > = []

  if (isInlineBlock) {
    toReturn.push(({ allNodes, allTransformers }) => ({
      type: 'text-match',
      dependencies: [ServerInlineBlockNode],
      export: (node) => {
        if (!$isServerInlineBlockNode(node)) {
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
      regExp: /___ignoreignoreignore___/g,
    }))
  }

  toReturn.push(({ allNodes, allTransformers }) => ({
    dependencies: [ServerBlockNode, ServerInlineBlockNode],
    export: (node) => {
      if (isInlineBlock) {
        if (!$isServerInlineBlockNode(node)) {
          return null
        }
      } else {
        if (!$isServerBlockNode(node)) {
          return null
        }
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

          const { afterEndLine, beforeStartLine, content, endLineIndex, propsString } =
            linesFromStartToContentAndPropsString({
              isEndOptional,
              lines,
              regexpEndRegex,
              startLineIndex,
              startMatch,
            })

          if (block?.jsx?.import) {
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
              return {
                return: [false, startLineIndex],
              }
            }

            const node = isInlineBlock
              ? $createServerInlineBlockNode({
                  blockType: block.slug,
                  ...(blockFields as any),
                })
              : $createServerBlockNode({
                  blockType: block.slug,
                  ...blockFields,
                } as any)

            if (node) {
              // Now handle beforeStartLine and afterEndLine. If those are not empty, we need to add them as text nodes before and after the block node.
              // However, those themselves can contain other markdown matches, so we need to parse them as well.
              // Example where this is needed: "Hello <InlineCode>inline code</InlineCode> test."
              let prevNodes: null | SerializedLexicalNode[] = null
              let nextNodes: null | SerializedLexicalNode[] = null
              if (beforeStartLine?.length) {
                prevNodes = markdownToLexical({ markdown: beforeStartLine })?.root?.children ?? []

                if (prevNodes?.length) {
                  rootNode.append($parseSerializedNode(prevNodes[0]))
                }
              }

              if (rootNode?.getChildren()?.length) {
                // Add node to the last child of the root node
                const lastChild = rootNode.getChildren()[rootNode.getChildren().length - 1]

                ;(lastChild as ElementNode).append(node)
              } else {
                rootNode.append(node)
              }

              if (afterEndLine?.length) {
                nextNodes = markdownToLexical({ markdown: afterEndLine })?.root?.children ?? []
                const lastChild = rootNode.getChildren()[rootNode.getChildren().length - 1]

                ;(lastChild as ElementNode).append(
                  ($parseSerializedNode(nextNodes[0]) as ElementNode)?.getChildren()[0],
                )
              }
            }

            return {
              return: [true, endLineIndex],
            }
          }

          // No multiline transformer handled this line successfully
          return {
            return: [false, startLineIndex],
          }
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

        const childrenString = linesInBetween.join('\n').trim()

        const propsString: null | string = openMatch?.length > 1 ? openMatch[1]?.trim() : null

        const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

        const blockFields = block.jsx.import({
          children: childrenString,
          closeMatch,
          htmlToLexical: null, // TODO
          markdownToLexical,
          openMatch,
          props: propsString
            ? extractPropsFromJSXPropsString({
                propsString,
              })
            : {},
        })
        if (blockFields === false) {
          return false
        }

        const node = isInlineBlock
          ? $createServerInlineBlockNode({
              blockType: block.slug,
              ...(blockFields as any),
            })
          : $createServerBlockNode({
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

export function getMarkdownToLexical(
  allNodes: Array<NodeWithHooks>,
  allTransformers: Transformer[],
): (args: { markdown: string }) => SerializedEditorState {
  const markdownToLexical = ({ markdown }: { markdown: string }): SerializedEditorState => {
    const headlessEditor = createHeadlessEditor({
      nodes: getEnabledNodesFromServerNodes({
        nodes: allNodes,
      }),
    })

    headlessEditor.update(
      () => {
        $convertFromMarkdownString(markdown, allTransformers)
      },
      { discrete: true },
    )

    const editorJSON = headlessEditor.getEditorState().toJSON()

    return editorJSON
  }
  return markdownToLexical
}

export function getLexicalToMarkdown(
  allNodes: Array<NodeWithHooks>,
  allTransformers: Transformer[],
): (args: { editorState: Record<string, any> }) => string {
  const lexicalToMarkdown = ({ editorState }: { editorState: Record<string, any> }): string => {
    const headlessEditor = createHeadlessEditor({
      nodes: getEnabledNodesFromServerNodes({
        nodes: allNodes,
      }),
    })

    try {
      headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState as any)) // This should commit the editor state immediately
    } catch (e) {
      console.error('getLexicalToMarkdown: ERROR parsing editor state', e)
    }

    let markdown: string = ''
    headlessEditor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(allTransformers)
    })

    return markdown
  }
  return lexicalToMarkdown
}

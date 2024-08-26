/* eslint-disable */
import {
  $convertFromMarkdownString,
  type MultilineElementTransformer,
  $convertToMarkdownString,
} from '@lexical/markdown'
import type { Block } from 'payload'
import { $createServerBlockNode, $isServerBlockNode, ServerBlockNode } from './nodes/BlocksNode.js'
import type { Transformer } from '@lexical/markdown'

import { extractPropsFromJSXPropsString, propsToJSXString } from '../../../utilities/jsx.js'

import { createHeadlessEditor } from '@lexical/headless'
import { getEnabledNodesFromServerNodes } from '../../../lexical/nodes/index.js'
import { NodeWithHooks } from '../../typesServer.js'
import { SerializedEditorState } from 'lexical'

function createTagRegexes(tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    regExpStart: new RegExp(`<(${escapedTagName})([^>]*?)\\s*(/?)>`, 'i'),
    regExpEnd: new RegExp(`</(${escapedTagName})\\s*>|<${escapedTagName}[^>]*?/>`, 'i'),
  }
}
export const getBlockMarkdownTransformers = ({
  blocks,
}: {
  blocks: Block[]
}): ((props: {
  allNodes: Array<NodeWithHooks>
  allTransformers: Transformer[]
}) => MultilineElementTransformer)[] => {
  const transformers: ((props: {
    allNodes: Array<NodeWithHooks>
    allTransformers: Transformer[]
  }) => MultilineElementTransformer)[] = []
  if (!blocks?.length) {
    return
  }

  for (const block of blocks) {
    if (!block.jsx) {
      continue
    }
    const regex = createTagRegexes(block.slug)
    transformers.push(({ allTransformers, allNodes }) => ({
      dependencies: [ServerBlockNode],
      export: (node) => {
        if (!$isServerBlockNode(node)) {
          return null
        }
        if (node.getFields()?.blockType?.toLowerCase() !== block.slug.toLowerCase()) {
          return null
        }

        const nodeFields = node.getFields()
        const lexicalToMarkdown = getLexicalToMarkdown(allNodes, allTransformers)

        const exportResult = block.jsx.export({
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
          return `<${nodeFields.blockType} ${propsToJSXString({ props: exportResult.props })}>\n  ${exportResult.children}\n</${nodeFields.blockType}>`
        }

        return `<${nodeFields.blockType} ${propsToJSXString({ props: exportResult.props })}/>`
      },
      regExpEnd: block.jsx?.customEndRegex ?? regex.regExpEnd,
      regExpStart: block.jsx?.customStartRegex ?? regex.regExpStart,
      replace: (rootNode, children, openMatch, closeMatch, linesInBetween) => {
        if (block.jsx.import) {
          const childrenString = linesInBetween.join('\n').trim()

          const propsString: string | null = openMatch?.length > 2 ? openMatch[2]?.trim() : null

          const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

          const blockFields = block.jsx.import({
            children: childrenString,
            props: propsString
              ? extractPropsFromJSXPropsString({
                  propsString,
                })
              : {},
            openMatch,
            closeMatch,
            linesInBetween,
            markdownToLexical: markdownToLexical,
            htmlToLexical: null, // TODO
          })
          if (blockFields === false) {
            return false
          }

          const node = $createServerBlockNode({
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
      type: 'multilineElement',
    }))
  }

  return transformers
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

    let markdown: string
    headlessEditor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(allTransformers)
    })

    return markdown
  }
  return lexicalToMarkdown
}

/* eslint-disable */
import { $convertFromMarkdownString, type MultilineElementTransformer } from '@lexical/markdown'
import type { Block } from 'payload'
import { $createServerBlockNode, $isServerBlockNode, ServerBlockNode } from './nodes/BlocksNode.js'
import type { Transformer } from '@lexical/markdown'

import { extractPropsFromJSXPropsString } from '../../../utilities/jsx.js'

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
        if (node.getTextContent().startsWith('From HTML:')) {
          return `<MyComponent>${node.getTextContent().replace('From HTML: ', '')}</MyComponent>`
        }
        return null // Run next transformer
      },
      regExpEnd: regex.regExpEnd,
      regExpStart: regex.regExpStart,
      replace: (rootNode, openMatch, closeMatch, linesInBetween) => {
        const tag = openMatch[1]?.toLocaleLowerCase()
        if (block.jsx.import) {
          const childrenString = linesInBetween.join('\n').trim()

          const propsString: string | null = openMatch[2]?.trim()

          const markdownToLexical = getMarkdownToLexical(allNodes, allTransformers)

          //console.log('propsString', openMatch, `${tag} `, '1111', propsString)

          const blockFields = block.jsx.import({
            children: childrenString,
            props: propsString
              ? extractPropsFromJSXPropsString({
                  propsString,
                })
              : {},
            markdownToLexical: markdownToLexical,
            htmlToLexical: null, // TODO
          })

          // console.log('blockFields', blockFields)

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
    console.log('ALLNODES', allNodes)
    console.log('ALLTRANSFORMERS', allTransformers)

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

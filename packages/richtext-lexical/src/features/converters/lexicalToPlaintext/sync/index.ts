/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { SerializedLexicalNodeWithParent } from '../shared/types.js'
import type { PlaintextConverters } from './types.js'

import { hasText } from '../../../../validate/hasText.js'
import { findConverterForNode } from '../shared/findConverterForNode.js'

export type ConvertLexicalToPlaintextArgs = {
  /**
   * A map of node types to their corresponding plaintext converter functions.
   * This is optional - if not provided, the following heuristic will be used:
   *
   * - If the node has a `text` property, it will be used as the plaintext.
   * - If the node has a `children` property, the children will be recursively converted to plaintext.
   * - If the node has neither, it will be ignored.
   **/
  converters?: PlaintextConverters
  data: SerializedEditorState
}

export function convertLexicalToPlaintext({
  converters,
  data,
}: ConvertLexicalToPlaintextArgs): string {
  if (hasText(data)) {
    const plaintext = convertLexicalNodesToPlaintext({
      converters: converters ?? {},
      nodes: data?.root?.children,
      parent: data?.root,
    }).join('')

    return plaintext
  }
  return ''
}

export function convertLexicalNodesToPlaintext({
  converters,
  nodes,
  parent,
}: {
  converters: PlaintextConverters
  nodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
}): string[] {
  const plainTextArray: string[] = []

  let i = -1
  for (const node of nodes) {
    i++

    const converter = findConverterForNode({
      converters,
      node,
    })

    if (converter) {
      try {
        const converted =
          typeof converter === 'function'
            ? converter({
                childIndex: i,
                converters,
                node,
                nodesToPlaintext: (args) => {
                  return convertLexicalNodesToPlaintext({
                    converters: args.converters ?? converters,
                    nodes: args.nodes,
                    parent: args.parent ?? {
                      ...node,
                      parent,
                    },
                  })
                },
                parent,
              })
            : converter

        if (converted && typeof converted === 'string') {
          plainTextArray.push(converted)
        }
      } catch (error) {
        console.error('Error converting lexical node to plaintext:', error, 'node:', node)
      }
    } else {
      // Default plaintext converter heuristic
      if (node.type === 'paragraph') {
        if (plainTextArray?.length) {
          // Only add a new line if there is already text in the array
          plainTextArray.push('\n\n')
        }
      } else if (node.type === 'linebreak') {
        plainTextArray.push('\n')
      } else if (node.type === 'tab') {
        plainTextArray.push('\t')
      } else if ('text' in node && node.text) {
        plainTextArray.push(node.text as string)
      }

      if ('children' in node && node.children) {
        plainTextArray.push(
          ...convertLexicalNodesToPlaintext({
            converters,
            nodes: node.children as SerializedLexicalNode[],
            parent: node,
          }),
        )
      }
    }
  }

  return plainTextArray.filter(Boolean)
}

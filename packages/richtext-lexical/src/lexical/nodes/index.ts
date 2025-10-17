import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

import React from 'react'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

export function getEnabledNodes({
  debug,
  editorConfig,
}: {
  debug?: boolean
  editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  const nodes = getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes,
  })

  // Use Node Replacement to override nodes
  return nodes
    .map((node) => {
      if ('getType' in node && node.getType() === 'block' && debug) {
        // Create a custom node class that extends the original
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const OriginalNode = node as any

        class CustomBlockNode extends OriginalNode {
          // Override static methods that create instances to return CustomBlockNode
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          static clone(node: any): any {
            const cloned = super.clone(node)
            // Change prototype to CustomBlockNode
            Object.setPrototypeOf(cloned, CustomBlockNode.prototype)
            return cloned
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          static importJSON(serializedNode: any): any {
            const node = super.importJSON(serializedNode)
            // Change prototype to CustomBlockNode
            Object.setPrototypeOf(node, CustomBlockNode.prototype)
            return node
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          decorate(_editor: any, _config: any): any {
            // Your custom view logic here
            return React.createElement('div', { children: 'DEBUG' })
          }
        }

        // Return a node replacement object
        return {
          replace: OriginalNode,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          with: (node: any) => {
            // Use the parent constructor via the prototype
            const newNode = new OriginalNode({
              cacheBuster: node.__cacheBuster,
              fields: node.__fields,
              format: node.__format,
              // Don't pass key - let Lexical generate a new one
            })
            // Change its prototype to CustomBlockNode
            Object.setPrototypeOf(newNode, CustomBlockNode.prototype)
            return newNode
          },
          withKlass: CustomBlockNode,
        } as unknown as LexicalNodeReplacement
      }

      return node
    })
    .filter(Boolean)
}

export function getEnabledNodesFromServerNodes({
  nodes,
}: {
  nodes: Array<Klass<LexicalNode> | LexicalNodeReplacement> | Array<NodeWithHooks>
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  return nodes.map((node) => {
    if ('node' in node) {
      return node.node
    }
    return node
  })
}

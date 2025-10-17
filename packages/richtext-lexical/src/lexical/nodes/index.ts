import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

import React from 'react'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

/**
 * Apply view overrides to a specific node type
 */
function applyNodeOverride({
  node,
  nodeType,
}: {
  node: Klass<LexicalNode>
  nodeType: string
}): LexicalNodeReplacement | null {
  if (!('getType' in node) || node.getType() !== nodeType) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const OriginalNode = node as any

  // Handle 'block' node type specifically
  if (nodeType === 'block') {
    class CustomBlockNode extends OriginalNode {
      // Override static methods that create instances
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static clone(node: any): any {
        const cloned = super.clone(node)
        Object.setPrototypeOf(cloned, CustomBlockNode.prototype)
        return cloned
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static importJSON(serializedNode: any): any {
        const node = super.importJSON(serializedNode)
        Object.setPrototypeOf(node, CustomBlockNode.prototype)
        return node
      }

      // Override the decorate method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decorate(_editor: any, _config: any): any {
        // Your custom view logic here
        return React.createElement('div', { children: 'DEBUG' })
      }
    }

    return {
      replace: OriginalNode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      with: (node: any) => {
        // BlockNode-specific constructor
        const newNode = new OriginalNode({
          cacheBuster: node.__cacheBuster,
          fields: node.__fields,
          format: node.__format,
        })
        Object.setPrototypeOf(newNode, CustomBlockNode.prototype)
        return newNode
      },
      withKlass: CustomBlockNode,
    } as unknown as LexicalNodeReplacement
  }

  // Add more node types here as needed
  // if (nodeType === 'paragraph') { ... }
  // if (nodeType === 'heading') { ... }

  return null
}

export function getEnabledNodes({
  editorConfig,
  nodeType,
}: {
  editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
  nodeType?: string
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  const nodes = getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes,
  })

  if (!nodeType) {
    return nodes
  }

  // Apply node overrides
  const result: Array<Klass<LexicalNode> | LexicalNodeReplacement> = []

  for (const node of nodes) {
    // Check if it's a node class (not already a replacement object)
    if ('getType' in node) {
      const override = applyNodeOverride({ node, nodeType })
      if (override) {
        result.push(override)
      } else {
        result.push(node)
      }
    } else {
      // It's already a replacement object, keep it
      result.push(node)
    }
  }

  return result
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

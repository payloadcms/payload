import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

import React from 'react'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

export function getEnabledNodes({
  debug,
  editorConfig,
}: {
  debugeditorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  const nodes = getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes,
  })

  // Apply view overrides to node prototypes
  nodes.forEach((node) => {
    if ('getType' in node && node.getType() === 'block') {
      // Store the original decorate method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalDecorate = (node as any).prototype.decorate

      // Override the decorate method on the prototype
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(node as any).prototype.decorate = function (editor: any, config: any): any {
        // Your custom view logic here
        // You can check editorConfig.views to see if there's a custom view for 'block'
        // and render that instead
        if (debug) {
          console.log('DEBUG')
          return React.createElement('div', { children: 'DEBUG' })
        }
        console.log('DEBUG', debug)

        // For now, just call the original
        return originalDecorate.call(this, editor, config)
      }
    }
  })

  return nodes
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

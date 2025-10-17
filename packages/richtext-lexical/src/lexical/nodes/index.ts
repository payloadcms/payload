import type { Klass, LexicalEditor, LexicalNode, LexicalNodeReplacement } from 'lexical'

import React from 'react'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

// Store which editors have view overrides enabled for which node types
const editorNodeOverrides = new WeakMap<LexicalEditor, Set<string>>()

/**
 * Register that an editor should use view overrides for a specific node type
 */
export function registerEditorNodeOverride(editor: LexicalEditor, nodeType: string): void {
  if (!editorNodeOverrides.has(editor)) {
    editorNodeOverrides.set(editor, new Set())
  }
  editorNodeOverrides.get(editor)!.add(nodeType)
}

/**
 * Check if an editor has view overrides enabled for a node type
 */
function hasEditorNodeOverride(editor: LexicalEditor, nodeType: string): boolean {
  const overrides = editorNodeOverrides.get(editor)
  return overrides ? overrides.has(nodeType) : false
}

/**
 * Apply view overrides to a specific node type by modifying its prototype
 * Uses WeakMap to check per-editor at runtime
 */
function applyNodeOverride({
  node,
  nodeType,
}: {
  node: Klass<LexicalNode>
  nodeType: string
}): void {
  if (!('getType' in node) || node.getType() !== nodeType) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NodeClass = node as any

  // Store original methods if not already stored
  if (!NodeClass.prototype._originalDecorate) {
    NodeClass.prototype._originalDecorate = NodeClass.prototype.decorate
  }
  if (!NodeClass.prototype._originalCreateDOM) {
    NodeClass.prototype._originalCreateDOM = NodeClass.prototype.createDOM
  }

  // Override decorate method (for DecoratorNodes)
  if (NodeClass.prototype.decorate && !NodeClass.prototype._decorateOverridden) {
    NodeClass.prototype._decorateOverridden = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NodeClass.prototype.decorate = function (editor: any, config: any): any {
      // Check if THIS editor has overrides enabled
      if (hasEditorNodeOverride(editor, nodeType)) {
        // Your custom view logic here
        return React.createElement('div', { children: `DEBUG: ${nodeType}` })
      }
      // Otherwise use original
      return NodeClass.prototype._originalDecorate.call(this, editor, config)
    }
  }

  // Override createDOM method (for ElementNodes)
  if (NodeClass.prototype.createDOM && !NodeClass.prototype._createDOMOverridden) {
    NodeClass.prototype._createDOMOverridden = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NodeClass.prototype.createDOM = function (config: any, editor: any): HTMLElement {
      const el = NodeClass.prototype._originalCreateDOM.call(this, config, editor)
      // Check if THIS editor has overrides enabled
      if (editor && hasEditorNodeOverride(editor, nodeType)) {
        // Your custom view logic here
        el.style.border = '2px solid red'
      }
      return el
    }
  }
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

  if (nodeType) {
    // Apply node overrides by modifying prototypes (once globally)
    // The overrides check per-editor at runtime using WeakMap
    for (const node of nodes) {
      if ('getType' in node) {
        applyNodeOverride({ node, nodeType })
      }
    }
  }

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

import type {
  EditorConfig,
  Klass,
  LexicalEditor,
  LexicalNode,
  LexicalNodeReplacement,
} from 'lexical'

import React from 'react'

import type { NodeWithHooks } from '../../features/typesServer.js'
import type { LexicalEditorNodeMap } from '../../types.js'
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js'

// Store view definitions for each editor and node type
const editorNodeViews = new WeakMap<LexicalEditor, Map<string, LexicalEditorNodeMap[string]>>()

/**
 * Register view definitions for an editor
 */
export function registerEditorNodeViews(
  editor: LexicalEditor,
  nodeViews: LexicalEditorNodeMap,
): void {
  if (!editorNodeViews.has(editor)) {
    editorNodeViews.set(editor, new Map())
  }
  const editorViews = editorNodeViews.get(editor)!

  // Register each node type's view
  for (const [nodeType, viewDef] of Object.entries(nodeViews)) {
    editorViews.set(nodeType, viewDef)
  }
}

/**
 * Get the view definition for a specific editor and node type
 */
function getEditorNodeView(
  editor: LexicalEditor,
  nodeType: string,
): LexicalEditorNodeMap[string] | undefined {
  const editorViews = editorNodeViews.get(editor)
  return editorViews?.get(nodeType)
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
    NodeClass.prototype.decorate = function (editor: LexicalEditor, config: EditorConfig): any {
      const viewDef = getEditorNodeView(editor, nodeType)

      if (viewDef) {
        // If Component is provided, use it
        if (viewDef.Component) {
          // Call the component function with available context
          return viewDef.Component({ config, editor, node: this })
        }

        // If html is provided (as a function or string), use it
        if (viewDef.html) {
          const htmlContent =
            typeof viewDef.html === 'function'
              ? viewDef.html({ config, editor, node: this })
              : viewDef.html
          return React.createElement('div', {
            dangerouslySetInnerHTML: { __html: htmlContent },
          })
        }
      }

      // Otherwise use original
      return NodeClass.prototype._originalDecorate.call(this, editor, config)
    }
  }

  // Override createDOM method (for ElementNodes)
  if (NodeClass.prototype.createDOM && !NodeClass.prototype._createDOMOverridden) {
    NodeClass.prototype._createDOMOverridden = true
    NodeClass.prototype.createDOM = function (
      config: EditorConfig,
      editor: LexicalEditor,
    ): HTMLElement {
      const viewDef = getEditorNodeView(editor, nodeType)

      if (viewDef) {
        // If createDOM is provided, use it
        if (viewDef.createDOM) {
          return viewDef.createDOM({ config, editor, node: this })
        }

        // If html is provided (as a function or string), create element from it
        if (viewDef.html) {
          const htmlContent =
            typeof viewDef.html === 'function'
              ? viewDef.html({ config, editor, node: this })
              : viewDef.html
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = htmlContent
          return (tempDiv.firstElementChild as HTMLElement) || tempDiv
        }
      }

      // Otherwise use original
      return NodeClass.prototype._originalCreateDOM.call(this, config, editor)
    }
  }
}

export function getEnabledNodes({
  editorConfig,
  nodeViews,
}: {
  editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig
  nodeViews?: LexicalEditorNodeMap
}): Array<Klass<LexicalNode> | LexicalNodeReplacement> {
  const nodes = getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes,
  })

  if (nodeViews) {
    // Apply node overrides by modifying prototypes (once globally)
    // The overrides check per-editor at runtime using WeakMap
    const nodeTypesToOverride = Object.keys(nodeViews)

    for (const node of nodes) {
      if ('getType' in node) {
        const nodeType = node.getType()

        if (nodeTypesToOverride.includes(nodeType)) {
          applyNodeOverride({ node, nodeType })
        }
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

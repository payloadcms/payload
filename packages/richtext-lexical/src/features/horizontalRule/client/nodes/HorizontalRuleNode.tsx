'use client'
import type { DOMConversionOutput, LexicalNode, SerializedLexicalNode } from 'lexical'

import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

import type { SerializedHorizontalRuleNode } from '../../server/nodes/HorizontalRuleNode.js'

import { HorizontalRuleServerNode } from '../../server/nodes/HorizontalRuleNode.js'

export class HorizontalRuleNode extends HorizontalRuleServerNode {
  static override clone(node: HorizontalRuleServerNode): HorizontalRuleServerNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  /**
   * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
   */
  static override importJSON(serializedNode: SerializedHorizontalRuleNode): HorizontalRuleNode {
    return $createHorizontalRuleNode()
  }

  /**
   * Allows you to render a React component within whatever createDOM returns.
   */
  override decorate() {
    return null
  }

  override exportJSON(): SerializedLexicalNode {
    return super.exportJSON()
  }
}

function $convertHorizontalRuleElement(): DOMConversionOutput {
  return { node: $createHorizontalRuleNode() }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return $applyNodeReplacement(new HorizontalRuleNode())
}

export function $isHorizontalRuleNode(
  node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode
}

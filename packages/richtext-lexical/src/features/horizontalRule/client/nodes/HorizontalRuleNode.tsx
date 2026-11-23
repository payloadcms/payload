'use client'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  LexicalNode,
  SerializedLexicalNode,
} from 'lexical'

import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

import type { SerializedHorizontalRuleNode } from '../../server/schema.js'

import { HorizontalRuleServerNode } from '../../server/nodes/HorizontalRuleNode.js'

export class HorizontalRuleNode extends HorizontalRuleServerNode {
  static override clone(node: HorizontalRuleServerNode): HorizontalRuleServerNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  /**
   * Defines what happens if you copy an hr element from another page and paste it into the lexical editor
   *
   * This also determines the behavior of lexical's internal HTML -> Lexical converter
   *
   * Overrides the server implementation so pasting an `<hr>` creates the client
   * {@link HorizontalRuleNode} the editor registered, instead of the server-only
   * `HorizontalRuleServerNode` (which fails lexical's node class identity check).
   */
  static override importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: $convertHorizontalRuleElement,
        priority: 0,
      }),
    }
  }

  /**
   * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
   */
  static override importJSON(
    _serializedNode: Record<string, unknown> & SerializedHorizontalRuleNode,
  ): HorizontalRuleNode {
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

import type { DOMConversionOutput, LexicalNode, SerializedLexicalNode } from 'lexical'

import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

import type { SerializedHorizontalRuleNode } from '../../server/nodes/HorizontalRuleNode.js'

import { HorizontalRuleServerNode } from '../../server/nodes/HorizontalRuleNode.js'

const HorizontalRuleComponent = React.lazy(() =>
  import('../../client/component/index.js').then((module) => ({
    default: module.HorizontalRuleComponent,
  })),
)

export class HorizontalRuleNode extends HorizontalRuleServerNode {
  static clone(node: HorizontalRuleServerNode): HorizontalRuleServerNode {
    return super.clone(node)
  }

  static getType(): string {
    return super.getType()
  }

  /**
   * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
   */
  static importJSON(serializedNode: SerializedHorizontalRuleNode): HorizontalRuleNode {
    return $createHorizontalRuleNode()
  }

  /**
   * Allows you to render a React component within whatever createDOM returns.
   */
  decorate(): React.ReactElement {
    return <HorizontalRuleComponent nodeKey={this.__key} />
  }

  exportJSON(): SerializedLexicalNode {
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

import {
  $applyNodeReplacement,
  $isElementNode,
  type ElementNode,
  type LexicalNode,
  type RangeSelection,
  Spread,
} from 'lexical'

import { type LinkAttributes, LinkNode, type SerializedLinkNode } from './LinkNodeModified'

export type SerializedAutoLinkNode = SerializedLinkNode

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link

export class AutoLinkNode extends LinkNode {
  static clone(node: AutoLinkNode): AutoLinkNode {
    return new AutoLinkNode({ attributes: node.__attributes, key: node.__key })
  }

  static getType(): string {
    return 'autolink'
  }

  static importDOM(): null {
    // TODO: Should link node should handle the import over autolink?
    return null
  }

  static importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
    const node = $createAutoLinkNode({ attributes: serializedNode.attributes })

    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      type: 'autolink',
      version: 1,
    }
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true): ElementNode | null {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection)
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode({ attributes: this.__attributes })
      element.append(linkNode)
      return linkNode
    }
    return null
  }
}

export function $createAutoLinkNode({ attributes }: { attributes: LinkAttributes }): AutoLinkNode {
  return $applyNodeReplacement(new AutoLinkNode({ attributes }))
}
export function $isAutoLinkNode(node: LexicalNode | null | undefined): node is AutoLinkNode {
  return node instanceof AutoLinkNode
}

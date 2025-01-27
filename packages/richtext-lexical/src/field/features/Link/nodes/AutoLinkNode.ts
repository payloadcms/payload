import {
  $applyNodeReplacement,
  $isElementNode,
  type ElementNode,
  type LexicalNode,
  type RangeSelection,
} from 'lexical'

import { type LinkFields, LinkNode, type SerializedLinkNode } from './LinkNode'

export type SerializedAutoLinkNode = SerializedLinkNode

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link

export class AutoLinkNode extends LinkNode {
  static clone(node: AutoLinkNode): AutoLinkNode {
    return new AutoLinkNode({ fields: node.__fields, key: node.__key })
  }

  static getType(): string {
    return 'autolink'
  }

  static importDOM(): null {
    // TODO: Should link node should handle the import over autolink?
    return null
  }

  static importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
    if (
      serializedNode.version === 1 &&
      typeof serializedNode.fields?.doc?.value === 'object' &&
      serializedNode.fields?.doc?.value?.id
    ) {
      serializedNode.fields.doc.value = serializedNode.fields.doc.value.id
      serializedNode.version = 2
    }

    const node = $createAutoLinkNode({ fields: serializedNode.fields })

    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      type: 'autolink',
      version: 2,
    }
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true): ElementNode | null {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection)
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode({ fields: this.__fields })
      element.append(linkNode)
      return linkNode
    }
    return null
  }
}

export function $createAutoLinkNode({ fields }: { fields: LinkFields }): AutoLinkNode {
  return $applyNodeReplacement(new AutoLinkNode({ fields }))
}
export function $isAutoLinkNode(node: LexicalNode | null | undefined): node is AutoLinkNode {
  return node instanceof AutoLinkNode
}

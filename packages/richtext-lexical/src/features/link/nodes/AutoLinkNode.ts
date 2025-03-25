import type { ElementNode, LexicalNode, LexicalUpdateJSON, RangeSelection } from 'lexical'

import { $applyNodeReplacement, $isElementNode } from 'lexical'

import type { LinkFields, SerializedAutoLinkNode } from './types.js'

import { LinkNode } from './LinkNode.js'

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link

export class AutoLinkNode extends LinkNode {
  static override clone(node: AutoLinkNode): AutoLinkNode {
    return new AutoLinkNode({ id: '', fields: node.__fields, key: node.__key })
  }

  static override getType(): string {
    return 'autolink'
  }

  static override importDOM(): null {
    // TODO: Should link node should handle the import over autolink?
    return null
  }

  static override importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
    const node = $createAutoLinkNode({}).updateFromJSON(serializedNode)

    /**
     * @todo remove in 4.0
     */
    if (
      serializedNode.version === 1 &&
      typeof serializedNode.fields?.doc?.value === 'object' &&
      serializedNode.fields?.doc?.value?.id
    ) {
      serializedNode.fields.doc.value = serializedNode.fields.doc.value.id
      serializedNode.version = 2
    }

    return node
  }

  // @ts-expect-error
  exportJSON(): SerializedAutoLinkNode {
    const serialized = super.exportJSON()
    return {
      type: 'autolink',
      children: serialized.children,
      direction: serialized.direction,
      fields: serialized.fields,
      format: serialized.format,
      indent: serialized.indent,
      version: 2,
    }
  }

  override insertNewAfter(selection: RangeSelection, restoreSelection = true): ElementNode | null {
    const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection)
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode({ fields: this.__fields })
      element.append(linkNode)
      return linkNode
    }
    return null
  }

  override updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedAutoLinkNode>): this {
    return super.updateFromJSON(serializedNode).setFields(serializedNode.fields)
  }
}

export function $createAutoLinkNode({ fields }: { fields?: LinkFields }): AutoLinkNode {
  return $applyNodeReplacement(new AutoLinkNode({ id: '', fields }))
}
export function $isAutoLinkNode(node: LexicalNode | null | undefined): node is AutoLinkNode {
  return node instanceof AutoLinkNode
}

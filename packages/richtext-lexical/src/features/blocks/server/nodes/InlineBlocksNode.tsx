import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical'
import type { JsonObject } from 'payload'
import type React from 'react'
import type { JSX } from 'react'

import { addClassNamesToElement } from '@lexical/utils'
import ObjectID from 'bson-objectid'
import { $applyNodeReplacement, DecoratorNode } from 'lexical'

import type { StronglyTypedLeafNode } from '../../../../nodeTypes.js'

export type InlineBlockFields<TInlineBlockFields extends JsonObject = JsonObject> = {
  blockType: string
  id: string
} & TInlineBlockFields

export type SerializedInlineBlockNode<TBlockFields extends JsonObject = JsonObject> = {
  fields: InlineBlockFields<TBlockFields>
} & StronglyTypedLeafNode<SerializedLexicalNode, 'inlineBlock'>

export class ServerInlineBlockNode extends DecoratorNode<null | React.ReactElement> {
  __fields: InlineBlockFields

  constructor({ fields, key }: { fields: InlineBlockFields; key?: NodeKey }) {
    super(key)
    this.__fields = fields
  }

  static override clone(node: ServerInlineBlockNode): ServerInlineBlockNode {
    return new this({
      fields: node.__fields,
      key: node.__key,
    })
  }

  static override getType(): string {
    return 'inlineBlock'
  }

  static override importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {}
  }

  static override importJSON(serializedNode: SerializedInlineBlockNode): ServerInlineBlockNode {
    const node = $createServerInlineBlockNode(serializedNode.fields)
    return node
  }

  static isInline(): false {
    return false
  }

  canIndent() {
    return true
  }

  override createDOM(config?: EditorConfig): HTMLElement {
    const element = document.createElement('span')
    addClassNamesToElement(element, config?.theme?.inlineBlock)
    element.setAttribute('data-block-id', this.__fields.id)
    return element
  }

  override decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element | null {
    return null
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.classList.add('inline-block-container')

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  override exportJSON(): SerializedInlineBlockNode {
    return {
      type: 'inlineBlock',
      fields: this.getStaleFields(),
      version: 1,
    }
  }

  /**
   * Returns the node's in-memory field data. This may be stale — the parent
   * document form state at `{richTextPath}.{nodeId}.*` is the source of truth.
   * Stale data is synced back into the node on document save via the
   * `beforeChange` hook.
   */
  getStaleFields(): InlineBlockFields {
    return this.getLatest().__fields
  }

  override getTextContent(): string {
    return `Block Field`
  }

  override isInline() {
    return true
  }

  setFields(fields: InlineBlockFields): void {
    const writable = this.getWritable()
    writable.__fields = fields
  }

  override updateDOM(): boolean {
    return false
  }
}

export function $createServerInlineBlockNode(
  fields: Exclude<InlineBlockFields, 'id'>,
): ServerInlineBlockNode {
  return $applyNodeReplacement(
    new ServerInlineBlockNode({
      fields: {
        ...fields,
        id: fields?.id || new ObjectID.default().toHexString(),
      },
    }),
  )
}

export function $isServerInlineBlockNode(
  node: LexicalNode | null | ServerInlineBlockNode | undefined,
): node is ServerInlineBlockNode {
  return node instanceof ServerInlineBlockNode
}

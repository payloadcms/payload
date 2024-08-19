import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import type React from 'react'
import type { JSX } from 'react'

import ObjectID from 'bson-objectid'
import { DecoratorNode } from 'lexical'
import { deepCopyObjectSimple } from 'payload/shared'

export type InlineBlockFields = {
  /** Block form data */
  [key: string]: any
  //blockName: string
  blockType: string
  id: string
}

export type SerializedServerInlineBlockNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    fields: InlineBlockFields
    type: 'inlineBlock'
  },
  SerializedLexicalNode
>

export class ServerInlineBlockNode extends DecoratorNode<React.ReactElement> {
  __fields: InlineBlockFields

  constructor({ fields, key }: { fields: InlineBlockFields; key?: NodeKey }) {
    super(key)
    this.__fields = fields
  }

  static clone(node: ServerInlineBlockNode): ServerInlineBlockNode {
    return new this({
      fields: node.__fields,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'inlineBlock'
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {}
  }

  static importJSON(serializedNode: SerializedServerInlineBlockNode): ServerInlineBlockNode {
    const node = $createServerInlineBlockNode(serializedNode.fields)
    return node
  }

  static isInline(): false {
    return false
  }

  canIndent() {
    return true
  }
  createDOM() {
    const element = document.createElement('span')
    element.classList.add('inline-block-container')

    return element
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return null
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.classList.add('inline-block-container')

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  exportJSON(): SerializedServerInlineBlockNode {
    return {
      type: 'inlineBlock',
      fields: this.getFields(),
      version: 1,
    }
  }

  getFields(): InlineBlockFields {
    return this.getLatest().__fields
  }

  getTextContent(): string {
    return `Block Field`
  }

  isInline() {
    return true
  }

  setFields(fields: InlineBlockFields): void {
    const fieldsCopy = deepCopyObjectSimple(fields)

    const writable = this.getWritable()
    writable.__fields = fieldsCopy
  }

  updateDOM(): boolean {
    return false
  }
}

export function $createServerInlineBlockNode(
  fields: Exclude<InlineBlockFields, 'id'>,
): ServerInlineBlockNode {
  return new ServerInlineBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isServerInlineBlockNode(
  node: LexicalNode | ServerInlineBlockNode | null | undefined,
): node is ServerInlineBlockNode {
  return node instanceof ServerInlineBlockNode
}

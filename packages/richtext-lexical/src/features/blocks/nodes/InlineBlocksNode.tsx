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

import ObjectID from 'bson-objectid'
import { DecoratorNode } from 'lexical'
import React, { type JSX } from 'react'

export type InlineBlockFields = {
  /** Block form data */
  [key: string]: any
  //blockName: string
  blockType: string
  id: string
}

const InlineBlockComponent = React.lazy(() =>
  import('../componentInline/index.js').then((module) => ({
    default: module.InlineBlockComponent,
  })),
)

export type SerializedInlineBlockNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    fields: InlineBlockFields
    type: 'inlineBlock'
  },
  SerializedLexicalNode
>

export class InlineBlockNode extends DecoratorNode<React.ReactElement> {
  __fields: InlineBlockFields

  constructor({ fields, key }: { fields: InlineBlockFields; key?: NodeKey }) {
    super(key)
    this.__fields = fields
  }

  static clone(node: InlineBlockNode): InlineBlockNode {
    return new InlineBlockNode({
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

  static importJSON(serializedNode: SerializedInlineBlockNode): InlineBlockNode {
    const node = $createInlineBlockNode(serializedNode.fields)
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
    return <InlineBlockComponent formData={this.getFields()} nodeKey={this.getKey()} />
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.classList.add('inline-block-container')

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  exportJSON(): SerializedInlineBlockNode {
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
    const fieldsCopy = JSON.parse(JSON.stringify(fields)) as InlineBlockFields

    const writable = this.getWritable()
    writable.__fields = fieldsCopy
  }

  updateDOM(): boolean {
    return false
  }
}

export function $createInlineBlockNode(fields: Exclude<InlineBlockFields, 'id'>): InlineBlockNode {
  return new InlineBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isInlineBlockNode(
  node: InlineBlockNode | LexicalNode | null | undefined,
): node is InlineBlockNode {
  return node instanceof InlineBlockNode
}

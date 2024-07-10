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

export type Fields = {
  [key: string]: any
}

const InlineFieldsComponent = React.lazy(() =>
  import('../component/index.js').then((module) => ({
    default: module.InlineFieldsComponent,
  })),
)

export type InlineFieldsData = {
  fields: Fields
  id: string
  key: string
}

export type SerializedInlineFieldsNode = Spread<
  InlineFieldsData,
  Spread<
    {
      children?: never // required so that our typed editor state doesn't automatically add children
      type: 'inlineFields'
    },
    SerializedLexicalNode
  >
>

export class InlineFieldsNode extends DecoratorNode<React.ReactElement> {
  __fields: Fields
  __fieldsId: string
  __fieldsKey: string

  constructor({
    id,
    fields,
    fieldsKey,
    key,
  }: {
    fields: Fields
    fieldsKey: string
    id: string
    key?: NodeKey
  }) {
    super(key)
    this.__fields = fields
    this.__fieldsId = id
    this.__fieldsKey = fieldsKey
  }

  static clone(node: InlineFieldsNode): InlineFieldsNode {
    return new InlineFieldsNode({
      id: node.__fieldsId,
      fields: node.__fields,
      fieldsKey: node.__fieldsKey,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'inlineFields'
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {}
  }

  static importJSON(serializedNode: SerializedInlineFieldsNode): InlineFieldsNode {
    const node = $createInlineFieldsNode({
      id: serializedNode.id,
      fields: serializedNode.fields,
      fieldsKey: serializedNode.key,
    })
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
    element.classList.add('inline-fields-container')

    return element
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <InlineFieldsComponent
        fieldsKey={this.getFieldsKey()}
        formData={this.getFields()}
        nodeKey={this.getKey()}
      />
    )
  }
  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')

    element.classList.add('inline-fields-container')

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  exportJSON(): SerializedInlineFieldsNode {
    return {
      id: this.getFieldsId(),
      type: 'inlineFields',
      fields: this.getFields(),
      key: this.getFieldsKey(),
      version: 1,
    }
  }

  getFields(): Fields {
    return this.getLatest().__fields
  }

  getFieldsId(): string {
    return this.getLatest().__fieldsId
  }

  getFieldsKey(): string {
    return this.getLatest().__fieldsKey
  }

  getTextContent(): string {
    return `Inline Fields`
  }

  isInline() {
    return true
  }
  setFields(fields: Fields): void {
    const fieldsCopy = JSON.parse(JSON.stringify(fields)) as Fields

    const writable = this.getWritable()
    writable.__fields = fieldsCopy
  }
  updateDOM(): boolean {
    return false
  }
}

export function $createInlineFieldsNode(props: {
  fields: Fields
  fieldsKey: string
  id?: string
}): InlineFieldsNode {
  return new InlineFieldsNode({
    id: props?.id || new ObjectID.default().toHexString(),
    fields: props.fields,
    fieldsKey: props.fieldsKey,
  })
}

export function $isInlineFieldsNode(
  node: InlineFieldsNode | LexicalNode | null | undefined,
): node is InlineFieldsNode {
  return node instanceof InlineFieldsNode
}

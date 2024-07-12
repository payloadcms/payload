import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import ObjectID from 'bson-objectid'
import React, { type JSX } from 'react'

export type BlockFields<TBlockFields extends object = Record<string, unknown>> = {
  /** Block form data */
  blockName: string
  blockType: string
  id: string
} & TBlockFields

const BlockComponent = React.lazy(() =>
  import('../component/index.js').then((module) => ({
    default: module.BlockComponent,
  })),
)

export type SerializedBlockNode<TBlockFields extends object = Record<string, unknown>> = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    fields: BlockFields<TBlockFields>
    type: 'block'
  },
  SerializedDecoratorBlockNode
>

export class BlockNode extends DecoratorBlockNode {
  __fields: BlockFields

  constructor({
    fields,
    format,
    key,
  }: {
    fields: BlockFields
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__fields = fields
  }

  static clone(node: BlockNode): BlockNode {
    return new BlockNode({
      fields: node.__fields,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'block'
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {}
  }

  static importJSON(serializedNode: SerializedBlockNode): BlockNode {
    if (serializedNode.version === 1) {
      // Convert (version 1 had the fields wrapped in another, unnecessary data property)
      serializedNode = {
        ...serializedNode,
        fields: {
          ...(serializedNode as any).fields.data,
        },
        version: 2,
      }
    }
    const node = $createBlockNode(serializedNode.fields)
    node.setFormat(serializedNode.format)
    return node
  }

  static isInline(): false {
    return false
  }
  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <BlockComponent formData={this.getFields()} nodeKey={this.getKey()} />
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  exportJSON(): SerializedBlockNode {
    return {
      ...super.exportJSON(),
      type: 'block',
      fields: this.getFields(),
      version: 2,
    }
  }

  getFields(): BlockFields {
    return this.getLatest().__fields
  }

  getTextContent(): string {
    return `Block Field`
  }

  setFields(fields: BlockFields): void {
    const fieldsCopy = JSON.parse(JSON.stringify(fields)) as BlockFields

    const writable = this.getWritable()
    writable.__fields = fieldsCopy
  }
}

export function $createBlockNode(fields: Exclude<BlockFields, 'id'>): BlockNode {
  return new BlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isBlockNode(node: BlockNode | LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode
}

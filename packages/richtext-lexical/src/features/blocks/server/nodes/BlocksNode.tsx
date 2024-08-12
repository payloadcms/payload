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
import type { JsonObject } from 'payload'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import ObjectID from 'bson-objectid'
import { deepCopyObjectSimple } from 'payload/shared'

export type BlockFields<TBlockFields extends JsonObject = JsonObject> = {
  /** Block form data */
  blockName: string
  blockType: string
  id: string
} & TBlockFields

export type SerializedBlockNode<TBlockFields extends JsonObject = JsonObject> = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    fields: BlockFields<TBlockFields>
    type: 'block'
  },
  SerializedDecoratorBlockNode
>

export class ServerBlockNode extends DecoratorBlockNode {
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

  static clone(node: ServerBlockNode): ServerBlockNode {
    return new this({
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

  static importJSON(serializedNode: SerializedBlockNode): ServerBlockNode {
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
    const node = $createServerBlockNode(serializedNode.fields)
    node.setFormat(serializedNode.format)
    return node
  }

  static isInline(): false {
    return false
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return null
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
    const fieldsCopy = deepCopyObjectSimple(fields)

    const writable = this.getWritable()
    writable.__fields = fieldsCopy
  }
}

export function $createServerBlockNode(fields: Exclude<BlockFields, 'id'>): ServerBlockNode {
  return new ServerBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isServerBlockNode(
  node: LexicalNode | ServerBlockNode | null | undefined,
): node is ServerBlockNode {
  return node instanceof ServerBlockNode
}

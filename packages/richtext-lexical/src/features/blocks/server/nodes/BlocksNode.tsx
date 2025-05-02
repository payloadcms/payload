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

type BaseBlockFields<TBlockFields extends JsonObject = JsonObject> = {
  /** Block form data */
  blockName: string
  blockType: string
} & TBlockFields

export type BlockFields<TBlockFields extends JsonObject = JsonObject> = {
  id: string
} & BaseBlockFields<TBlockFields>

export type BlockFieldsOptionalID<TBlockFields extends JsonObject = JsonObject> = {
  id?: string
} & BaseBlockFields<TBlockFields>

export type SerializedBlockNode<TBlockFields extends JsonObject = JsonObject> = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    fields: BlockFields<TBlockFields>
    type: 'block'
  },
  SerializedDecoratorBlockNode
>

export class ServerBlockNode extends DecoratorBlockNode {
  __cacheBuster: number
  __fields: BlockFields

  constructor({
    cacheBuster,
    fields,
    format,
    key,
  }: {
    cacheBuster?: number
    fields: BlockFields
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__fields = fields
    this.__cacheBuster = cacheBuster || 0
  }

  static override clone(node: ServerBlockNode): ServerBlockNode {
    return new this({
      cacheBuster: node.__cacheBuster,
      fields: node.__fields,
      format: node.__format,
      key: node.__key,
    })
  }

  static override getType(): string {
    return 'block'
  }

  static override importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {}
  }

  static override importJSON(serializedNode: SerializedBlockNode): ServerBlockNode {
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

  override decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return null as unknown as JSX.Element
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div')

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  override exportJSON(): SerializedBlockNode {
    return {
      ...super.exportJSON(),
      type: 'block',
      fields: this.getFields(),
      version: 2,
    }
  }

  getCacheBuster(): number {
    return this.getLatest().__cacheBuster
  }

  getFields(): BlockFields {
    return this.getLatest().__fields
  }

  override getTextContent(): string {
    return `Block Field`
  }

  setFields(fields: BlockFields, preventFormStateUpdate?: boolean): void {
    const writable = this.getWritable()
    writable.__fields = fields
    if (!preventFormStateUpdate) {
      writable.__cacheBuster++
    }
  }
}

export function $createServerBlockNode(fields: BlockFieldsOptionalID): ServerBlockNode {
  return new ServerBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isServerBlockNode(
  node: LexicalNode | null | ServerBlockNode | undefined,
): node is ServerBlockNode {
  return node instanceof ServerBlockNode
}

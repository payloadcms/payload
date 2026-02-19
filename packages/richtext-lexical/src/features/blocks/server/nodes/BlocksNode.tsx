import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type { JsonObject } from 'payload'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import { addClassNamesToElement } from '@lexical/utils'
import ObjectID from 'bson-objectid'
import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type ElementFormatType,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from 'lexical'

import type { StronglyTypedLeafNode } from '../../../../nodeTypes.js'

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

export type SerializedBlockNode<TBlockFields extends JsonObject = JsonObject> = {
  fields: BlockFields<TBlockFields>
} & StronglyTypedLeafNode<SerializedDecoratorBlockNode, 'block'>

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

  static override clone(node: ServerBlockNode): ServerBlockNode {
    return new this({
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

  override createDOM(config?: EditorConfig): HTMLElement {
    const element = document.createElement('div')
    addClassNamesToElement(element, config?.theme?.block)
    element.setAttribute('data-block-id', this.__fields.id)
    return element
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
      fields: this.getStaleFields(),
      version: 2,
    }
  }

  /**
   * Returns the node's in-memory field data. This may be stale — the parent
   * document form state at `{richTextPath}.{nodeId}.*` is the source of truth.
   * Stale data is synced back into the node on document save via the
   * `beforeChange` hook.
   */
  getStaleFields(): BlockFields {
    return this.getLatest().__fields
  }

  override getTextContent(): string {
    return `Block Field`
  }

  setFields(fields: BlockFields): void {
    const writable = this.getWritable()
    writable.__fields = fields
  }
}

export function $createServerBlockNode(fields: BlockFieldsOptionalID): ServerBlockNode {
  return $applyNodeReplacement(
    new ServerBlockNode({
      fields: {
        ...fields,
        id: fields?.id || new ObjectID.default().toHexString(),
      },
    }),
  )
}

export function $isServerBlockNode(
  node: LexicalNode | null | ServerBlockNode | undefined,
): node is ServerBlockNode {
  return node instanceof ServerBlockNode
}

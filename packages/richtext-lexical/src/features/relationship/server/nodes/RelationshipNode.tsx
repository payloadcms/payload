import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical'
import type { CollectionSlug, DataFromCollectionSlug } from 'payload'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'

export type RelationshipData = {
  [TCollectionSlug in CollectionSlug]: {
    relationTo: TCollectionSlug
    value: DataFromCollectionSlug<TCollectionSlug> | number | string
  }
}[CollectionSlug]

export type SerializedRelationshipNode = {
  children?: never // required so that our typed editor state doesn't automatically add children
  type: 'relationship'
} & Spread<RelationshipData, SerializedDecoratorBlockNode>

function $relationshipElementToServerNode(domNode: HTMLDivElement): DOMConversionOutput | null {
  const id = domNode.getAttribute('data-lexical-relationship-id')
  const relationTo = domNode.getAttribute('data-lexical-relationship-relationTo')

  if (id != null && relationTo != null) {
    const node = $createServerRelationshipNode({
      relationTo,
      value: id,
    })
    return { node }
  }
  return null
}

export class RelationshipServerNode extends DecoratorBlockNode {
  __data: RelationshipData

  constructor({
    data,
    format,
    key,
  }: {
    data: RelationshipData
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__data = data
  }

  static override clone(node: RelationshipServerNode): RelationshipServerNode {
    return new this({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static override getType(): string {
    return 'relationship'
  }

  static override importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (
          !domNode.hasAttribute('data-lexical-relationship-relationTo') ||
          !domNode.hasAttribute('data-lexical-relationship-id')
        ) {
          return null
        }
        return {
          conversion: $relationshipElementToServerNode,
          priority: 2,
        }
      },
    }
  }

  static override importJSON(serializedNode: SerializedRelationshipNode): RelationshipServerNode {
    if (serializedNode.version === 1 && (serializedNode?.value as unknown as { id: string })?.id) {
      serializedNode.value = (serializedNode.value as unknown as { id: string }).id
    }

    const importedData: RelationshipData = {
      relationTo: serializedNode.relationTo,
      value: serializedNode.value,
    }
    const node = $createServerRelationshipNode(importedData)
    node.setFormat(serializedNode.format)
    return node
  }

  static isInline(): false {
    return false
  }

  override decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return null as unknown as JSX.Element
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute(
      'data-lexical-relationship-id',
      String(typeof this.__data?.value === 'object' ? this.__data?.value?.id : this.__data?.value),
    )
    element.setAttribute('data-lexical-relationship-relationTo', this.__data?.relationTo)

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  override exportJSON(): SerializedRelationshipNode {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: 'relationship',
      version: 2,
    }
  }

  getData(): RelationshipData {
    return this.getLatest().__data
  }

  override getTextContent(): string {
    return `${this.__data?.relationTo} relation to ${typeof this.__data?.value === 'object' ? this.__data?.value?.id : this.__data?.value}`
  }

  setData(data: RelationshipData): void {
    const writable = this.getWritable()
    writable.__data = data
  }
}

export function $createServerRelationshipNode(data: RelationshipData): RelationshipServerNode {
  return new RelationshipServerNode({
    data,
  })
}

export function $isServerRelationshipNode(
  node: LexicalNode | null | RelationshipServerNode | undefined,
): node is RelationshipServerNode {
  return node instanceof RelationshipServerNode
}

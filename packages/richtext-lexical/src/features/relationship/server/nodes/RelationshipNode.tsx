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
import type { CollectionSlug } from 'payload'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'

export type RelationshipData = {
  relationTo: CollectionSlug
  value: number | string
}

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

  static clone(node: RelationshipServerNode): RelationshipServerNode {
    return new this({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'relationship'
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
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

  static importJSON(serializedNode: SerializedRelationshipNode): RelationshipServerNode {
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

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return null
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-relationship-id', String(this.__data?.value))
    element.setAttribute('data-lexical-relationship-relationTo', this.__data?.relationTo)

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  exportJSON(): SerializedRelationshipNode {
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

  getTextContent(): string {
    return `${this.__data?.relationTo} relation to ${this.__data?.value}`
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
  node: LexicalNode | RelationshipServerNode | null | undefined,
): node is RelationshipServerNode {
  return node instanceof RelationshipServerNode
}

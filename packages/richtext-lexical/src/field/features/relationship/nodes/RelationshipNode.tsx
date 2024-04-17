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

import lexicalDecoratorBlockNodeImport from '@lexical/react/LexicalDecoratorBlockNode.js'
const { DecoratorBlockNode } = lexicalDecoratorBlockNodeImport

import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'

import * as React from 'react'

const RelationshipComponent = React.lazy(() =>
  import('./components/RelationshipComponent.js').then((module) => ({
    default: module.RelationshipComponent,
  })),
)

export type RelationshipData = {
  relationTo: string
  value: number | string
}

export type SerializedRelationshipNode = Spread<RelationshipData, SerializedDecoratorBlockNode>

function relationshipElementToNode(domNode: HTMLDivElement): DOMConversionOutput | null {
  const id = domNode.getAttribute('data-lexical-relationship-id')
  const relationTo = domNode.getAttribute('data-lexical-relationship-relationTo')

  if (id != null && relationTo != null) {
    const node = $createRelationshipNode({
      relationTo,
      value: id,
    })
    return { node }
  }
  return null
}

export class RelationshipNode extends DecoratorBlockNode {
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

  static clone(node: RelationshipNode): RelationshipNode {
    return new RelationshipNode({
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
          conversion: relationshipElementToNode,
          priority: 2,
        }
      },
    }
  }

  static importJSON(serializedNode: SerializedRelationshipNode): RelationshipNode {
    if (serializedNode.version === 1 && (serializedNode?.value as unknown as { id: string })?.id) {
      serializedNode.value = (serializedNode.value as unknown as { id: string }).id
    }

    const importedData: RelationshipData = {
      relationTo: serializedNode.relationTo,
      value: serializedNode.value,
    }
    const node = $createRelationshipNode(importedData)
    node.setFormat(serializedNode.format)
    return node
  }

  static isInline(): false {
    return false
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <RelationshipComponent
        className={config.theme.relationship ?? 'LexicalEditorTheme__relationship'}
        data={this.__data}
        format={this.__format}
        nodeKey={this.getKey()}
      />
    )
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
      type: this.getType(),
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

export function $createRelationshipNode(data: RelationshipData): RelationshipNode {
  return new RelationshipNode({
    data,
  })
}

export function $isRelationshipNode(
  node: LexicalNode | RelationshipNode | null | undefined,
): node is RelationshipNode {
  return node instanceof RelationshipNode
}

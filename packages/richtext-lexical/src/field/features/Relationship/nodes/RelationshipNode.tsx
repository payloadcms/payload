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

import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode'
import * as React from 'react'

import { RelationshipComponent } from './components/RelationshipComponent'

export type RelationshipFields = {
  data: null | unknown
  id: string
  relationTo: string
}

export type SerializedRelationshipNode = Spread<
  {
    fields: RelationshipFields
  },
  SerializedDecoratorBlockNode
>

function relationshipElementToNode(domNode: HTMLDivElement): DOMConversionOutput | null {
  const id = domNode.getAttribute('data-lexical-relationship-id')
  const relationTo = domNode.getAttribute('data-lexical-relationship-relationTo')

  if (id != null && relationTo != null) {
    const node = $createRelationshipNode({
      id,
      data: null,
      relationTo,
    })
    return { node }
  }
  return null
}

export class RelationshipNode extends DecoratorBlockNode {
  __fields: RelationshipFields

  constructor({
    fields,
    format,
    key,
  }: {
    fields: RelationshipFields
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__fields = fields
  }

  static clone(node: RelationshipNode): RelationshipNode {
    return new RelationshipNode({
      fields: node.__fields,
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
    const node = $createRelationshipNode(serializedNode.fields)
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
        fields={this.__fields}
        format={this.__format}
        nodeKey={this.getKey()}
      />
    )
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-relationship-id', this.__fields?.id)
    element.setAttribute('data-lexical-relationship-relationTo', this.__fields?.relationTo)

    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  exportJSON(): SerializedRelationshipNode {
    return {
      ...super.exportJSON(),
      fields: this.getFields(),
      type: this.getType(),
      version: 1,
    }
  }

  getFields(): RelationshipFields {
    return this.getLatest().__fields
  }

  getId(): string {
    return this.__id
  }

  getTextContent(): string {
    return `${this?.__fields?.relationTo} relation to ${this.__fields?.id}`
  }

  setFields(fields: RelationshipFields): void {
    const writable = this.getWritable()
    writable.__fields = fields
  }
}

export function $createRelationshipNode(fields: RelationshipFields): RelationshipNode {
  return new RelationshipNode({
    fields,
  })
}

export function $isRelationshipNode(
  node: LexicalNode | RelationshipNode | null | undefined,
): node is RelationshipNode {
  return node instanceof RelationshipNode
}

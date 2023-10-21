'use client'
import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
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

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import ObjectID from 'bson-objectid'
import React from 'react'

import { BlockComponent } from '../component'

export type BlockFields = {
  /** Block data */
  data: {
    [key: string]: any
    blockName: string
    blockType: string
    id?: string
  }
}

export type SerializedBlockNode = Spread<
  {
    fields: BlockFields
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
    const node = $createBlockNode(serializedNode.fields)
    node.setFormat(serializedNode.format)
    return node
  }

  static isInline(): false {
    return false
  }
  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <BlockComponent
        className={config.theme.block ?? 'LexicalEditorTheme__block'}
        fields={this.__fields}
        format={this.__format}
        nodeKey={this.getKey()}
      />
    )
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
      fields: this.getFields(),
      type: this.getType(),
      version: 1,
    }
  }

  getFields(): BlockFields {
    return this.getLatest().__fields
  }
  getId(): string {
    return this.__id
  }

  getTextContent(): string {
    return `Block Field`
  }

  setFields(fields: BlockFields): void {
    const writable = this.getWritable()
    writable.__fields = fields
  }
}

export function $createBlockNode(fields: Exclude<BlockFields, 'id'>): BlockNode {
  return new BlockNode({
    fields: {
      ...fields,
      data: {
        ...fields.data,
        id: fields?.data?.id || new ObjectID().toHexString(),
      },
    },
  })
}

export function $isBlockNode(node: BlockNode | LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode
}

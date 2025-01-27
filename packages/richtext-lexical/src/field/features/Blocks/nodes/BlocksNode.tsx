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

import { transformInputFormData } from '../utils/transformInputFormData'

export type BlockFields = {
  /** Block form data */
  [key: string]: any
  blockName: string
  blockType: string
  id: string
}

const BlockComponent = React.lazy(() =>
  // @ts-expect-error TypeScript being dumb
  import('../component').then((module) => ({
    default: module.BlockComponent,
  })),
)

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
    const blockFieldWrapperName = this.getFields().blockType + '-' + this.getFields().id
    const transformedFormData = transformInputFormData(this.getFields(), blockFieldWrapperName)

    return (
      <BlockComponent
        blockFieldWrapperName={blockFieldWrapperName}
        formData={transformedFormData}
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
      type: this.getType(),
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
    let fieldsCopy = JSON.parse(JSON.stringify(fields)) as BlockFields
    // Possibly transform fields
    const blockFieldWrapperName = fieldsCopy.blockType + '-' + fieldsCopy.id
    if (fieldsCopy[blockFieldWrapperName]) {
      fieldsCopy = {
        id: fieldsCopy.id,
        blockName: fieldsCopy.blockName,
        blockType: fieldsCopy.blockType,
        ...fieldsCopy[blockFieldWrapperName],
      }
      delete fieldsCopy[blockFieldWrapperName]
    }

    const writable = this.getWritable()
    writable.__fields = fieldsCopy
  }
}

export function $createBlockNode(fields: Exclude<BlockFields, 'id'>): BlockNode {
  return new BlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID().toHexString(),
    },
  })
}

export function $isBlockNode(node: BlockNode | LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode
}

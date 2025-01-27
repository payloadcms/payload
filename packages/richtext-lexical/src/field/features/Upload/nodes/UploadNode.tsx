import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import type { ElementFormatType, NodeKey } from 'lexical'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type Spread,
} from 'lexical'
import * as React from 'react'

// @ts-expect-error TypeScript being dumb
const RawUploadComponent = React.lazy(async () => await import('../component'))

export interface RawUploadPayload {
  fields: {
    // unknown, custom fields:
    [key: string]: unknown
  }
  id: string
  relationTo: string
}

export type UploadData = {
  fields: {
    // unknown, custom fields:
    [key: string]: unknown
  }
  relationTo: string
  value: {
    // Actual upload data, populated in afterRead hook
    [key: string]: unknown
    id: string
  }
}

function convertUploadElement(domNode: Node): DOMConversionOutput | null {
  //if (domNode instanceof HTMLImageElement) {
  // const { alt: altText, src } = domNode;
  // const node = $createImageNode({ altText, src });
  // return { node };
  // TODO: Auto-upload functionality here!
  //}
  return null
}

export type SerializedUploadNode = Spread<UploadData, SerializedDecoratorBlockNode>

export class UploadNode extends DecoratorBlockNode {
  __data: UploadData

  constructor({
    data,
    format,
    key,
  }: {
    data: UploadData
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__data = data
  }

  static clone(node: UploadNode): UploadNode {
    return new UploadNode({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'upload'
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertUploadElement,
        priority: 0,
      }),
    }
  }

  static importJSON(serializedNode: SerializedUploadNode): UploadNode {
    const importedData: UploadData = {
      fields: serializedNode.fields,
      relationTo: serializedNode.relationTo,
      value: serializedNode.value,
    }

    const node = $createUploadNode({ data: importedData })
    node.setFormat(serializedNode.format)

    return node
  }

  static isInline(): false {
    return false
  }

  decorate(): JSX.Element {
    return <RawUploadComponent data={this.__data} format={this.__format} nodeKey={this.getKey()} />
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    // element.setAttribute('src', this.__src);
    // element.setAttribute('alt', this.__altText); //TODO
    return { element }
  }

  exportJSON(): SerializedUploadNode {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: this.getType(),
      version: 1,
    }
  }

  getData(): UploadData {
    return this.getLatest().__data
  }

  setData(data: UploadData): void {
    const writable = this.getWritable()
    writable.__data = data
  }

  // eslint-disable-next-line class-methods-use-this
  updateDOM(): false {
    return false
  }
}

export function $createUploadNode({ data }: { data: UploadData }): UploadNode {
  return $applyNodeReplacement(new UploadNode({ data }))
}

export function $isUploadNode(node: LexicalNode | null | undefined): node is UploadNode {
  return node instanceof UploadNode
}

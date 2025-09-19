import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type {
  DOMConversionMap,
  DOMExportOutput,
  ElementFormatType,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

import { $convertPendingUploadElement } from './conversions.js'

export type PendingUploadData = {
  /**
   * ID that corresponds to the bulk upload form ID
   */
  formID: string
  /**
   * src value of the image dom element
   */
  src: string
}

export type SerializedPendingUploadNode = {
  children?: never // required so that our typed editor state doesn't automatically add children
  type: 'pendingUpload'
} & Spread<PendingUploadData, SerializedDecoratorBlockNode>

export class PendingUploadServerNode extends DecoratorBlockNode {
  __data: PendingUploadData

  constructor({
    data,
    format,
    key,
  }: {
    data: PendingUploadData
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__data = data
  }

  static override clone(node: PendingUploadServerNode): PendingUploadServerNode {
    return new this({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static override getType(): string {
    return 'pendingUpload'
  }

  static override importDOM(): DOMConversionMap<HTMLImageElement> {
    return {
      img: (node) => ({
        conversion: (domNode) =>
          $convertPendingUploadElement(domNode, $createPendingUploadServerNode),
        priority: 0,
      }),
    }
  }

  static override importJSON(serializedNode: SerializedPendingUploadNode): PendingUploadServerNode {
    const importedData: PendingUploadData = {
      formID: serializedNode.formID,
      src: serializedNode.src,
    }

    const node = $createPendingUploadServerNode({ data: importedData })
    node.setFormat(serializedNode.format)

    return node
  }

  static isInline(): false {
    return false
  }

  override decorate(): JSX.Element {
    // @ts-expect-error
    return <RawUploadComponent data={this.__data} format={this.__format} nodeKey={this.getKey()} />
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('data-lexical-pending-upload-form-id', String(this.__data?.formID))

    return { element }
  }

  override exportJSON(): SerializedPendingUploadNode {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: 'pendingUpload',
      version: 1,
    }
  }

  getData(): PendingUploadData {
    return this.getLatest().__data
  }

  setData(data: PendingUploadData): void {
    const writable = this.getWritable()
    writable.__data = data
  }

  override updateDOM(): false {
    return false
  }
}

export function $createPendingUploadServerNode({
  data,
}: {
  data: PendingUploadData
}): PendingUploadServerNode {
  return $applyNodeReplacement(new PendingUploadServerNode({ data }))
}

export function $isPendingUploadServerNode(
  node: LexicalNode | null | undefined,
): node is PendingUploadServerNode {
  return node instanceof PendingUploadServerNode
}

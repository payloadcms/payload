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
  id: string
  relationTo: string
}

export type UploadFields = {
  // unknown, custom fields:
  [key: string]: unknown
  relationTo: string
  value: {
    // Actual upload data, populated in afterRead hook
    [key: string]: unknown
    id: string
  }
}

function convertUploadElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    // const { alt: altText, src } = domNode;
    // const node = $createImageNode({ altText, src });
    // return { node };
    // TODO: Auto-upload functionality here!
  }
  return null
}

export type SerializedUploadNode = Spread<
  {
    fields: UploadFields
  },
  SerializedDecoratorBlockNode
>

export class UploadNode extends DecoratorBlockNode {
  __fields: UploadFields

  constructor({
    fields,
    format,
    key,
  }: {
    fields: UploadFields
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__fields = fields
  }

  static clone(node: UploadNode): UploadNode {
    return new UploadNode({
      fields: node.__fields,
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
    const node = $createUploadNode({
      fields: serializedNode.fields,
    })
    node.setFormat(serializedNode.format)

    return node
  }

  static isInline(): false {
    return false
  }

  decorate(): JSX.Element {
    return (
      <RawUploadComponent fields={this.__fields} format={this.__format} nodeKey={this.getKey()} />
    )
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
      fields: this.getFields(),
      type: this.getType(),
      version: 1,
    }
  }

  getFields(): UploadFields {
    return this.getLatest().__fields
  }

  setFields(fields: UploadFields): void {
    const writable = this.getWritable()
    writable.__fields = fields
  }

  // eslint-disable-next-line class-methods-use-this
  updateDOM(): false {
    return false
  }
}

export function $createUploadNode({ fields }: { fields: UploadFields }): UploadNode {
  return $applyNodeReplacement(new UploadNode({ fields }))
}

export function $isUploadNode(node: LexicalNode | null | undefined): node is UploadNode {
  return node instanceof UploadNode
}

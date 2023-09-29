/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NodeKey } from 'lexical'

import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import * as React from 'react'

import { UploadFeatureProps } from '..'

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
  SerializedLexicalNode
>

export class UploadNode extends DecoratorNode<JSX.Element> {
  __fields: UploadFields

  constructor({ fields, key }: { fields: UploadFields; key?: NodeKey }) {
    super(key)
    this.__fields = fields
  }

  static clone(node: UploadNode): UploadNode {
    return new UploadNode({
      fields: node.__fields,
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
    const { fields } = serializedNode
    const node = $createUploadNode({
      fields,
    })

    return node
  }

  // eslint-disable-next-line class-methods-use-this
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const { theme } = config
    const className = theme.image
    if (className !== undefined) {
      span.className = className
    }
    return span
  }

  decorate(): JSX.Element {
    return <RawUploadComponent fields={this.__fields} nodeKey={this.getKey()} />
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

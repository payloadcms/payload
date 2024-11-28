'use client'
import type { EditorConfig, LexicalEditor, LexicalNode } from 'lexical'

import ObjectID from 'bson-objectid'
import React, { type JSX } from 'react'

import type {
  InlineBlockFields,
  SerializedInlineBlockNode,
} from '../../server/nodes/InlineBlockNode.js'

import { ServerInlineBlockNode } from '../../server/nodes/InlineBlockNode.js'

const InlineBlockComponent = React.lazy(() =>
  import('../componentInline/index.js').then((module) => ({
    default: module.InlineBlockComponent,
  })),
)

export class InlineBlockNode extends ServerInlineBlockNode {
  static clone(node: ServerInlineBlockNode): ServerInlineBlockNode {
    return super.clone(node)
  }

  static getType(): string {
    return super.getType()
  }

  static importJSON(serializedNode: SerializedInlineBlockNode): InlineBlockNode {
    const node = $createInlineBlockNode(serializedNode.fields)
    return node
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <InlineBlockComponent formData={this.getFields()} nodeKey={this.getKey()} />
  }

  exportJSON(): SerializedInlineBlockNode {
    return super.exportJSON()
  }
}

export function $createInlineBlockNode(fields: Exclude<InlineBlockFields, 'id'>): InlineBlockNode {
  return new InlineBlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isInlineBlockNode(
  node: InlineBlockNode | LexicalNode | null | undefined,
): node is InlineBlockNode {
  return node instanceof InlineBlockNode
}

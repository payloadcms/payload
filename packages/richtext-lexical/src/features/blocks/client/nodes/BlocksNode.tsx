import type { EditorConfig, LexicalEditor, LexicalNode } from 'lexical'

import ObjectID from 'bson-objectid'
import React, { type JSX } from 'react'

import type { BlockFields, SerializedBlockNode } from '../../server/nodes/BlocksNode.js'

import { ServerBlockNode } from '../../server/nodes/BlocksNode.js'

const BlockComponent = React.lazy(() =>
  import('../component/index.js').then((module) => ({
    default: module.BlockComponent,
  })),
)

export class BlockNode extends ServerBlockNode {
  static clone(node: ServerBlockNode): ServerBlockNode {
    return super.clone(node)
  }

  static getType(): string {
    return super.getType()
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

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <BlockComponent formData={this.getFields()} nodeKey={this.getKey()} />
  }

  exportJSON(): SerializedBlockNode {
    return super.exportJSON()
  }
}

export function $createBlockNode(fields: Exclude<BlockFields, 'id'>): BlockNode {
  return new BlockNode({
    fields: {
      ...fields,
      id: fields?.id || new ObjectID.default().toHexString(),
    },
  })
}

export function $isBlockNode(node: BlockNode | LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode
}

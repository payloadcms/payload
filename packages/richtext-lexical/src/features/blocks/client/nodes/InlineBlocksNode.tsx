'use client'
import ObjectID from 'bson-objectid'
import {
  $applyNodeReplacement,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import React, { type JSX } from 'react'

import type {
  InlineBlockFields,
  SerializedInlineBlockNode,
} from '../../server/nodes/InlineBlocksNode.js'

import { ServerInlineBlockNode } from '../../server/nodes/InlineBlocksNode.js'

const InlineBlockComponent = React.lazy(() =>
  import('../componentInline/index.js').then((module) => ({
    default: module.InlineBlockComponent,
  })),
)

export class InlineBlockNode extends ServerInlineBlockNode {
  static override clone(node: ServerInlineBlockNode): ServerInlineBlockNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  static override importJSON(serializedNode: SerializedInlineBlockNode): InlineBlockNode {
    const node = $createInlineBlockNode(serializedNode.fields)
    return node
  }

  override decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const fields = this.getStaleFields()
    return (
      <InlineBlockComponent
        blockType={fields.blockType}
        className={config.theme.inlineBlock ?? 'LexicalEditorTheme__inlineBlock'}
        id={fields.id}
        nodeKey={this.getKey()}
      />
    )
  }

  override exportJSON(): SerializedInlineBlockNode {
    return super.exportJSON()
  }
}

export function $createInlineBlockNode(fields: Exclude<InlineBlockFields, 'id'>): InlineBlockNode {
  return $applyNodeReplacement(
    new InlineBlockNode({
      fields: {
        ...fields,
        id: fields?.id || new ObjectID.default().toHexString(),
      },
    }),
  )
}

export function $isInlineBlockNode(
  node: InlineBlockNode | LexicalNode | null | undefined,
): node is InlineBlockNode {
  return node instanceof InlineBlockNode
}

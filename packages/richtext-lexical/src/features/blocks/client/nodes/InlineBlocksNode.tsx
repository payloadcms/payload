import type {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

import ObjectID from 'bson-objectid'
import React, { type JSX } from 'react'

import { ServerInlineBlockNode } from '../../server/nodes/InlineBlocksNode.js'

export type InlineBlockFields = {
  /** Block form data */
  [key: string]: any
  //blockName: string
  blockType: string
  id: string
}

const InlineBlockComponent = React.lazy(() =>
  import('../componentInline/index.js').then((module) => ({
    default: module.InlineBlockComponent,
  })),
)

export type SerializedInlineBlockNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    fields: InlineBlockFields
    type: 'inlineBlock'
  },
  SerializedLexicalNode
>

export class InlineBlockNode extends ServerInlineBlockNode {
  static importJSON(serializedNode: SerializedInlineBlockNode): InlineBlockNode {
    const node = $createInlineBlockNode(serializedNode.fields)
    return node
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <InlineBlockComponent formData={this.getFields()} nodeKey={this.getKey()} />
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

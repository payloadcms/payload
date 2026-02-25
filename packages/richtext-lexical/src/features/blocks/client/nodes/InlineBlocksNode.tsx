'use client'
import ObjectID from 'bson-objectid'
import {
  $applyNodeReplacement,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import React, { type JSX } from 'react'

import type { ViewMapInlineBlockComponentProps } from '../../../../types.js'
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

export type InlineBlockDecorateFunction = (
  editor: LexicalEditor,
  config: EditorConfig,
  CustomBlock?: React.FC<ViewMapInlineBlockComponentProps>,
  CustomLabel?: React.FC<ViewMapInlineBlockComponentProps>,
) => JSX.Element

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

  override decorate(
    ...[_editor, config, CustomBlock, CustomLabel]: Parameters<InlineBlockDecorateFunction>
  ): ReturnType<InlineBlockDecorateFunction> {
    return (
      <InlineBlockComponent
        cacheBuster={this.getCacheBuster()}
        className={config.theme.inlineBlock ?? 'LexicalEditorTheme__inlineBlock'}
        CustomBlock={CustomBlock}
        CustomLabel={CustomLabel}
        formData={this.getFields()}
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

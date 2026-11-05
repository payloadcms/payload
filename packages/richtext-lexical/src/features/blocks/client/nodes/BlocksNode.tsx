'use client'
import ObjectID from 'bson-objectid'
import {
  $applyNodeReplacement,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import React, { type JSX } from 'react'

import type { ViewMapBlockComponentProps } from '../../../../types/index.js'
import type { BlockFieldsOptionalID, SerializedBlockNode } from '../../server/schema.js'

import { ServerBlockNode } from '../../server/nodes/BlocksNode.js'
import { BlockComponent } from '../component/index.js'

export type BlockDecorateFunction = (
  editor: LexicalEditor,
  config: EditorConfig,
  CustomBlock?: React.FC<ViewMapBlockComponentProps>,
  CustomLabel?: React.FC<ViewMapBlockComponentProps>,
) => JSX.Element

export class BlockNode extends ServerBlockNode {
  static override clone(node: ServerBlockNode): ServerBlockNode {
    return super.clone(node)
  }

  static override getType(): string {
    return super.getType()
  }

  static override importJSON(serializedNode: SerializedBlockNode): BlockNode {
    const node = $createBlockNode(serializedNode.fields)
    node.setFormat(serializedNode.format)
    return node
  }

  override decorate(
    ...[_editor, config, CustomBlock, CustomLabel]: Parameters<BlockDecorateFunction>
  ): ReturnType<BlockDecorateFunction> {
    return (
      <BlockComponent
        cacheBuster={this.getCacheBuster()}
        className={config.theme.block ?? 'LexicalEditorTheme__block'}
        CustomBlock={CustomBlock}
        CustomLabel={CustomLabel}
        formData={this.getFields()}
        nodeKey={this.getKey()}
      />
    )
  }

  override exportJSON(): SerializedBlockNode {
    return super.exportJSON()
  }
}

export function $createBlockNode(fields: BlockFieldsOptionalID): BlockNode {
  return $applyNodeReplacement(
    new BlockNode({
      fields: {
        ...fields,
        id: fields?.id || new ObjectID.default().toHexString(),
      },
    }),
  )
}

export function $isBlockNode(node: BlockNode | LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode
}

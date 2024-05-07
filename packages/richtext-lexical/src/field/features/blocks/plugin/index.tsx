'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import React, { useEffect } from 'react'

import type { PluginComponent } from '../../types.js'
import type { BlocksFeatureClientProps } from '../feature.client.js'
import type { BlockFields } from '../nodes/BlocksNode.js'

import { BlocksDrawerComponent } from '../drawer/index.js'
import { $createBlockNode, BlockNode } from '../nodes/BlocksNode.js'
import { INSERT_BLOCK_COMMAND } from './commands.js'

export type InsertBlockPayload = Exclude<BlockFields, 'id'>

export const BlocksPlugin: PluginComponent<BlocksFeatureClientProps> = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([BlockNode])) {
      throw new Error('BlocksPlugin: BlocksNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertBlockPayload>(
        INSERT_BLOCK_COMMAND,
        (payload: InsertBlockPayload) => {
          editor.update(() => {
            const blockNode = $createBlockNode(payload)

            const selection = $getSelection() || $getPreviousSelection()

            if ($isRangeSelection(selection)) {
              const { focus } = selection
              const focusNode = focus.getNode()

              // First, delete currently selected node if it's an empty paragraph and if there are sufficient
              // paragraph nodes (more than 1) left in the parent node, so that we don't "trap" the user
              if (
                $isParagraphNode(focusNode) &&
                focusNode.getTextContentSize() === 0 &&
                focusNode
                  .getParent()
                  .getChildren()
                  .filter((node) => $isParagraphNode(node)).length > 1
              ) {
                focusNode.remove()
              }

              $insertNodeToNearestRoot(blockNode)
            }
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return <BlocksDrawerComponent />
}

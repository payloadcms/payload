'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot, $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import { formatDrawerSlug, useEditDepth } from '@payloadcms/ui'
import {
  $createParagraphNode,
  $getNodeByKey,
  $getPreviousSelection,
  $getSelection,
  $insertNodes,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { useEffect, useState } from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { BlockFields, BlockFieldsOptionalID } from '../../server/nodes/BlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { $createBlockNode, BlockNode } from '../nodes/BlocksNode.js'
import { $createInlineBlockNode, $isInlineBlockNode } from '../nodes/InlineBlocksNode.js'
import { INSERT_BLOCK_COMMAND, INSERT_INLINE_BLOCK_COMMAND } from './commands.js'

export type InsertBlockPayload = BlockFieldsOptionalID

export const BlocksPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()

  const [targetNodeKey, setTargetNodeKey] = useState<null | string>(null)

  const { setCreatedInlineBlock, uuid } = useEditorConfigContext()
  const editDepth = useEditDepth()

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-inlineBlocks-create-` + uuid,
    depth: editDepth,
  })

  const { toggleDrawer } = useLexicalDrawer(drawerSlug, true)

  useEffect(() => {
    if (!editor.hasNodes([BlockNode])) {
      throw new Error('BlocksPlugin: BlocksNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertBlockPayload>(
        INSERT_BLOCK_COMMAND,
        (payload: InsertBlockPayload) => {
          editor.update(() => {
            const selection = $getSelection() || $getPreviousSelection()

            if ($isRangeSelection(selection)) {
              const blockNode = $createBlockNode(payload)
              // Insert blocks node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
              $insertNodeToNearestRoot(blockNode)

              const { focus } = selection
              const focusNode = focus.getNode()

              // First, delete currently selected node if it's an empty paragraph and if there are sufficient
              // paragraph nodes (more than 1) left in the parent node, so that we don't "trap" the user
              if (
                $isParagraphNode(focusNode) &&
                focusNode.getTextContentSize() === 0 &&
                focusNode
                  .getParentOrThrow()
                  .getChildren()
                  .filter((node) => $isParagraphNode(node)).length > 1
              ) {
                focusNode.remove()
              }
            }
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_INLINE_BLOCK_COMMAND,
        (fields) => {
          if (targetNodeKey) {
            const node = $getNodeByKey(targetNodeKey)

            if (!node || !$isInlineBlockNode(node)) {
              return false
            }

            node.setFields(fields as BlockFields)

            setTargetNodeKey(null)
            return true
          }

          const inlineBlockNode = $createInlineBlockNode(fields as BlockFields)
          setCreatedInlineBlock?.(inlineBlockNode)
          $insertNodes([inlineBlockNode])
          if ($isRootOrShadowRoot(inlineBlockNode.getParentOrThrow())) {
            $wrapNodeInElement(inlineBlockNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, setCreatedInlineBlock, targetNodeKey, toggleDrawer])

  return null
}

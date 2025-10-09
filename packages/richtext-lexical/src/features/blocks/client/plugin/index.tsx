'use client'

import { copyToClipboard } from '@lexical/clipboard'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import {
  $insertNodeToNearestRoot,
  $wrapNodeInElement,
  mergeRegister,
  objectKlassEquals,
} from '@lexical/utils'
import { formatDrawerSlug, useEditDepth } from '@payloadcms/ui'
import ObjectID from 'bson-objectid'
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
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  PASTE_COMMAND,
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

type SerializedUnknownLexicalNode = {
  children?: SerializedUnknownLexicalNode[]
  type: string
}

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

              // we need to get the focus node before inserting the block node, as $insertNodeToNearestRoot can change the focus node
              const { focus } = selection
              const focusNode = focus.getNode()
              // Insert blocks node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
              $insertNodeToNearestRoot(blockNode)

              // Delete the node it it's an empty paragraph
              if ($isParagraphNode(focusNode) && !focusNode.__first) {
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
      // Remove duplicated ids from clipboard. We do it here because:
      // 1. Browsers do not allow setting the clipboardData in paste event for security reasons.
      // 2. If you cut instead of paste, the id will be kept, which is a good thing.
      editor.registerCommand(
        COPY_COMMAND,
        (event) => {
          copyToClipboard(editor, objectKlassEquals(event, ClipboardEvent) ? event : null)
            .then(() => {
              if (!(event instanceof ClipboardEvent) || !event.clipboardData) {
                throw new Error('No clipboard event')
              }
              const lexicalStringified = event.clipboardData.getData('application/x-lexical-editor')
              if (!lexicalStringified) {
                return true
              }

              const lexical = JSON.parse(lexicalStringified) as {
                nodes: SerializedUnknownLexicalNode[]
              }
              const changeIds = (node: SerializedUnknownLexicalNode) => {
                if (
                  'fields' in node &&
                  typeof node.fields === 'object' &&
                  node.fields !== null &&
                  'id' in node.fields
                ) {
                  node.fields.id = new ObjectID.default().toHexString()
                } else if ('id' in node) {
                  node.id = new ObjectID.default().toHexString()
                }

                if (node.children) {
                  for (const child of node.children) {
                    changeIds(child)
                  }
                }
              }
              for (const node of lexical.nodes) {
                changeIds(node)
              }
              const stringified = JSON.stringify(lexical)
              event.clipboardData.setData('application/x-lexical-editor', stringified)
            })
            .catch((error) => {
              if (event instanceof ClipboardEvent) {
                event.clipboardData?.setData('application/x-lexical-editor', '')
              }
              throw error
            })
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, setCreatedInlineBlock, targetNodeKey, toggleDrawer])

  return null
}

'use client'

import type { BlocksFieldClient } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot, $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import { getTranslation } from '@payloadcms/translations'
import {
  formatDrawerSlug,
  useEditDepth,
  useFieldProps,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
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
  type RangeSelection,
} from 'lexical'
import React, { useEffect, useState } from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { BlockFields, BlockFieldsOptionalID } from '../../server/nodes/BlocksNode.js'
import type { BlocksFeatureClientProps } from '../index.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { FieldsDrawer } from '../../../../utilities/fieldsDrawer/Drawer.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { $createBlockNode, BlockNode } from '../nodes/BlocksNode.js'
import { $createInlineBlockNode, $isInlineBlockNode } from '../nodes/InlineBlocksNode.js'
import {
  INSERT_BLOCK_COMMAND,
  INSERT_INLINE_BLOCK_COMMAND,
  OPEN_INLINE_BLOCK_DRAWER_COMMAND,
} from './commands.js'

export type InsertBlockPayload = BlockFieldsOptionalID

export const BlocksPlugin: PluginComponent<BlocksFeatureClientProps> = () => {
  const [editor] = useLexicalComposerContext()
  const [blockFields, setBlockFields] = useState<BlockFields | null>(null)
  const [blockType, setBlockType] = useState<string>('' as any)
  const [targetNodeKey, setTargetNodeKey] = useState<null | string>(null)
  const { i18n, t } = useTranslation<string, any>()
  const { schemaPath } = useFieldProps()
  const { uuid } = useEditorConfigContext()
  const editDepth = useEditDepth()

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-inlineBlocks-create-` + uuid,
    depth: editDepth,
  })

  const { toggleDrawer } = useLexicalDrawer(drawerSlug)

  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

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
          $insertNodes([inlineBlockNode])
          if ($isRootOrShadowRoot(inlineBlockNode.getParentOrThrow())) {
            $wrapNodeInElement(inlineBlockNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_INLINE_BLOCK_DRAWER_COMMAND,
        ({ fields, nodeKey }) => {
          setBlockFields((fields as BlockFields) ?? null)
          setTargetNodeKey(nodeKey ?? null)
          setBlockType(fields?.blockType ?? ('' as any))

          if (nodeKey) {
            toggleDrawer()
            return true
          }

          let rangeSelection: null | RangeSelection = null

          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              rangeSelection = selection
            }
          })

          if (rangeSelection) {
            //setLastSelection(rangeSelection)
            toggleDrawer()
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, targetNodeKey, toggleDrawer])

  if (!blockFields) {
    return null
  }

  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.lexical_inline_blocks.${blockFields?.blockType}`

  const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_inline_blocks`
  const blocksField: BlocksFieldClient = richTextComponentMap?.has(componentMapRenderedBlockPath)
    ? richTextComponentMap.get(componentMapRenderedBlockPath)[0]
    : null

  const clientBlock = blocksField
    ? blocksField.blocks.find((block) => block.slug === blockFields?.blockType)
    : null

  if (!blocksField) {
    return null
  }

  const blockDisplayName = clientBlock?.labels?.singular
    ? getTranslation(clientBlock?.labels?.singular, i18n)
    : clientBlock?.slug

  return (
    <FieldsDrawer
      data={blockFields}
      drawerSlug={drawerSlug}
      drawerTitle={t(`lexical:blocks:inlineBlocks:${blockFields?.id ? 'edit' : 'create'}`, {
        label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label'),
      })}
      featureKey="blocks"
      fieldMapOverride={clientBlock?.fields}
      handleDrawerSubmit={(_fields, data) => {
        if (!data) {
          return
        }

        data.blockType = blockType

        editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, data)
      }}
      schemaFieldsPathOverride={schemaFieldsPath}
      schemaPathSuffix={blockFields?.blockType}
    />
  )
}

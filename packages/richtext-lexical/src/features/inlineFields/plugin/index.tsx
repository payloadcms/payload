import type { RangeSelection } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot, $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import { useModal } from '@payloadcms/ui'
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import React, { useEffect, useState } from 'react'

import type { PluginComponent } from '../../typesClient.js'
import type { InlineFieldsData, InlineFieldsNode } from '../nodes/InlineFieldsNode.js'

import { FieldsDrawer } from '../../../utilities/fieldsDrawer/Drawer.js'
import { $createInlineFieldsNode } from '../nodes/InlineFieldsNode.js'
import { INSERT_INLINE_FIELDS_COMMAND, OPEN_INLINE_FIELDS_DRAWER_COMMAND } from './commands.js'

const drawerSlug = 'lexical-inlineFields-create'

export const InlineFieldsPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()
  const { closeModal, toggleModal } = useModal()
  const [lastSelection, setLastSelection] = useState<RangeSelection | null>()
  const [inlineFieldsData, setInlineFieldsData] = useState<InlineFieldsData>({} as any)
  const [targetNodeKey, setTargetNodeKey] = useState<null | string>(null)

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_INLINE_FIELDS_COMMAND,
        ({ id, fields, key }) => {
          if (targetNodeKey) {
            // Replace existing translationKeys node
            const node: InlineFieldsNode = $getNodeByKey(targetNodeKey)
            if (!node) {
              return false
            }
            node.setFields(fields)

            setTargetNodeKey(null)
            return true
          }

          const inlineFieldsNode = $createInlineFieldsNode({
            id,
            fields,
            fieldsKey: key,
          })
          $insertNodes([inlineFieldsNode])
          if ($isRootOrShadowRoot(inlineFieldsNode.getParentOrThrow())) {
            $wrapNodeInElement(inlineFieldsNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_INLINE_FIELDS_DRAWER_COMMAND,
        (data) => {
          setInlineFieldsData((data as InlineFieldsData) ?? ({} as InlineFieldsData))
          setTargetNodeKey(data?.nodeKey ?? null)

          if (data?.nodeKey) {
            toggleModal(drawerSlug)
            return true
          }

          let rangeSelection: RangeSelection | null = null

          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              rangeSelection = selection
            }
          })

          if (rangeSelection) {
            setLastSelection(rangeSelection)
            toggleModal(drawerSlug)
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, lastSelection, targetNodeKey, toggleModal, setInlineFieldsData])

  return (
    <FieldsDrawer
      data={inlineFieldsData.fields}
      drawerSlug={drawerSlug}
      drawerTitle="Create Inline Fields"
      featureKey="inlineFields"
      handleDrawerSubmit={(_fields, data) => {
        closeModal(drawerSlug)
        if (!data) {
          return
        }

        if (inlineFieldsData.fields._internal_text_output) {
          data._internal_text_output = inlineFieldsData.fields._internal_text_output
        }

        editor.dispatchCommand(INSERT_INLINE_FIELDS_COMMAND, {
          fields: data,
          key: inlineFieldsData.key,
        })
      }}
      schemaPathSuffix={inlineFieldsData.key}
    />
  )
}

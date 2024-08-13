'use client'

import React, { useCallback, useEffect, useRef } from 'react'
const baseClass = 'inline-block'

import type { BlockFieldClient } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import { getTranslation } from '@payloadcms/translations'
import { Button, RenderComponent, useTranslation } from '@payloadcms/ui'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'

import type { InlineBlockFields } from '../nodes/InlineBlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { $isInlineBlockNode } from '../nodes/InlineBlocksNode.js'
import { OPEN_INLINE_BLOCK_DRAWER_COMMAND } from '../plugin/commands.js'
import './index.scss'

type Props = {
  readonly formData: InlineBlockFields
  readonly nodeKey?: string
}

export const InlineBlockComponent: React.FC<Props> = (props) => {
  const { formData, nodeKey } = props
  const [editor] = useLexicalComposerContext()
  const { i18n, t } = useTranslation<object, string>()
  const { field } = useEditorConfigContext()
  const inlineBlockElemElemRef = useRef<HTMLDivElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)

  const {
    field: { richTextComponentMap },
  } = useEditorConfigContext()

  const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_inline_blocks`
  const blocksField: BlockFieldClient = richTextComponentMap.get(componentMapRenderedBlockPath)[0]
  const clientBlock = blocksField.blocks.find((block) => block.slug === formData.blockType)

  const removeInlineBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isInlineBlockNode(node)) {
          node.remove()
          return true
        }
      }
      return false
    },
    [isSelected, nodeKey],
  )
  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload
      // Check if inlineBlockElemElemRef.target or anything WITHIN inlineBlockElemElemRef.target was clicked
      if (
        event.target === inlineBlockElemElemRef.current ||
        inlineBlockElemElemRef.current?.contains(event.target as Node)
      ) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          if (!isSelected) {
            clearSelection()
            setSelected(true)
          }
        }
        return true
      }

      return false
    },
    [isSelected, setSelected, clearSelection],
  )

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),

      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    )
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected, onClick])

  const blockDisplayName = clientBlock?.labels?.singular
    ? getTranslation(clientBlock.labels.singular, i18n)
    : clientBlock.slug

  return (
    <div
      className={[
        baseClass,
        baseClass + '-' + formData.blockType,
        isSelected && `${baseClass}--selected`,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={inlineBlockElemElemRef}
    >
      {clientBlock?.admin?.components?.Label ? (
        <RenderComponent
          clientProps={{ blockKind: 'lexicalInlineBlock', formData }}
          mappedComponent={clientBlock.admin.components.Label}
        />
      ) : (
        <div>{getTranslation(clientBlock.labels?.singular, i18n)}</div>
      )}
      {editor.isEditable() && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__editButton`}
            disabled={field?.admin?.readOnly}
            el="div"
            icon="edit"
            onClick={() => {
              editor.dispatchCommand(OPEN_INLINE_BLOCK_DRAWER_COMMAND, {
                fields: formData,
                nodeKey,
              })
            }}
            round
            size="small"
            tooltip={t('lexical:blocks:inlineBlocks:edit', { label: blockDisplayName })}
          />
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__removeButton`}
            disabled={field?.admin?.readOnly}
            icon="x"
            onClick={(e) => {
              e.preventDefault()
              removeInlineBlock()
            }}
            round
            size="small"
            tooltip={t('lexical:blocks:inlineBlocks:remove', { label: blockDisplayName })}
          />
        </div>
      )}
    </div>
  )
}

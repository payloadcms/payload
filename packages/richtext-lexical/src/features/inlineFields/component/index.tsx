'use client'

import React, { useCallback, useEffect, useRef } from 'react'
const baseClass = 'inline-fields'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import { Button, useTranslation } from '@payloadcms/ui'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'

import type { Fields } from '../nodes/InlineFieldsNode.js'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider.js'
import { $isInlineFieldsNode } from '../nodes/InlineFieldsNode.js'
import {
  INSERT_INLINE_FIELDS_COMMAND,
  OPEN_INLINE_FIELDS_DRAWER_COMMAND,
} from '../plugin/commands.js'
import './index.scss'

type Props = {
  fieldsKey: string
  formData: Fields
  nodeKey?: string
}

export const InlineFieldsComponent: React.FC<Props> = (props) => {
  const { fieldsKey, formData, nodeKey } = props
  const [editor] = useLexicalComposerContext()
  const { i18n, t } = useTranslation<{}, string>()
  const { field } = useEditorConfigContext()
  const inlineFieldsElemElemRef = useRef<HTMLDivElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)

  const removeInlineFields = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isInlineFieldsNode(node)) {
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
      // Check if inlineFieldsElemElemRef.target or anything WITHIN inlineFieldsElemElemRef.target was clicked
      if (
        event.target === inlineFieldsElemElemRef.current ||
        inlineFieldsElemElemRef.current?.contains(event.target as Node)
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

  return (
    <div
      className={[baseClass, baseClass + '-' + fieldsKey, isSelected && `${baseClass}--selected`]
        .filter(Boolean)
        .join(' ')}
      ref={inlineFieldsElemElemRef}
    >
      {formData?._internal_text_output}
      {editor.isEditable() && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__editButton`}
            disabled={field?.readOnly}
            el="div"
            icon="edit"
            onClick={() => {
              editor.dispatchCommand(OPEN_INLINE_FIELDS_DRAWER_COMMAND, {
                fields: formData,
                key: fieldsKey,
                nodeKey,
              })
            }}
            round
            size="small"
            tooltip={t('lexical:inlineFields:editInlineFields')}
          />
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__removeButton`}
            disabled={field?.readOnly}
            icon="x"
            onClick={(e) => {
              e.preventDefault()
              removeInlineFields()
            }}
            round
            size="small"
            tooltip={t('lexical:inlineFields:removeInlineFields')}
          />
        </div>
      )}
    </div>
  )
}

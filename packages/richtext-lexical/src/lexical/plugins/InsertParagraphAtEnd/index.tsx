'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useTranslation } from '@payloadcms/ui'
import { $createParagraphNode, $getRoot } from 'lexical'
import React from 'react'

import './index.css'
import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'
import { AddIcon } from '../../ui/icons/Add/index.js'
const baseClass = 'insert-paragraph-at-end'

export const InsertParagraphAtEndPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const { editorConfig } = useEditorConfigContext()
  const { t } = useTranslation<{}, string>()

  if (editorConfig?.admin?.hideInsertParagraphAtEnd) {
    return null
  }

  const onClick = () => {
    editor.update(() => {
      const paragraphNode = $createParagraphNode()
      $getRoot().append(paragraphNode)
      paragraphNode.select()
    })
  }

  return (
    <button
      aria-label={t('lexical:general:insertParagraph')}
      className={baseClass}
      onClick={onClick}
      type="button"
    >
      <span className={`${baseClass}-inside`}>
        <AddIcon size={16} />
      </span>
    </button>
  )
}

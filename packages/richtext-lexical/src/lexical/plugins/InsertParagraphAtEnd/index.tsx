/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getRoot } from 'lexical'
import React from 'react'

import './index.scss'
import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'
const baseClass = 'insert-paragraph-at-end'

export const InsertParagraphAtEndPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const { editorConfig } = useEditorConfigContext()

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
    <div aria-label="Insert Paragraph" className={baseClass} onClick={onClick}>
      <div className={`${baseClass}-inside`}>
        <span>+</span>
      </div>
    </div>
  )
}

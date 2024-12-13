'use client'

import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { useDocumentInfo, useTranslation } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { defaults } from '../../../defaults.js'
import { LengthIndicator } from '../../../ui/LengthIndicator.js'
import { recurseEditorState } from '../../Preview/inlineBlockToText.js'

const { maxLength: maxLengthDefault, minLength: minLengthDefault } = defaults.title

export const LengthIndicatorPlugin = () => {
  const { t } = useTranslation<any, any>()

  const docInfo = useDocumentInfo()

  const minLength = minLengthDefault
  const maxLength = maxLengthDefault

  const [editor] = useLexicalComposerContext()

  const [editorText, setEditorText] = React.useState<null | string>('')

  useEffect(() => {
    if (!editorText) {
      const editorState = editor.getEditorState().toJSON()

      const text = []
      recurseEditorState(editorState?.root?.children, text, 0, docInfo.savedDocumentData as any)

      setEditorText(text.join(' '))
    }

    return editor.registerUpdateListener(({ editorState }) => {
      const editorStateJSON = editorState.toJSON()
      const text = []
      recurseEditorState(editorStateJSON?.root?.children, text, 0, docInfo.savedDocumentData as any)

      setEditorText(text.join(' '))
    })
  }, [docInfo.savedDocumentData, editor, editorText, maxLength])

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {t('plugin-seo:lengthTipTitle', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('plugin-seo:bestPractices')}
          </a>
          .
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          width: '100%',
        }}
      >
        <LengthIndicator maxLength={maxLength} minLength={minLength} text={editorText} />
      </div>
    </div>
  )
}

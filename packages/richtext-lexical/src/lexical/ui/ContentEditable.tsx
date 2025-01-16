'use client'
import type { JSX } from 'react'

import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import { useTranslation } from '@payloadcms/ui'
import * as React from 'react'

import './ContentEditable.scss'
import type { SanitizedClientEditorConfig } from '../config/types.js'

export function LexicalContentEditable({
  className,
  editorConfig,
}: {
  className?: string
  editorConfig: SanitizedClientEditorConfig
}): JSX.Element {
  const { t } = useTranslation<{}, string>()

  return (
    <ContentEditable
      aria-placeholder={t('lexical:general:placeholder')}
      className={className ?? 'ContentEditable__root'}
      placeholder={
        <p className="editor-placeholder">
          {editorConfig?.admin?.placeholder ?? t('lexical:general:placeholder')}
        </p>
      }
    />
  )
}

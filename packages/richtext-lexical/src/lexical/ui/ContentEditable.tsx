'use client'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import { useTranslation } from '@ruya.sa/ui'

import './ContentEditable.scss'

import * as React from 'react'

import type { SanitizedClientEditorConfig } from '../config/types.js'

export function LexicalContentEditable({
  className,
  editorConfig,
}: {
  className?: string
  editorConfig: SanitizedClientEditorConfig
}): JSX.Element {
  const { t } = useTranslation<{}, string>()
  const [_, { getTheme }] = useLexicalComposerContext()
  const theme = getTheme()

  return (
    <ContentEditable
      aria-placeholder={t('lexical:general:placeholder')}
      className={className ?? 'ContentEditable__root'}
      placeholder={
        <p className={theme?.placeholder}>
          {editorConfig?.admin?.placeholder ?? t('lexical:general:placeholder')}
        </p>
      }
    />
  )
}

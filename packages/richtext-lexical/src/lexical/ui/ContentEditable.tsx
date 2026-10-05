'use client'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui'

import './ContentEditable.css'

import * as React from 'react'

import type { SanitizedClientEditorConfig } from '../config/types.js'

import { useEditorConfigContext } from '../config/client/EditorConfigProvider.js'

export function LexicalContentEditable({
  className,
  editorConfig,
  instructionsID,
}: {
  className?: string
  editorConfig: SanitizedClientEditorConfig
  instructionsID?: string
}): JSX.Element {
  const { fieldProps } = useEditorConfigContext()
  const { i18n, t } = useTranslation<{}, string>()
  const [_, { getTheme }] = useLexicalComposerContext()
  const theme = getTheme()
  return (
    <ContentEditable
      aria-describedby={instructionsID}
      aria-label={getTranslation(fieldProps.field.label || '', i18n)}
      aria-placeholder={t('lexical:general:placeholder')}
      aria-required={fieldProps.field.required || undefined}
      className={className ?? 'ContentEditable__root'}
      placeholder={
        <p className={theme?.placeholder}>
          {editorConfig?.admin?.placeholder ?? t('lexical:general:placeholder')}
        </p>
      }
    />
  )
}

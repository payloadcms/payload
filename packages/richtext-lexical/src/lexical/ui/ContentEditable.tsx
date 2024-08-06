import type { JSX } from 'react'

import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import { useTranslation } from '@payloadcms/ui'
import * as React from 'react'

import './ContentEditable.scss'

export function LexicalContentEditable({ className }: { className?: string }): JSX.Element {
  const { t } = useTranslation<{}, string>()

  return (
    <ContentEditable
      aria-placeholder={t('lexical:general:placeholder')}
      className={className ?? 'ContentEditable__root'}
      placeholder={<p className="editor-placeholder">{t('lexical:general:placeholder')}</p>}
    />
  )
}

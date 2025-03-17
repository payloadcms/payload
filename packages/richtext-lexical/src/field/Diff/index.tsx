import type { RichTextFieldDiffServerComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel } from '@payloadcms/ui/shared'
import React from 'react'
const baseClass = 'lexical-diff'

export const LexicalDiffComponent: RichTextFieldDiffServerComponent = (args) => {
  const { field, i18n, locale } = args

  return (
    <div className={baseClass}>
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {'label' in field &&
          typeof field.label !== 'function' &&
          getTranslation(field.label || '', i18n)}
      </FieldDiffLabel>
      <code>Diff goes here</code>
    </div>
  )
}

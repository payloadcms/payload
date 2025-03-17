import type { SerializedEditorState } from 'lexical'
import type { RichTextFieldDiffServerComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel } from '@payloadcms/ui/shared'
import React from 'react'

import './htmlDiff/index.scss'
import './index.scss'
import { convertLexicalToHTML } from '../../features/converters/html/sync/index.js'
import { HtmlDiff } from './htmlDiff/index.js'
const baseClass = 'lexical-diff'

export const LexicalDiffComponent: RichTextFieldDiffServerComponent = (args) => {
  const { comparisonValue, field, i18n, locale, versionValue } = args

  const comparisonHTML = convertLexicalToHTML({
    data: comparisonValue as SerializedEditorState,
  })

  const versionHTML = convertLexicalToHTML({
    data: versionValue as SerializedEditorState,
  })

  const diffHTML = new HtmlDiff(comparisonHTML, versionHTML)

  const [oldHTML, newHTML] = diffHTML.getSideBySideContents()

  return (
    <div className={baseClass}>
      <FieldDiffLabel>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {'label' in field &&
          typeof field.label !== 'function' &&
          getTranslation(field.label || '', i18n)}
      </FieldDiffLabel>
      <div className={`${baseClass}__diff-container`}>
        {oldHTML && (
          <div className={`${baseClass}__diff-old`} dangerouslySetInnerHTML={{ __html: oldHTML }} />
        )}
        {newHTML && (
          <div className={`${baseClass}__diff-new`} dangerouslySetInnerHTML={{ __html: newHTML }} />
        )}
      </div>
    </div>
  )
}

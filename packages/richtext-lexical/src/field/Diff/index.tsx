import type { SerializedEditorState } from 'lexical'
import type { RichTextFieldDiffServerComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel } from '@payloadcms/ui/shared'
import React from 'react'

import './htmlDiff/index.scss'
import './index.scss'

import type { HTMLConvertersFunction } from '../../features/converters/lexicalToHtml/sync/types.js'

import { convertLexicalToHTML } from '../../features/converters/lexicalToHtml/sync/index.js'
import { HtmlDiff } from './htmlDiff/index.js'
const baseClass = 'lexical-diff'

const converters: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  link: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    let href: string = node.fields.url ?? ''
    if (node.fields.linkType === 'internal') {
      console.error(
        'Lexical => HTML converter: Link converter: found internal link, but internalDocToHref is not provided',
      )
      href = '#' // fallback
    }

    return `<a${providedStyleTag} data-enable-match="true" href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>
        ${children}
      </a>`
  },
})

export const LexicalDiffComponent: RichTextFieldDiffServerComponent = (args) => {
  const { comparisonValue, field, i18n, locale, versionValue } = args

  const comparisonHTML = convertLexicalToHTML({
    converters,
    data: comparisonValue as SerializedEditorState,
  })

  const versionHTML = convertLexicalToHTML({
    converters,
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

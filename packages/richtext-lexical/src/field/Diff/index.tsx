import type { SerializedEditorState } from 'lexical'
import type { RichTextFieldDiffServerComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { FieldDiffLabel } from '@payloadcms/ui/rsc'
import React from 'react'

import './htmlDiff/index.scss'
import './index.scss'
import '../bundled.css'

import type { HTMLConvertersFunctionAsync } from '../../features/converters/lexicalToHtml/async/types.js'

import { convertLexicalToHTMLAsync } from '../../features/converters/lexicalToHtml/async/index.js'
import { getPayloadPopulateFn } from '../../features/converters/utilities/payloadPopulateFn.js'
import { LinkDiffHTMLConverterAsync } from './converters/link.js'
import { ListItemDiffHTMLConverterAsync } from './converters/listitem/index.js'
import { RelationshipDiffHTMLConverterAsync } from './converters/relationship/index.js'
import { UnknownDiffHTMLConverterAsync } from './converters/unknown/index.js'
import { UploadDiffHTMLConverterAsync } from './converters/upload/index.js'
import { HtmlDiff } from './htmlDiff/index.js'
const baseClass = 'lexical-diff'

export const LexicalDiffComponent: RichTextFieldDiffServerComponent = async (args) => {
  const { comparisonValue, field, i18n, locale, versionValue } = args

  const converters: HTMLConvertersFunctionAsync = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkDiffHTMLConverterAsync({}),
    ...ListItemDiffHTMLConverterAsync,
    ...UploadDiffHTMLConverterAsync({ i18n: args.i18n, req: args.req }),
    ...RelationshipDiffHTMLConverterAsync({ i18n: args.i18n, req: args.req }),
    ...UnknownDiffHTMLConverterAsync({ i18n: args.i18n, req: args.req }),
  })

  const payloadPopulateFn = await getPayloadPopulateFn({
    currentDepth: 0,
    depth: 1,
    req: args.req,
  })
  const comparisonHTML = await convertLexicalToHTMLAsync({
    converters,
    data: comparisonValue as SerializedEditorState,
    populate: payloadPopulateFn,
  })

  const versionHTML = await convertLexicalToHTMLAsync({
    converters,
    data: versionValue as SerializedEditorState,
    populate: payloadPopulateFn,
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

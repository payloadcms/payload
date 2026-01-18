import type { SerializedEditorState } from 'lexical'
import type { RichTextFieldDiffServerComponent } from '@ruya.sa/payload'

import { FieldDiffContainer, getHTMLDiffComponents } from '@ruya.sa/ui/rsc'

import './index.scss'
import '../bundled.css'

import React from 'react'

import type { HTMLConvertersFunctionAsync } from '../../features/converters/lexicalToHtml/async/types.js'

import { convertLexicalToHTMLAsync } from '../../features/converters/lexicalToHtml/async/index.js'
import { getPayloadPopulateFn } from '../../features/converters/utilities/payloadPopulateFn.js'
import { LinkDiffHTMLConverterAsync } from './converters/link.js'
import { ListItemDiffHTMLConverterAsync } from './converters/listitem/index.js'
import { RelationshipDiffHTMLConverterAsync } from './converters/relationship/index.js'
import { UnknownDiffHTMLConverterAsync } from './converters/unknown/index.js'
import { UploadDiffHTMLConverterAsync } from './converters/upload/index.js'

const baseClass = 'lexical-diff'

export const LexicalDiffComponent: RichTextFieldDiffServerComponent = async (args) => {
  const {
    comparisonValue: valueFrom,
    field,
    i18n,
    locale,
    nestingLevel,
    req,
    versionValue: valueTo,
  } = args

  const converters: HTMLConvertersFunctionAsync = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkDiffHTMLConverterAsync({}),
    ...ListItemDiffHTMLConverterAsync,
    ...UploadDiffHTMLConverterAsync({ i18n, req }),
    ...RelationshipDiffHTMLConverterAsync({ i18n, req }),
    ...UnknownDiffHTMLConverterAsync({ i18n, req }),
  })

  const payloadPopulateFn = await getPayloadPopulateFn({
    currentDepth: 0,
    depth: 1,
    req,
  })
  const fromHTML = await convertLexicalToHTMLAsync({
    converters,
    data: valueFrom as SerializedEditorState,
    disableContainer: true,
    populate: payloadPopulateFn,
  })

  const toHTML = await convertLexicalToHTMLAsync({
    converters,
    data: valueTo as SerializedEditorState,
    disableContainer: true,
    populate: payloadPopulateFn,
  })

  const { From, To } = getHTMLDiffComponents({
    // Ensure empty paragraph is displayed for empty rich text fields - otherwise, toHTML may be displayed in the wrong column
    fromHTML: fromHTML?.length ? fromHTML : '<p></p>',
    toHTML: toHTML?.length ? toHTML : '<p></p>',
  })

  return (
    <FieldDiffContainer
      className={baseClass}
      From={From}
      i18n={i18n}
      label={{
        label: field.label,
        locale,
      }}
      nestingLevel={nestingLevel}
      To={To}
    />
  )
}

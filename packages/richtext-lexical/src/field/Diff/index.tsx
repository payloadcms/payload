import type { SerializedEditorState } from 'lexical'
import type { RichTextFieldDiffServerComponent } from 'payload'

import { FieldDiffContainer, getHTMLDiffComponents } from '@payloadcms/ui/rsc'

import './index.scss'
import '../bundled.css'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type {
  HTMLConvertersFunctionAsync,
  HTMLPopulateFn,
} from '../../features/converters/lexicalToHtml/async/types.js'
import type { SerializedLinkNode } from '../../nodeTypes.js'

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

  const internalDocToHref = async ({
    linkNode,
    populate,
  }: {
    linkNode: SerializedLinkNode
    populate?: HTMLPopulateFn
  }) => {
    if (!linkNode.fields.doc) {
      return '#'
    }

    const { relationTo, value } = linkNode.fields.doc

    let docId: number | string

    if (typeof value === 'object' && value !== null) {
      docId = value.id
    } else if (populate && typeof value !== 'object') {
      const doc = await populate({
        id: value,
        collectionSlug: relationTo,
      })

      if (!doc || !doc.id) {
        return '#'
      }

      docId = doc.id
    } else {
      docId = value
    }

    return formatAdminURL({
      adminRoute: req.payload.config.routes.admin,
      path: `/collections/${relationTo}/${docId}`,
      serverURL: req.payload.config.serverURL,
    })
  }

  const converters: HTMLConvertersFunctionAsync = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkDiffHTMLConverterAsync({ internalDocToHref }),
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

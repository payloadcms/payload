import type {
  FileData,
  PayloadRequest,
  TypeWithID,
  UploadField,
  UploadFieldDiffServerComponent,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { FieldDiffContainer, File, getHTMLDiffComponents } from '@payloadcms/ui/rsc'

import './index.scss'

import React from 'react'

const baseClass = 'upload-diff'

type NonPolyUploadDoc = (FileData & TypeWithID) | number | string
type PolyUploadDoc = { relationTo: string; value: (FileData & TypeWithID) | number | string }

type UploadDoc = NonPolyUploadDoc | PolyUploadDoc

export const Upload: UploadFieldDiffServerComponent = (args) => {
  const {
    comparisonValue: valueFrom,
    field,
    i18n,
    locale,
    nestingLevel,
    req,
    versionValue: valueTo,
  } = args
  const hasMany = 'hasMany' in field && field.hasMany && Array.isArray(valueTo)
  const polymorphic = Array.isArray(field.relationTo)

  if (hasMany) {
    return (
      <HasManyUploadDiff
        field={field}
        i18n={i18n}
        locale={locale}
        nestingLevel={nestingLevel}
        polymorphic={polymorphic}
        req={req}
        valueFrom={valueFrom as UploadDoc[]}
        valueTo={valueTo as UploadDoc[]}
      />
    )
  }

  return (
    <SingleUploadDiff
      field={field}
      i18n={i18n}
      locale={locale}
      nestingLevel={nestingLevel}
      polymorphic={polymorphic}
      req={req}
      valueFrom={valueFrom as UploadDoc}
      valueTo={valueTo as UploadDoc}
    />
  )
}

export const HasManyUploadDiff: React.FC<{
  field: UploadField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: Array<UploadDoc>
  valueTo: Array<UploadDoc>
}> = async (args) => {
  const { field, i18n, locale, nestingLevel, polymorphic, req, valueFrom, valueTo } = args
  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = ''
  let To: React.ReactNode = ''

  const showCollectionSlug = Array.isArray(field.relationTo)

  const getUploadDocKey = (uploadDoc: UploadDoc): number | string => {
    if (typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
      // Polymorphic case
      const value = uploadDoc.value
      return typeof value === 'object' ? value.id : value
    }
    // Non-polymorphic case
    return typeof uploadDoc === 'object' ? uploadDoc.id : uploadDoc
  }

  const FromComponents = valueFrom
    ? valueFrom.map((uploadDoc) => (
        <UploadDocumentDiff
          i18n={i18n}
          key={getUploadDocKey(uploadDoc)}
          polymorphic={polymorphic}
          relationTo={field.relationTo}
          req={req}
          showCollectionSlug={showCollectionSlug}
          uploadDoc={uploadDoc}
        />
      ))
    : null
  const ToComponents = valueTo
    ? valueTo.map((uploadDoc) => (
        <UploadDocumentDiff
          i18n={i18n}
          key={getUploadDocKey(uploadDoc)}
          polymorphic={polymorphic}
          relationTo={field.relationTo}
          req={req}
          showCollectionSlug={showCollectionSlug}
          uploadDoc={uploadDoc}
        />
      ))
    : null

  const diffResult = getHTMLDiffComponents({
    fromHTML:
      `<div class="${baseClass}-hasMany">` +
      (FromComponents
        ? FromComponents.map(
            (component) => `<div>${ReactDOMServer.renderToStaticMarkup(component)}</div>`,
          ).join('')
        : '') +
      '</div>',
    toHTML:
      `<div class="${baseClass}-hasMany">` +
      (ToComponents
        ? ToComponents.map(
            (component) => `<div>${ReactDOMServer.renderToStaticMarkup(component)}</div>`,
          ).join('')
        : '') +
      '</div>',
    tokenizeByCharacter: false,
  })
  From = diffResult.From
  To = diffResult.To

  return (
    <FieldDiffContainer
      className={`${baseClass}-container ${baseClass}-container--hasMany`}
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

export const SingleUploadDiff: React.FC<{
  field: UploadField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: UploadDoc
  valueTo: UploadDoc
}> = async (args) => {
  const { field, i18n, locale, nestingLevel, polymorphic, req, valueFrom, valueTo } = args

  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = ''
  let To: React.ReactNode = ''

  const showCollectionSlug = Array.isArray(field.relationTo)

  const FromComponent = valueFrom ? (
    <UploadDocumentDiff
      i18n={i18n}
      polymorphic={polymorphic}
      relationTo={field.relationTo}
      req={req}
      showCollectionSlug={showCollectionSlug}
      uploadDoc={valueFrom}
    />
  ) : null
  const ToComponent = valueTo ? (
    <UploadDocumentDiff
      i18n={i18n}
      polymorphic={polymorphic}
      relationTo={field.relationTo}
      req={req}
      showCollectionSlug={showCollectionSlug}
      uploadDoc={valueTo}
    />
  ) : null

  const fromHtml = FromComponent
    ? ReactDOMServer.renderToStaticMarkup(FromComponent)
    : '<p>' + '' + '</p>'
  const toHtml = ToComponent
    ? ReactDOMServer.renderToStaticMarkup(ToComponent)
    : '<p>' + '' + '</p>'

  const diffResult = getHTMLDiffComponents({
    fromHTML: fromHtml,
    toHTML: toHtml,
    tokenizeByCharacter: false,
  })
  From = diffResult.From
  To = diffResult.To

  return (
    <FieldDiffContainer
      className={`${baseClass}-container ${baseClass}-container--hasOne`}
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

const UploadDocumentDiff = (args: {
  i18n: I18nClient
  polymorphic: boolean
  relationTo: string | string[]
  req: PayloadRequest
  showCollectionSlug?: boolean
  uploadDoc: UploadDoc
}) => {
  const { i18n, polymorphic, relationTo, req, showCollectionSlug, uploadDoc } = args

  let thumbnailSRC: string = ''

  const value = polymorphic
    ? (uploadDoc as { relationTo: string; value: FileData & TypeWithID }).value
    : (uploadDoc as FileData & TypeWithID)

  if (value && typeof value === 'object' && 'thumbnailURL' in value) {
    thumbnailSRC =
      (typeof value.thumbnailURL === 'string' && value.thumbnailURL) ||
      (typeof value.url === 'string' && value.url) ||
      ''
  }

  let filename: string
  if (value && typeof value === 'object') {
    filename = value.filename
  } else {
    filename = `${i18n.t('general:untitled')} - ID: ${uploadDoc as number | string}`
  }

  let pillLabel: null | string = null

  if (showCollectionSlug) {
    let collectionSlug: string
    if (polymorphic && typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
      collectionSlug = uploadDoc.relationTo
    } else {
      collectionSlug = typeof relationTo === 'string' ? relationTo : relationTo[0]
    }
    const uploadConfig = req.payload.collections[collectionSlug].config
    pillLabel = uploadConfig.labels?.singular
      ? getTranslation(uploadConfig.labels.singular, i18n)
      : uploadConfig.slug
  }

  let id: number | string | undefined
  if (polymorphic && typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
    const polyValue = uploadDoc.value
    id = typeof polyValue === 'object' ? polyValue.id : polyValue
  } else if (typeof uploadDoc === 'object' && 'id' in uploadDoc) {
    id = uploadDoc.id
  } else if (typeof uploadDoc === 'string' || typeof uploadDoc === 'number') {
    id = uploadDoc
  }

  const alt =
    (value && typeof value === 'object' && (value as { alt?: string }).alt) || filename || ''

  return (
    <div
      className={`${baseClass}`}
      data-enable-match="true"
      data-id={id}
      data-relation-to={relationTo}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__thumbnail`}>
          {thumbnailSRC?.length ? <img alt={alt} src={thumbnailSRC} /> : <File />}
        </div>
        {pillLabel && (
          <div className={`${baseClass}__pill`} data-enable-match="false">
            <span>{pillLabel}</span>
          </div>
        )}
        <div className={`${baseClass}__info`} data-enable-match="false">
          <strong>{filename}</strong>
        </div>
      </div>
    </div>
  )
}

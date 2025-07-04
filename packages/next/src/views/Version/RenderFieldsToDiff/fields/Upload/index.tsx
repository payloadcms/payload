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

type UploadDoc = (FileData & TypeWithID) | string

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

  if ('hasMany' in field && field.hasMany && Array.isArray(valueTo)) {
    return (
      <HasManyUploadDiff
        field={field}
        i18n={i18n}
        locale={locale}
        nestingLevel={nestingLevel}
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
  req: PayloadRequest
  valueFrom: Array<UploadDoc>
  valueTo: Array<UploadDoc>
}> = async (args) => {
  const { field, i18n, locale, nestingLevel, req, valueFrom, valueTo } = args
  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = ''
  let To: React.ReactNode = ''

  const showCollectionSlug = Array.isArray(field.relationTo)

  const FromComponents = valueFrom
    ? valueFrom.map((uploadDoc) => (
        <UploadDocumentDiff
          i18n={i18n}
          key={typeof uploadDoc === 'object' ? uploadDoc.id : uploadDoc}
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
          key={typeof uploadDoc === 'object' ? uploadDoc.id : uploadDoc}
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
  req: PayloadRequest
  valueFrom: UploadDoc
  valueTo: UploadDoc
}> = async (args) => {
  const { field, i18n, locale, nestingLevel, req, valueFrom, valueTo } = args

  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = ''
  let To: React.ReactNode = ''

  const showCollectionSlug = Array.isArray(field.relationTo)

  const FromComponent = valueFrom ? (
    <UploadDocumentDiff
      i18n={i18n}
      relationTo={field.relationTo}
      req={req}
      showCollectionSlug={showCollectionSlug}
      uploadDoc={valueFrom}
    />
  ) : null
  const ToComponent = valueTo ? (
    <UploadDocumentDiff
      i18n={i18n}
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
  relationTo: string
  req: PayloadRequest
  showCollectionSlug?: boolean
  uploadDoc: UploadDoc
}) => {
  const { i18n, relationTo, req, showCollectionSlug, uploadDoc } = args

  let thumbnailSRC: string = ''
  if (uploadDoc && typeof uploadDoc === 'object' && 'thumbnailURL' in uploadDoc) {
    thumbnailSRC =
      (typeof uploadDoc.thumbnailURL === 'string' && uploadDoc.thumbnailURL) ||
      (typeof uploadDoc.url === 'string' && uploadDoc.url) ||
      ''
  }

  let filename: string
  if (uploadDoc && typeof uploadDoc === 'object') {
    filename = uploadDoc.filename
  } else {
    filename = `${i18n.t('general:untitled')} - ID: ${uploadDoc as number | string}`
  }

  let pillLabel: null | string = null

  if (showCollectionSlug) {
    const uploadConfig = req.payload.collections[relationTo].config
    pillLabel = uploadConfig.labels?.singular
      ? getTranslation(uploadConfig.labels.singular, i18n)
      : uploadConfig.slug
  }

  return (
    <div
      className={`${baseClass}`}
      data-enable-match="true"
      data-id={typeof uploadDoc === 'object' ? uploadDoc?.id : uploadDoc}
      data-relation-to={relationTo}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__thumbnail`}>
          {thumbnailSRC?.length ? <img alt={filename} src={thumbnailSRC} /> : <File />}
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

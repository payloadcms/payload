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

  const placeholder = `[${i18n.t('general:noValue')}]`

  if ('hasMany' in field && field.hasMany && Array.isArray(valueTo)) {
    return (
      <HasManyUploadDiff
        field={field}
        i18n={i18n}
        locale={locale}
        nestingLevel={nestingLevel}
        placeholder={placeholder}
        req={req}
        valueFrom={valueFrom as any}
        valueTo={valueTo as any}
      />
    )
  }

  return (
    <SingleUploadDiff
      field={field}
      i18n={i18n}
      locale={locale}
      nestingLevel={nestingLevel}
      placeholder={placeholder}
      req={req}
      valueFrom={valueFrom as any}
      valueTo={valueTo as any}
    />
  )
}

export const HasManyUploadDiff: React.FC<{
  field: UploadField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  placeholder: string
  req: PayloadRequest
  valueFrom: Array<FileData & TypeWithID>
  valueTo: Array<FileData & TypeWithID>
}> = async (args) => {
  const { field, i18n, locale, nestingLevel, placeholder, req, valueFrom, valueTo } = args
  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = placeholder
  let To: React.ReactNode = placeholder

  const showCollectionSlug = Array.isArray(field.relationTo)

  const FromComponents = valueFrom
    ? valueFrom.map((uploadDoc) => (
        <UploadDocumentDiff
          i18n={i18n}
          key={uploadDoc.id}
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
          key={uploadDoc.id}
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
            (component) => `<div>${ReactDOMServer.renderToString(component)}</div>`,
          ).join('')
        : placeholder) +
      '</div>',
    toHTML:
      `<div class="${baseClass}-hasMany">` +
      (ToComponents
        ? ToComponents.map(
            (component) => `<div>${ReactDOMServer.renderToString(component)}</div>`,
          ).join('')
        : placeholder) +
      '</div>',
    tokenizeByCharacter: false,
  })
  From = diffResult.From
  To = diffResult.To

  return (
    <FieldDiffContainer
      className={`${baseClass}-container`}
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
  placeholder: string
  req: PayloadRequest
  valueFrom: FileData & TypeWithID
  valueTo: FileData & TypeWithID
}> = async (args) => {
  const { field, i18n, locale, nestingLevel, placeholder, req, valueFrom, valueTo } = args

  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = placeholder
  let To: React.ReactNode = placeholder

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

  const fromHtml = FromComponent ? ReactDOMServer.renderToString(FromComponent) : placeholder
  const toHtml = ToComponent ? ReactDOMServer.renderToString(ToComponent) : placeholder

  const diffResult = getHTMLDiffComponents({
    fromHTML: '<p>' + fromHtml + '</p>',
    toHTML: '<p>' + toHtml + '</p>',
    tokenizeByCharacter: false,
  })
  From = diffResult.From
  To = diffResult.To

  return (
    <FieldDiffContainer
      className={`${baseClass}-container`}
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
  uploadDoc: FileData & TypeWithID
}) => {
  const { i18n, relationTo, req, showCollectionSlug, uploadDoc } = args

  const thumbnailSRC: string =
    ('thumbnailURL' in uploadDoc && (uploadDoc?.thumbnailURL as string)) || uploadDoc?.url || ''

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
      data-id={uploadDoc?.id}
      data-relation-to={relationTo}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__thumbnail`}>
          {thumbnailSRC?.length ? <img alt={uploadDoc?.filename} src={thumbnailSRC} /> : <File />}
        </div>
        {pillLabel && (
          <div className={`${baseClass}__pill`} data-enable-match="false">
            <span>{pillLabel}</span>
          </div>
        )}
        <div className={`${baseClass}__info`} data-enable-match="false">
          <strong>{uploadDoc?.filename}</strong>
        </div>
      </div>
    </div>
  )
}

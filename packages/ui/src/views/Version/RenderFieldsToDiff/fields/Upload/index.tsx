import type {
  FileData,
  PayloadRequest,
  TypeWithID,
  UploadField,
  UploadFieldDiffServerComponent,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import React from 'react'

import { FieldDiffContainer } from '../../../../../elements/FieldDiffContainer/index.js'
import { File } from '../../../../../graphics/File/index.js'
import { DiffCollapser } from '../../DiffCollapser/index.js'
import './index.css'

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
  const hasMany =
    'hasMany' in field && field.hasMany && (Array.isArray(valueTo) || Array.isArray(valueFrom))
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
}> = (args) => {
  const { field, i18n, locale, nestingLevel, polymorphic, req, valueFrom, valueTo } = args

  const hasFrom = valueFrom && valueFrom.length > 0
  const hasTo = valueTo && valueTo.length > 0

  const getUploadDocKey = (uploadDoc: UploadDoc): number | string => {
    if (typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
      // Polymorphic case
      const value = uploadDoc.value
      return typeof value === 'object' ? value.id : value
    }
    // Non-polymorphic case
    return typeof uploadDoc === 'object' ? uploadDoc.id : uploadDoc
  }

  const showCollectionSlug = Array.isArray(field.relationTo)

  const FromComponents = hasFrom
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
  const ToComponents = hasTo
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

  const From = (
    <div className="html-diff__diff-old">
      <div className={`${baseClass}-hasMany`}>
        {FromComponents?.map((component, index) => <div key={index}>{component}</div>)}
      </div>
    </div>
  )
  const To = (
    <div className="html-diff__diff-new">
      <div className={`${baseClass}-hasMany`}>
        {ToComponents?.map((component, index) => <div key={index}>{component}</div>)}
      </div>
    </div>
  )

  const effectiveNesting = nestingLevel || 0

  const fromLength = valueFrom?.length || 0
  const toLength = valueTo?.length || 0
  const maxLength = Math.max(fromLength, toLength)
  let uploadChangeCount = 0

  for (let i = 0; i < maxLength; i++) {
    const fromKey = i < fromLength ? getUploadDocKey(valueFrom[i]) : undefined
    const toKey = i < toLength ? getUploadDocKey(valueTo[i]) : undefined

    if (fromKey !== toKey) {
      uploadChangeCount++
    }
  }

  const uploadGutterOffset = (effectiveNesting + 1) * 6.5

  return (
    <div className={`${baseClass}-container ${baseClass}-container--hasMany`}>
      <DiffCollapser
        changeCountOverride={uploadChangeCount}
        fields={[]}
        Label={
          <span>
            {locale && <span className="field-diff__locale-label">{locale}</span>}
            {typeof field.label !== 'function' &&
              field.label !== false &&
              getTranslation(field.label, i18n)}
          </span>
        }
        locales={undefined}
        parentIsLocalized={false}
        valueFrom={valueFrom}
        valueTo={valueTo}
      >
        <div
          className="field-diff-content"
          style={
            {
              '--field-diff-columns': `calc(50% - ${uploadGutterOffset}px) calc(50% + ${uploadGutterOffset}px)`,
            } as React.CSSProperties
          }
        >
          {From}
          {To}
        </div>
      </DiffCollapser>
    </div>
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
}> = (args) => {
  const { field, i18n, locale, nestingLevel, polymorphic, req, valueFrom, valueTo } = args

  const showCollectionSlug = Array.isArray(field.relationTo)

  const FromComponent = valueFrom ? (
    <UploadDocumentDiff
      i18n={i18n}
      polymorphic={polymorphic}
      relationTo={field.relationTo}
      req={req}
      uploadDoc={valueFrom}
    />
  ) : null
  const ToComponent = valueTo ? (
    <UploadDocumentDiff
      i18n={i18n}
      polymorphic={polymorphic}
      relationTo={field.relationTo}
      req={req}
      uploadDoc={valueTo}
    />
  ) : null

  const From = <div className="html-diff__diff-old">{FromComponent ?? <p></p>}</div>
  const To = <div className="html-diff__diff-new">{ToComponent ?? <p></p>}</div>

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

  {
    let collectionSlug: string
    if (polymorphic && typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
      collectionSlug = uploadDoc.relationTo
    } else {
      collectionSlug = typeof relationTo === 'string' ? relationTo : relationTo[0]
    }
    const uploadConfig = req?.payload?.collections?.[collectionSlug]?.config
    pillLabel = uploadConfig?.labels?.singular
      ? getTranslation(uploadConfig.labels.singular, i18n)
      : (uploadConfig?.slug ?? collectionSlug)
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

  let resolvedRelationTo: string
  if (polymorphic && typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
    resolvedRelationTo = uploadDoc.relationTo
  } else {
    resolvedRelationTo = typeof relationTo === 'string' ? relationTo : relationTo[0]
  }

  return (
    <div
      className={`${baseClass}`}
      data-enable-match="true"
      data-id={id}
      data-relation-to={resolvedRelationTo}
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
          {filename}
        </div>
      </div>
    </div>
  )
}

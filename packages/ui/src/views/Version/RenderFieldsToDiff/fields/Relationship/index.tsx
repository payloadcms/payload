import type {
  PayloadRequest,
  RelationshipField,
  RelationshipFieldDiffServerComponent,
  TypeWithID,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import React from 'react'

import { FieldDiffContainer } from '../../../../../elements/FieldDiffContainer/index.js'
import './index.scss'
import {
  escapeDiffHTML,
  getHTMLDiffComponents,
  unescapeDiffHTML,
} from '../../../../../elements/HTMLDiff/index.js'
import { generateLabelFromValue } from './generateLabelFromValue.js'
import { generateLabelFromValueSync } from './generateLabelFromValueSync.js'

const baseClass = 'relationship-diff'

export type RelationshipValue =
  | { relationTo: string; value: number | string | TypeWithID }
  | (number | string | TypeWithID)

function isFullPayloadRequest(req: PayloadRequest): boolean {
  return Boolean(req?.payload?.collections && typeof req.payload.findByID === 'function')
}

export const Relationship: RelationshipFieldDiffServerComponent = ({
  comparisonValue: valueFrom,
  field,
  i18n,
  locale,
  nestingLevel,
  parentIsLocalized,
  req,
  versionValue: valueTo,
}) => {
  const hasMany =
    ('hasMany' in field && field.hasMany) || Array.isArray(valueFrom) || Array.isArray(valueTo)
  const polymorphic = Array.isArray(field.relationTo)

  if (isFullPayloadRequest(req)) {
    if (hasMany) {
      return (
        <ManyRelationshipDiffAsync
          field={field}
          i18n={i18n}
          locale={locale}
          nestingLevel={nestingLevel}
          parentIsLocalized={parentIsLocalized}
          polymorphic={polymorphic}
          req={req}
          valueFrom={valueFrom as RelationshipValue[] | undefined}
          valueTo={valueTo as RelationshipValue[] | undefined}
        />
      )
    }

    return (
      <SingleRelationshipDiffAsync
        field={field}
        i18n={i18n}
        locale={locale}
        nestingLevel={nestingLevel}
        parentIsLocalized={parentIsLocalized}
        polymorphic={polymorphic}
        req={req}
        valueFrom={valueFrom as RelationshipValue}
        valueTo={valueTo as RelationshipValue}
      />
    )
  }

  if (hasMany) {
    return (
      <ManyRelationshipDiffSync
        field={field}
        i18n={i18n}
        locale={locale}
        nestingLevel={nestingLevel}
        parentIsLocalized={parentIsLocalized}
        polymorphic={polymorphic}
        req={req}
        valueFrom={valueFrom as RelationshipValue[] | undefined}
        valueTo={valueTo as RelationshipValue[] | undefined}
      />
    )
  }

  return (
    <SingleRelationshipDiffSync
      field={field}
      i18n={i18n}
      locale={locale}
      nestingLevel={nestingLevel}
      parentIsLocalized={parentIsLocalized}
      polymorphic={polymorphic}
      req={req}
      valueFrom={valueFrom as RelationshipValue}
      valueTo={valueTo as RelationshipValue}
    />
  )
}

type SingleDiffProps = {
  field: RelationshipField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  parentIsLocalized: boolean
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: RelationshipValue
  valueTo: RelationshipValue
}

type ManyDiffProps = {
  field: RelationshipField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  parentIsLocalized: boolean
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: RelationshipValue[] | undefined
  valueTo: RelationshipValue[] | undefined
}

export const SingleRelationshipDiff: React.FC<SingleDiffProps> = (args) => {
  return <SingleRelationshipDiffAsync {...args} />
}

const SingleRelationshipDiffAsync: React.FC<SingleDiffProps> = async (args) => {
  const {
    field,
    i18n,
    locale,
    nestingLevel,
    parentIsLocalized,
    polymorphic,
    req,
    valueFrom,
    valueTo,
  } = args

  const localeToUse =
    locale ??
    (req.payload.config?.localization && req.payload.config?.localization?.defaultLocale) ??
    'en'

  const [titleFrom, titleTo] = await Promise.all([
    valueFrom
      ? generateLabelFromValue({
          field,
          locale: localeToUse,
          parentIsLocalized,
          req,
          value: valueFrom,
        })
      : Promise.resolve(null),
    valueTo
      ? generateLabelFromValue({
          field,
          locale: localeToUse,
          parentIsLocalized,
          req,
          value: valueTo,
        })
      : Promise.resolve(null),
  ])

  return renderSingleDiff({
    field,
    i18n,
    locale,
    nestingLevel,
    polymorphic,
    req,
    titleFrom,
    titleTo,
    valueFrom,
    valueTo,
  })
}

function SingleRelationshipDiffSync(args: SingleDiffProps) {
  const {
    field,
    i18n,
    locale,
    nestingLevel,
    parentIsLocalized,
    polymorphic,
    req,
    valueFrom,
    valueTo,
  } = args

  const localeToUse =
    locale ??
    (req?.payload?.config?.localization && req.payload.config.localization.defaultLocale) ??
    'en'

  const collectionConfigs = extractCollectionConfigs(req)

  const titleFrom = valueFrom
    ? generateLabelFromValueSync({
        collectionConfigs,
        field,
        locale: localeToUse,
        parentIsLocalized,
        value: valueFrom,
      })
    : null
  const titleTo = valueTo
    ? generateLabelFromValueSync({
        collectionConfigs,
        field,
        locale: localeToUse,
        parentIsLocalized,
        value: valueTo,
      })
    : null

  return renderSingleDiff({
    field,
    i18n,
    locale,
    nestingLevel,
    polymorphic,
    req,
    titleFrom,
    titleTo,
    valueFrom,
    valueTo,
  })
}

function renderSingleDiff({
  field,
  i18n,
  locale,
  nestingLevel,
  polymorphic,
  req,
  titleFrom,
  titleTo,
  valueFrom,
  valueTo,
}: {
  field: RelationshipField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  polymorphic: boolean
  req: PayloadRequest
  titleFrom: null | string
  titleTo: null | string
  valueFrom: RelationshipValue
  valueTo: RelationshipValue
}) {
  const fromHTML = valueFrom
    ? renderRelationshipDocumentDiffHTML({
        i18n,
        polymorphic,
        relationTo: polymorphic
          ? (valueFrom as { relationTo: string; value: TypeWithID }).relationTo
          : (field.relationTo as string),
        req,
        showPill: true,
        title: titleFrom,
        value: valueFrom,
      })
    : '<p></p>'
  const toHTML = valueTo
    ? renderRelationshipDocumentDiffHTML({
        i18n,
        polymorphic,
        relationTo: polymorphic
          ? (valueTo as { relationTo: string; value: TypeWithID }).relationTo
          : (field.relationTo as string),
        req,
        showPill: true,
        title: titleTo,
        value: valueTo,
      })
    : '<p></p>'

  const diff = getHTMLDiffComponents({
    fromHTML,
    postProcess: unescapeDiffHTML,
    toHTML,
    tokenizeByCharacter: false,
  })

  return (
    <FieldDiffContainer
      className={`${baseClass}-container ${baseClass}-container--hasOne`}
      From={diff.From}
      i18n={i18n}
      label={{ label: field.label, locale }}
      nestingLevel={nestingLevel}
      To={diff.To}
    />
  )
}

const ManyRelationshipDiffAsync: React.FC<ManyDiffProps> = async ({
  field,
  i18n,
  locale,
  nestingLevel,
  parentIsLocalized,
  polymorphic,
  req,
  valueFrom,
  valueTo,
}) => {
  const fromArr = Array.isArray(valueFrom) ? valueFrom : []
  const toArr = Array.isArray(valueTo) ? valueTo : []

  const localeToUse =
    locale ??
    (req.payload.config?.localization && req.payload.config?.localization?.defaultLocale) ??
    'en'

  const [titlesFrom, titlesTo] = await Promise.all([
    Promise.all(
      fromArr.map((val) =>
        generateLabelFromValue({ field, locale: localeToUse, parentIsLocalized, req, value: val }),
      ),
    ),
    Promise.all(
      toArr.map((val) =>
        generateLabelFromValue({ field, locale: localeToUse, parentIsLocalized, req, value: val }),
      ),
    ),
  ])

  return renderManyDiff({
    field,
    fromArr,
    i18n,
    locale,
    nestingLevel,
    polymorphic,
    req,
    titlesFrom,
    titlesTo,
    toArr,
  })
}

function ManyRelationshipDiffSync({
  field,
  i18n,
  locale,
  nestingLevel,
  parentIsLocalized,
  polymorphic,
  req,
  valueFrom,
  valueTo,
}: ManyDiffProps) {
  const fromArr = Array.isArray(valueFrom) ? valueFrom : []
  const toArr = Array.isArray(valueTo) ? valueTo : []

  const localeToUse =
    locale ??
    (req?.payload?.config?.localization && req.payload.config.localization.defaultLocale) ??
    'en'

  const collectionConfigs = extractCollectionConfigs(req)

  const titlesFrom = fromArr.map((val) =>
    generateLabelFromValueSync({
      collectionConfigs,
      field,
      locale: localeToUse,
      parentIsLocalized,
      value: val,
    }),
  )
  const titlesTo = toArr.map((val) =>
    generateLabelFromValueSync({
      collectionConfigs,
      field,
      locale: localeToUse,
      parentIsLocalized,
      value: val,
    }),
  )

  return renderManyDiff({
    field,
    fromArr,
    i18n,
    locale,
    nestingLevel,
    polymorphic,
    req,
    titlesFrom,
    titlesTo,
    toArr,
  })
}

function renderManyDiff({
  field,
  fromArr,
  i18n,
  locale,
  nestingLevel,
  polymorphic,
  req,
  titlesFrom,
  titlesTo,
  toArr,
}: {
  field: RelationshipField
  fromArr: RelationshipValue[]
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  polymorphic: boolean
  req: PayloadRequest
  titlesFrom: string[]
  titlesTo: string[]
  toArr: RelationshipValue[]
}) {
  const makeHTML = (list: RelationshipValue[], titles: string[]) =>
    list.length > 0
      ? list
          .map((val, idx) =>
            renderRelationshipDocumentDiffHTML({
              i18n,
              polymorphic,
              relationTo: polymorphic
                ? (val as { relationTo: string; value: TypeWithID }).relationTo
                : (field.relationTo as string),
              req,
              showPill: polymorphic,
              title: titles[idx],
              value: val,
            }),
          )
          .join('')
      : `<p class="${baseClass}__empty"></p>`

  const fromHTML = makeHTML(fromArr, titlesFrom)
  const toHTML = makeHTML(toArr, titlesTo)

  const diff = getHTMLDiffComponents({
    fromHTML,
    postProcess: unescapeDiffHTML,
    toHTML,
    tokenizeByCharacter: false,
  })

  return (
    <FieldDiffContainer
      className={`${baseClass}-container ${baseClass}-container--hasMany`}
      From={diff.From}
      i18n={i18n}
      label={{ label: field.label, locale }}
      nestingLevel={nestingLevel}
      To={diff.To}
    />
  )
}

function extractCollectionConfigs(req: PayloadRequest) {
  if (req?.payload?.collections) {
    const configs: Record<string, any> = {}
    for (const [slug, collection] of Object.entries(req.payload.collections)) {
      if (collection?.config) {
        configs[slug] = collection.config
      }
    }
    return configs
  }
  return undefined
}

const renderRelationshipDocumentDiffHTML = ({
  i18n,
  polymorphic,
  relationTo,
  req,
  showPill = false,
  title,
  value,
}: {
  i18n: I18nClient
  polymorphic: boolean
  relationTo: string
  req: PayloadRequest
  showPill?: boolean
  title: null | string
  value: RelationshipValue
}) => {
  let pillLabel: null | string = null
  if (showPill) {
    const collectionConfig = req?.payload?.collections?.[relationTo]?.config
    pillLabel = collectionConfig?.labels?.singular
      ? getTranslation(collectionConfig.labels.singular, i18n)
      : (collectionConfig?.slug ?? relationTo)
  }

  const id = polymorphic
    ? ((value as { relationTo: string; value: TypeWithID })?.value?.id ?? String(value))
    : ((value as TypeWithID)?.id ?? String(value))
  const pillHTML = pillLabel
    ? `<span class="${baseClass}__pill" data-enable-match="false">${escapeDiffHTML(pillLabel)}</span>`
    : ''

  return `<div class="${baseClass}" data-enable-match="true" data-id="${escapeDiffHTML(id)}" data-relation-to="${escapeDiffHTML(relationTo)}">${pillHTML}<strong class="${baseClass}__info" data-enable-match="false">${escapeDiffHTML(title)}</strong></div>`
}

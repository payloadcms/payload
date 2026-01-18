import type {
  PayloadRequest,
  RelationshipField,
  RelationshipFieldDiffServerComponent,
  TypeWithID,
} from '@ruya.sa/payload'

import { getTranslation, type I18nClient } from '@ruya.sa/translations'
import { FieldDiffContainer, getHTMLDiffComponents } from '@ruya.sa/ui/rsc'

import './index.scss'

import React from 'react'

import { generateLabelFromValue } from './generateLabelFromValue.js'

const baseClass = 'relationship-diff'

export type RelationshipValue =
  | { relationTo: string; value: number | string | TypeWithID }
  | (number | string | TypeWithID)

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
  const hasMany = 'hasMany' in field && field.hasMany
  const polymorphic = Array.isArray(field.relationTo)

  if (hasMany) {
    return (
      <ManyRelationshipDiff
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
    <SingleRelationshipDiff
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

export const SingleRelationshipDiff: React.FC<{
  field: RelationshipField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  parentIsLocalized: boolean
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: RelationshipValue
  valueTo: RelationshipValue
}> = async (args) => {
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

  const ReactDOMServer = (await import('react-dom/server')).default

  const FromComponent = valueFrom ? (
    <RelationshipDocumentDiff
      field={field}
      i18n={i18n}
      locale={locale}
      parentIsLocalized={parentIsLocalized}
      polymorphic={polymorphic}
      relationTo={
        polymorphic
          ? (valueFrom as { relationTo: string; value: TypeWithID }).relationTo
          : (field.relationTo as string)
      }
      req={req}
      showPill={true}
      value={valueFrom}
    />
  ) : null
  const ToComponent = valueTo ? (
    <RelationshipDocumentDiff
      field={field}
      i18n={i18n}
      locale={locale}
      parentIsLocalized={parentIsLocalized}
      polymorphic={polymorphic}
      relationTo={
        polymorphic
          ? (valueTo as { relationTo: string; value: TypeWithID }).relationTo
          : (field.relationTo as string)
      }
      req={req}
      showPill={true}
      value={valueTo}
    />
  ) : null

  const fromHTML = FromComponent ? ReactDOMServer.renderToStaticMarkup(FromComponent) : `<p></p>`
  const toHTML = ToComponent ? ReactDOMServer.renderToStaticMarkup(ToComponent) : `<p></p>`

  const diff = getHTMLDiffComponents({
    fromHTML,
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

const ManyRelationshipDiff: React.FC<{
  field: RelationshipField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  parentIsLocalized: boolean
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: RelationshipValue[] | undefined
  valueTo: RelationshipValue[] | undefined
}> = async ({
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
  const ReactDOMServer = (await import('react-dom/server')).default

  const fromArr = Array.isArray(valueFrom) ? valueFrom : []
  const toArr = Array.isArray(valueTo) ? valueTo : []

  const makeNodes = (list: RelationshipValue[]) =>
    list.map((val, idx) => (
      <RelationshipDocumentDiff
        field={field}
        i18n={i18n}
        key={idx}
        locale={locale}
        parentIsLocalized={parentIsLocalized}
        polymorphic={polymorphic}
        relationTo={
          polymorphic
            ? (val as { relationTo: string; value: TypeWithID }).relationTo
            : (field.relationTo as string)
        }
        req={req}
        showPill={polymorphic}
        value={val}
      />
    ))

  const fromNodes =
    fromArr.length > 0 ? makeNodes(fromArr) : <p className={`${baseClass}__empty`}></p>

  const toNodes = toArr.length > 0 ? makeNodes(toArr) : <p className={`${baseClass}__empty`}></p>

  const fromHTML = ReactDOMServer.renderToStaticMarkup(fromNodes)
  const toHTML = ReactDOMServer.renderToStaticMarkup(toNodes)

  const diff = getHTMLDiffComponents({
    fromHTML,
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

const RelationshipDocumentDiff = ({
  field,
  i18n,
  locale,
  parentIsLocalized,
  polymorphic,
  relationTo,
  req,
  showPill = false,
  value,
}: {
  field: RelationshipField
  i18n: I18nClient
  locale: string
  parentIsLocalized: boolean
  polymorphic: boolean
  relationTo: string
  req: PayloadRequest
  showPill?: boolean
  value: RelationshipValue
}) => {
  const localeToUse =
    locale ??
    (req.payload.config?.localization && req.payload.config?.localization?.defaultLocale) ??
    'en'

  const title = generateLabelFromValue({
    field,
    locale: localeToUse,
    parentIsLocalized,
    req,
    value,
  })

  let pillLabel: null | string = null
  if (showPill) {
    const collectionConfig = req.payload.collections[relationTo].config
    pillLabel = collectionConfig.labels?.singular
      ? getTranslation(collectionConfig.labels.singular, i18n)
      : collectionConfig.slug
  }

  return (
    <div
      className={`${baseClass}`}
      data-enable-match="true"
      data-id={
        polymorphic
          ? (value as { relationTo: string; value: TypeWithID }).value.id
          : (value as TypeWithID).id
      }
      data-relation-to={relationTo}
    >
      {pillLabel && (
        <span className={`${baseClass}__pill`} data-enable-match="false">
          {pillLabel}
        </span>
      )}
      <strong className={`${baseClass}__info`} data-enable-match="false">
        {title}
      </strong>
    </div>
  )
}

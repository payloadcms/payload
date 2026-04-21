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
  const hasMany =
    ('hasMany' in field && field.hasMany) ||
    // Check data structure (handles block swaps where schema may not match data)
    Array.isArray(valueFrom) ||
    Array.isArray(valueTo)
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

  const localeToUse =
    locale ??
    (req.payload.config?.localization && req.payload.config?.localization?.defaultLocale) ??
    'en'

  // Generate titles asynchronously before creating components
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
  const fromArr = Array.isArray(valueFrom) ? valueFrom : []
  const toArr = Array.isArray(valueTo) ? valueTo : []

  const localeToUse =
    locale ??
    (req.payload.config?.localization && req.payload.config?.localization?.defaultLocale) ??
    'en'

  // Generate all titles asynchronously before creating components
  const [titlesFrom, titlesTo] = await Promise.all([
    Promise.all(
      fromArr.map((val) =>
        generateLabelFromValue({
          field,
          locale: localeToUse,
          parentIsLocalized,
          req,
          value: val,
        }),
      ),
    ),
    Promise.all(
      toArr.map((val) =>
        generateLabelFromValue({
          field,
          locale: localeToUse,
          parentIsLocalized,
          req,
          value: val,
        }),
      ),
    ),
  ])

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
    const collectionConfig = req.payload.collections[relationTo].config
    pillLabel = collectionConfig.labels?.singular
      ? getTranslation(collectionConfig.labels.singular, i18n)
      : collectionConfig.slug
  }

  const id = polymorphic
    ? (value as { relationTo: string; value: TypeWithID }).value.id
    : (value as TypeWithID).id
  const pillHTML = pillLabel
    ? `<span class="${baseClass}__pill" data-enable-match="false">${escapeDiffHTML(pillLabel)}</span>`
    : ''

  return `<div class="${baseClass}" data-enable-match="true" data-id="${escapeDiffHTML(id)}" data-relation-to="${escapeDiffHTML(relationTo)}">${pillHTML}<strong class="${baseClass}__info" data-enable-match="false">${escapeDiffHTML(title)}</strong></div>`
}

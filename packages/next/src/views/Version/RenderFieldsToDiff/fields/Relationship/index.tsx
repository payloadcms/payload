import type {
  PayloadRequest,
  RelationshipField,
  RelationshipFieldDiffServerComponent,
  TypeWithID,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { FieldDiffContainer, getHTMLDiffComponents } from '@payloadcms/ui/rsc'

import './index.scss'

import React from 'react'

import { generateLabelFromValue } from './generateLabelFromValue.js'

const baseClass = 'relationship-diff'

export type PopulatedRelationshipValue = { relationTo: string; value: TypeWithID } | TypeWithID

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
  const placeholder = `[${i18n.t('general:noValue')}]`

  const localeToUse =
    locale ??
    (req.payload.config?.localization && req.payload.config?.localization?.defaultLocale) ??
    'en'

  if (hasMany) {
    return <p>TODO</p>
  }

  return (
    <SingleRelationshipDiff
      field={field}
      i18n={i18n}
      // Locale only exists if this is a localized field
      // If this is not a localized field, we'll use the default locale
      locale={localeToUse}
      nestingLevel={nestingLevel}
      parentIsLocalized={parentIsLocalized}
      placeholder={placeholder}
      polymorphic={polymorphic}
      req={req}
      valueFrom={valueFrom as PopulatedRelationshipValue}
      valueTo={valueTo as PopulatedRelationshipValue}
    />
  )
}

export const SingleRelationshipDiff: React.FC<{
  field: RelationshipField
  i18n: I18nClient
  locale: string
  nestingLevel?: number
  parentIsLocalized: boolean
  placeholder: string
  polymorphic: boolean
  req: PayloadRequest
  valueFrom: PopulatedRelationshipValue
  valueTo: PopulatedRelationshipValue
}> = async (args) => {
  const {
    field,
    i18n,
    locale,
    nestingLevel,
    parentIsLocalized,
    placeholder,
    polymorphic,
    req,
    valueFrom,
    valueTo,
  } = args

  const ReactDOMServer = (await import('react-dom/server')).default

  let From: React.ReactNode = placeholder
  let To: React.ReactNode = placeholder

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

  const fromHtml = FromComponent
    ? ReactDOMServer.renderToString(FromComponent)
    : '<p>' + placeholder + '</p>'
  const toHtml = ToComponent
    ? ReactDOMServer.renderToString(ToComponent)
    : '<p>' + placeholder + '</p>'

  const diffResult = getHTMLDiffComponents({
    fromHTML: fromHtml,
    toHTML: toHtml,
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

const RelationshipDocumentDiff = (args: {
  field: RelationshipField
  i18n: I18nClient
  locale: string
  parentIsLocalized: boolean
  polymorphic: boolean
  relationTo: string
  req: PayloadRequest
  showPill?: boolean
  value: PopulatedRelationshipValue
}) => {
  const { field, i18n, locale, parentIsLocalized, polymorphic, relationTo, req, showPill, value } =
    args

  let pillLabel: null | string = null
  const title = generateLabelFromValue({
    field,
    locale,
    parentIsLocalized,
    req,
    value,
  })

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

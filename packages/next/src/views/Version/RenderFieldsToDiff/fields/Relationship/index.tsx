'use client'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  RelationshipFieldDiffClientComponent,
} from 'payload'

import {
  FieldDiffContainer,
  getHTMLDiffComponents,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { fieldAffectsData, fieldIsPresentationalOnly, fieldShouldBeLocalized } from 'payload/shared'
import React from 'react'

import './index.scss'

const baseClass = 'relationship-diff'

type RelationshipValue = Record<string, any>

const generateLabelFromValue = (
  collections: ClientCollectionConfig[],
  field: ClientField,
  locale: string,
  value: { relationTo: string; value: RelationshipValue } | RelationshipValue,
  config: ClientConfig,
  parentIsLocalized: boolean,
): string => {
  if (Array.isArray(value)) {
    return value
      .map((v) => generateLabelFromValue(collections, field, locale, v, config, parentIsLocalized))
      .filter(Boolean) // Filters out any undefined or empty values
      .join(', ')
  }

  let relatedDoc: RelationshipValue
  let valueToReturn: RelationshipValue | string = ''

  const relationTo = 'relationTo' in field ? field.relationTo : undefined

  if (value === null || typeof value === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- We want to return a string specifilly for null and undefined
    return String(value)
  }

  if (typeof value === 'object' && 'relationTo' in value) {
    relatedDoc = value.value
  } else {
    // Non-polymorphic relationship
    relatedDoc = value
  }

  const relatedCollection = relationTo
    ? collections.find(
        (c) =>
          c.slug ===
          (typeof value === 'object' && 'relationTo' in value ? value.relationTo : relationTo),
      )
    : null

  if (relatedCollection) {
    const useAsTitle = relatedCollection?.admin?.useAsTitle
    const useAsTitleField = relatedCollection.fields.find(
      (f) => fieldAffectsData(f) && !fieldIsPresentationalOnly(f) && f.name === useAsTitle,
    )
    let titleFieldIsLocalized = false

    if (useAsTitleField && fieldAffectsData(useAsTitleField)) {
      titleFieldIsLocalized = fieldShouldBeLocalized({ field: useAsTitleField, parentIsLocalized })
    }

    if (typeof relatedDoc?.[useAsTitle] !== 'undefined') {
      valueToReturn = relatedDoc[useAsTitle]
    } else if (typeof relatedDoc?.id !== 'undefined') {
      valueToReturn = relatedDoc.id
    } else {
      valueToReturn = relatedDoc
    }

    if (typeof valueToReturn === 'object' && titleFieldIsLocalized && valueToReturn?.[locale]) {
      valueToReturn = valueToReturn[locale]
    }
  } else if (relatedDoc) {
    // Handle non-polymorphic `hasMany` relationships or fallback
    if (typeof relatedDoc?.id !== 'undefined') {
      valueToReturn = String(relatedDoc.id)
    } else {
      valueToReturn = relatedDoc
    }
  }

  if (
    (valueToReturn && typeof valueToReturn === 'object' && valueToReturn !== null) ||
    typeof valueToReturn !== 'string'
  ) {
    valueToReturn = JSON.stringify(valueToReturn)
  }

  return valueToReturn
}

export const Relationship: RelationshipFieldDiffClientComponent = ({
  comparisonValue: valueFrom,
  field,
  locale,
  parentIsLocalized,
  versionValue: valueTo,
}) => {
  const { i18n } = useTranslation()
  const { config } = useConfig()

  const placeholder = `[${i18n.t('general:noValue')}]`

  const {
    config: { collections },
  } = useConfig()

  let renderedValueTo: string | undefined = placeholder
  let renderedValueFrom: string | undefined = placeholder

  if (valueTo) {
    if ('hasMany' in field && field.hasMany && Array.isArray(valueTo)) {
      renderedValueTo =
        valueTo
          .map((val) =>
            generateLabelFromValue(collections, field, locale, val, config, parentIsLocalized),
          )
          .join(', ') || placeholder
    } else {
      renderedValueTo =
        generateLabelFromValue(collections, field, locale, valueTo, config, parentIsLocalized) ||
        placeholder
    }
  }

  if (valueFrom) {
    if ('hasMany' in field && field.hasMany && Array.isArray(valueFrom)) {
      renderedValueFrom =
        valueFrom
          .map((val) =>
            generateLabelFromValue(collections, field, locale, val, config, parentIsLocalized),
          )
          .join(', ') || placeholder
    } else {
      renderedValueFrom =
        generateLabelFromValue(collections, field, locale, valueFrom, config, parentIsLocalized) ||
        placeholder
    }
  }

  const { From, To } = getHTMLDiffComponents({
    fromHTML: '<p>' + renderedValueFrom + '</p>',
    toHTML: '<p>' + renderedValueTo + '</p>',
    tokenizeByCharacter: false,
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
      To={To}
    />
  )
}

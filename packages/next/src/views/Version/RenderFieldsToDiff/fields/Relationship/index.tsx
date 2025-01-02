'use client'
import type { ClientCollectionConfig, ClientField, RelationshipFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useConfig } from '@payloadcms/ui'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'
import React from 'react'
import ReactDiffViewerImport from 'react-diff-viewer-continued'

import type { DiffComponentProps } from '../types.js'

import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import './index.scss'

const ReactDiffViewer = (ReactDiffViewerImport.default ||
  ReactDiffViewerImport) as unknown as typeof ReactDiffViewerImport.default

const baseClass = 'relationship-diff'

type RelationshipValue = Record<string, any>

const generateLabelFromValue = (
  collections: ClientCollectionConfig[],
  field: ClientField,
  locale: string,
  value: { relationTo: string; value: RelationshipValue } | RelationshipValue,
): string => {
  if (Array.isArray(value)) {
    return value
      .map((v) => generateLabelFromValue(collections, field, locale, v))
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
      titleFieldIsLocalized = useAsTitleField.localized
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

const Relationship: React.FC<DiffComponentProps<RelationshipFieldClient>> = ({
  comparison,
  field,
  i18n,
  locale,
  version,
}) => {
  const placeholder = `[${i18n.t('general:noValue')}]`

  const {
    config: { collections },
  } = useConfig()

  let versionToRender: string | undefined = placeholder
  let comparisonToRender: string | undefined = placeholder

  if (version) {
    if ('hasMany' in field && field.hasMany && Array.isArray(version)) {
      versionToRender =
        version.map((val) => generateLabelFromValue(collections, field, locale, val)).join(', ') ||
        placeholder
    } else {
      versionToRender = generateLabelFromValue(collections, field, locale, version) || placeholder
    }
  }

  if (comparison) {
    if ('hasMany' in field && field.hasMany && Array.isArray(comparison)) {
      comparisonToRender =
        comparison
          .map((val) => generateLabelFromValue(collections, field, locale, val))
          .join(', ') || placeholder
    } else {
      comparisonToRender =
        generateLabelFromValue(collections, field, locale, comparison) || placeholder
    }
  }

  const label =
    'label' in field && typeof field.label !== 'boolean' && typeof field.label !== 'function'
      ? field.label
      : ''

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(label, i18n)}
      </Label>
      <ReactDiffViewer
        hideLineNumbers
        newValue={versionToRender}
        oldValue={comparisonToRender}
        showDiffOnly={false}
        splitView
        styles={diffStyles}
      />
    </div>
  )
}

export default Relationship

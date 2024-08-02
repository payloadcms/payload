'use client'
import type { ClientCollectionConfig, ClientFieldConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useConfig } from '@payloadcms/ui'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'
import React from 'react'
import ReactDiffViewerImport from 'react-diff-viewer-continued'

import type { Props } from '../types.js'

import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import './index.scss'

const ReactDiffViewer = (ReactDiffViewerImport.default ||
  ReactDiffViewerImport) as unknown as typeof ReactDiffViewerImport.default

const baseClass = 'relationship-diff'

type RelationshipValue = Record<string, any>

const generateLabelFromValue = (
  collections: ClientCollectionConfig[],
  field: ClientFieldConfig,
  locale: string,
  value: { relationTo: string; value: RelationshipValue } | RelationshipValue,
): string => {
  let relation: string
  let relatedDoc: RelationshipValue
  let valueToReturn = '' as any

  const relationTo =
    'relationTo' in field.fieldComponentProps ? field.fieldComponentProps.relationTo : undefined

  if (value === null || typeof value === 'undefined') {
    return String(value)
  }

  if (Array.isArray(relationTo)) {
    if (typeof value === 'object') {
      relation = value.relationTo
      relatedDoc = value.value
    }
  } else {
    relation = relationTo
    relatedDoc = value
  }

  const relatedCollection = collections.find((c) => c.slug === relation)

  if (relatedCollection) {
    const useAsTitle = relatedCollection?.admin?.useAsTitle
    const useAsTitleField = relatedCollection.fields.find(
      (f) => fieldAffectsData(f) && !fieldIsPresentationalOnly(f) && f.name === useAsTitle,
    )
    let titleFieldIsLocalized = false

    if (useAsTitleField && fieldAffectsData(useAsTitleField))
      titleFieldIsLocalized = useAsTitleField.localized

    if (typeof relatedDoc?.[useAsTitle] !== 'undefined') {
      valueToReturn = relatedDoc[useAsTitle]
    } else if (typeof relatedDoc?.id !== 'undefined') {
      valueToReturn = relatedDoc.id
    }

    if (typeof valueToReturn === 'object' && titleFieldIsLocalized) {
      valueToReturn = valueToReturn[locale]
    }
  }

  return valueToReturn
}

const Relationship: React.FC<Props> = ({ comparison, field, i18n, locale, version }) => {
  let placeholder = ''

  const {
    config: { collections },
  } = useConfig()

  if (version === comparison) placeholder = `[${i18n.t('general:noValue')}]`

  let versionToRender = version
  let comparisonToRender = comparison

  if ('hasMany' in field && field.hasMany) {
    if (Array.isArray(version))
      versionToRender = version
        .map((val) => generateLabelFromValue(collections, field, locale, val))
        .join(', ')
    if (Array.isArray(comparison))
      comparisonToRender = comparison
        .map((val) => generateLabelFromValue(collections, field, locale, val))
        .join(', ')
  } else {
    versionToRender = generateLabelFromValue(collections, field, locale, version)
    comparisonToRender = generateLabelFromValue(collections, field, locale, comparison)
  }

  const label =
    'label' in field.fieldComponentProps &&
    typeof field.fieldComponentProps.label !== 'boolean' &&
    typeof field.fieldComponentProps.label !== 'function'
      ? field.fieldComponentProps.label
      : ''

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(label, i18n)}
      </Label>
      <ReactDiffViewer
        hideLineNumbers
        newValue={typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder}
        oldValue={
          typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder
        }
        showDiffOnly={false}
        splitView
        styles={diffStyles}
      />
    </div>
  )
}

export default Relationship

import React from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../../../collections/config/types'
import type { RelationshipField } from '../../../../../../../fields/config/types'
import type { Props } from '../types'

import { fieldAffectsData } from '../../../../../../../fields/config/types'
import { getTranslation } from '../../../../../../../utilities/getTranslation'
import { useUseTitleField } from '../../../../../../hooks/useUseAsTitle'
import { useConfig } from '../../../../../utilities/Config'
import { useLocale } from '../../../../../utilities/Locale'
import Label from '../../Label'
import { diffStyles } from '../styles'
import './index.scss'

const baseClass = 'relationship-diff'

type RelationshipValue = Record<string, any>

const generateLabelFromValue = (
  collections: SanitizedCollectionConfig[],
  field: RelationshipField,
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
  let valueToReturn = '' as any

  if (value === null || typeof value === 'undefined') {
    return String(value)
  }

  const relationTo = 'relationTo' in field ? field.relationTo : undefined

  if (value === null || typeof value === 'undefined') {
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
    const useAsTitleField = useUseTitleField(relatedCollection)
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

    if (typeof valueToReturn === 'object' && titleFieldIsLocalized) {
      valueToReturn = valueToReturn[locale]
    }
  } else if (relatedDoc) {
    // Handle non-polymorphic `hasMany` relationships or fallback
    if (typeof relatedDoc.id !== 'undefined') {
      valueToReturn = relatedDoc.id
    } else {
      valueToReturn = relatedDoc
    }
  }

  if (typeof valueToReturn === 'object' && valueToReturn !== null) {
    valueToReturn = JSON.stringify(valueToReturn)
  }

  return valueToReturn
}

const Relationship: React.FC<Props & { field: RelationshipField }> = ({
  comparison,
  field,
  version,
}) => {
  const { collections } = useConfig()
  const { i18n, t } = useTranslation('general')
  const { code: locale } = useLocale()

  const placeholder = `[${t('noValue')}]`

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

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(field.label, i18n)}
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

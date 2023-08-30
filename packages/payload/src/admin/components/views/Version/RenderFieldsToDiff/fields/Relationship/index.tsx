import React from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../../../collections/config/types.js'
import type { RelationshipField } from '../../../../../../../fields/config/types.js'
import type { Props } from '../types.js'

import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
} from '../../../../../../../fields/config/types.js'
import { getTranslation } from '../../../../../../../utilities/getTranslation.js'
import { useConfig } from '../../../../../utilities/Config/index.js'
import { useLocale } from '../../../../../utilities/Locale/index.js'
import Label from '../../Label/index.js'
import { diffStyles } from '../styles.js'
import './index.scss'

const baseClass = 'relationship-diff'

type RelationshipValue = Record<string, any>

const generateLabelFromValue = (
  collections: SanitizedCollectionConfig[],
  field: RelationshipField,
  locale: string,
  value: { relationTo: string; value: RelationshipValue } | RelationshipValue,
): string => {
  let relation: string
  let relatedDoc: RelationshipValue
  let valueToReturn = '' as any

  if (Array.isArray(field.relationTo)) {
    if (typeof value === 'object') {
      relation = value.relationTo
      relatedDoc = value.value
    }
  } else {
    relation = field.relationTo
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

const Relationship: React.FC<Props & { field: RelationshipField }> = ({
  comparison,
  field,
  version,
}) => {
  const { collections } = useConfig()
  const { i18n, t } = useTranslation('general')
  const { code: locale } = useLocale()

  let placeholder = ''

  if (version === comparison) placeholder = `[${t('noValue')}]`

  let versionToRender = version
  let comparisonToRender = comparison

  if (field.hasMany) {
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
  const ReactDiffViewerToUse =
    'default' in ReactDiffViewer ? ReactDiffViewer.default : ReactDiffViewer

  return (
    <div className={baseClass}>
      <Label>
        {locale && <span className={`${baseClass}__locale-label`}>{locale}</span>}
        {getTranslation(field.label, i18n)}
      </Label>
      <ReactDiffViewerToUse
        oldValue={
          typeof comparisonToRender !== 'undefined' ? String(comparisonToRender) : placeholder
        }
        hideLineNumbers
        newValue={typeof versionToRender !== 'undefined' ? String(versionToRender) : placeholder}
        showDiffOnly={false}
        splitView
        styles={diffStyles}
      />
    </div>
  )

  return null
}

export default Relationship

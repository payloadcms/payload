import type { RelationshipField, TypeWithID } from 'payload'

import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
  fieldShouldBeLocalized,
  flattenTopLevelFields,
} from 'payload/shared'

import type { RelationshipValue } from './index.js'

/**
 * Synchronous variant of generateLabelFromValue for non-RSC contexts.
 * Works with already-populated documents; falls back to showing the ID
 * when only a bare ID is available (no async DB lookup).
 */
export const generateLabelFromValueSync = ({
  collectionConfigs,
  field,
  locale,
  parentIsLocalized,
  value,
}: {
  collectionConfigs?: Record<
    string,
    {
      admin?: { useAsTitle?: string }
      fields: any[]
      labels?: { singular?: Record<string, string> | string }
      slug: string
    }
  >
  field: RelationshipField
  locale: string
  parentIsLocalized: boolean
  value: RelationshipValue
}): string => {
  let relatedDoc: number | string | TypeWithID
  let relationTo: string = field.relationTo as string

  if (typeof value === 'object' && 'relationTo' in value) {
    relatedDoc = value.value
    relationTo = value.relationTo
  } else {
    relatedDoc = value
  }

  const relatedCollection = collectionConfigs?.[relationTo]
  const useAsTitle = relatedCollection?.admin?.useAsTitle

  if (useAsTitle) {
    const flattenedFields = flattenTopLevelFields(relatedCollection.fields, {
      moveSubFieldsToTop: true,
    })

    const useAsTitleField = flattenedFields.find(
      (f) => fieldAffectsData(f) && !fieldIsPresentationalOnly(f) && f.name === useAsTitle,
    )

    let titleFieldIsLocalized = false
    if (useAsTitleField && fieldAffectsData(useAsTitleField)) {
      titleFieldIsLocalized = fieldShouldBeLocalized({ field: useAsTitleField, parentIsLocalized })
    }

    if (
      typeof relatedDoc === 'object' &&
      relatedDoc !== null &&
      relatedDoc[useAsTitle] !== undefined
    ) {
      let valueToReturn = relatedDoc[useAsTitle]
      if (
        typeof valueToReturn === 'object' &&
        valueToReturn &&
        titleFieldIsLocalized &&
        valueToReturn[locale]
      ) {
        valueToReturn = valueToReturn[locale]
      }
      if (typeof valueToReturn !== 'string') {
        valueToReturn = JSON.stringify(valueToReturn)
      }
      return valueToReturn
    }
  }

  if (typeof relatedDoc === 'object' && relatedDoc !== null && 'id' in relatedDoc) {
    return String(relatedDoc.id)
  }

  return String(relatedDoc)
}

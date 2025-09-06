import type { PayloadRequest, RelationshipField, TypeWithID } from 'payload'

import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
  fieldShouldBeLocalized,
  flattenTopLevelFields,
} from 'payload/shared'

import type { RelationshipValue } from './index.js'

export const generateLabelFromValue = ({
  field,
  locale,
  parentIsLocalized,
  req,
  value,
}: {
  field: RelationshipField
  locale: string
  parentIsLocalized: boolean
  req: PayloadRequest
  value: RelationshipValue
}): string => {
  let relatedDoc: number | string | TypeWithID
  let relationTo: string = field.relationTo as string
  let valueToReturn: string = ''

  if (typeof value === 'object' && 'relationTo' in value) {
    relatedDoc = value.value
    relationTo = value.relationTo
  } else {
    // Non-polymorphic relationship or deleted document
    relatedDoc = value
  }

  const relatedCollection = req.payload.collections[relationTo].config

  const useAsTitle = relatedCollection?.admin?.useAsTitle

  const flattenedRelatedCollectionFields = flattenTopLevelFields(relatedCollection.fields, {
    moveSubFieldsToTop: true,
  })

  const useAsTitleField = flattenedRelatedCollectionFields.find(
    (f) => fieldAffectsData(f) && !fieldIsPresentationalOnly(f) && f.name === useAsTitle,
  )
  let titleFieldIsLocalized = false

  if (useAsTitleField && fieldAffectsData(useAsTitleField)) {
    titleFieldIsLocalized = fieldShouldBeLocalized({ field: useAsTitleField, parentIsLocalized })
  }

  if (typeof relatedDoc?.[useAsTitle] !== 'undefined') {
    valueToReturn = relatedDoc[useAsTitle]
  } else {
    valueToReturn = String(
      typeof relatedDoc === 'object'
        ? relatedDoc.id
        : `${req.i18n.t('general:untitled')} - ID: ${relatedDoc}`,
    )
  }

  if (
    typeof valueToReturn === 'object' &&
    valueToReturn &&
    titleFieldIsLocalized &&
    valueToReturn?.[locale]
  ) {
    valueToReturn = valueToReturn[locale]
  }

  if (
    (valueToReturn && typeof valueToReturn === 'object' && valueToReturn !== null) ||
    typeof valueToReturn !== 'string'
  ) {
    valueToReturn = JSON.stringify(valueToReturn)
  }

  return valueToReturn
}

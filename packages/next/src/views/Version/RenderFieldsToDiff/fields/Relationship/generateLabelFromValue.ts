import type { PayloadRequest, RelationshipField, TypeWithID } from 'payload'

import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
  fieldShouldBeLocalized,
  flattenTopLevelFields,
} from 'payload/shared'

import type { RelationshipValue } from './index.js'

export const generateLabelFromValue = async ({
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
}): Promise<string> => {
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
  } else if (typeof relatedDoc === 'string' || typeof relatedDoc === 'number') {
    // When relatedDoc is just an ID (due to maxDepth: 0), fetch the document to get the title
    try {
      const fetchedDoc = await req.payload.findByID({
        id: relatedDoc,
        collection: relationTo,
        depth: 0,
        locale: titleFieldIsLocalized ? locale : undefined,
        req,
        select: {
          [useAsTitle]: true,
        },
      })

      if (fetchedDoc?.[useAsTitle]) {
        valueToReturn = fetchedDoc[useAsTitle]
      } else {
        valueToReturn = `${req.i18n.t('general:untitled')} - ID: ${relatedDoc}`
      }
    } catch (error) {
      // Document might have been deleted or user doesn't have access
      valueToReturn = `${req.i18n.t('general:untitled')} - ID: ${relatedDoc}`
    }
  } else {
    valueToReturn = String(typeof relatedDoc === 'object' ? relatedDoc.id : relatedDoc)
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

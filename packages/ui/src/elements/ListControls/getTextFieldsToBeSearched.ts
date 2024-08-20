'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { fieldAffectsData } from 'payload/shared'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientField[],
  i18n: I18nClient,
): ClientField[] => {
  if (listSearchableFields) {
    const flattenedFields = flattenFieldMap({ fields, i18n })
    return flattenedFields.filter(
      (field) => fieldAffectsData(field) && listSearchableFields.includes(field.name),
    )
  }

  return null
}

'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { fieldAffectsData, flattenTopLevelFields } from 'payload/shared'

type SearchableField = {
  field: ClientField
  /**
   * Whether the bare `field.name` may be matched. True for everything that was already reachable
   * before arrays were walked, so existing configs naming a hoisted subfield keep working, and
   * false for fields found inside an array, where only the full path is a valid query path.
   */
  matchBareName: boolean
  path: string | undefined
}

/**
 * The dotted path `flattenTopLevelFields` built for a hoisted field, or its plain name when it was
 * already top level.
 */
const getFieldPath = (field: ClientField, pathPrefix?: string): string | undefined => {
  const { accessor } = field as { accessor?: string }

  if (accessor) {
    return accessor
  }

  const name = 'name' in field ? field.name : undefined

  if (!name) {
    return pathPrefix
  }

  return pathPrefix ? `${pathPrefix}.${name}` : name
}

/**
 * `flattenTopLevelFields` hoists group, tab, row and collapsible subfields and records the dotted
 * path it built on `accessor`, but it stops at arrays. Arrays are walked here as well, so a
 * configured path like `items.value` resolves to that subfield.
 */
const flattenSearchableFields = (
  fields: ClientField[],
  i18n: I18nClient,
  pathPrefix?: string,
): SearchableField[] => {
  const flattenedFields = flattenTopLevelFields(fields, {
    i18n,
    moveSubFieldsToTop: true,
    pathPrefix,
  }) as ClientField[]

  // A prefix is only passed when recursing into an array, so its absence marks the fields that
  // were already matchable by name.
  const matchBareName = pathPrefix === undefined

  return flattenedFields.flatMap((field) => {
    const path = getFieldPath(field, pathPrefix)
    const searchableField: SearchableField = { field, matchBareName, path }

    if (field.type !== 'array' || !('fields' in field)) {
      return [searchableField]
    }

    return [
      searchableField,
      ...flattenSearchableFields(field.fields as ClientField[], i18n, path),
    ]
  })
}

export const getTextFieldsToBeSearched = (
  listSearchableFields: string[],
  fields: ClientField[],
  i18n: I18nClient,
): ClientField[] => {
  if (listSearchableFields) {
    const searchableFieldNames = new Set(listSearchableFields)
    const matchingFields: ClientField[] = []

    for (const { field, matchBareName, path } of flattenSearchableFields(fields, i18n)) {
      if (!fieldAffectsData(field)) {
        continue
      }

      const matchedName = [path, matchBareName ? field.name : undefined].find(
        (name) => name && searchableFieldNames.has(name),
      )

      if (matchedName) {
        matchingFields.push(field)
        searchableFieldNames.delete(matchedName)
      }
    }

    return matchingFields
  }

  return null
}

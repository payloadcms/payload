import type { I18nClient } from '@payloadcms/translations'
import type { FieldMap, MappedField } from 'payload'

import { getTranslation } from '@payloadcms/translations'

export type FlattenFieldMapArgs = {
  fieldMap: FieldMap
  i18n: I18nClient
  keepPresentationalFields?: boolean
  labelPrefix?: string
}

export type FlattenFieldMapResult = ({
  labelWithPrefix?: string
} & MappedField)[]

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
export const flattenFieldMap = ({
  fieldMap,
  i18n,
  keepPresentationalFields,
  labelPrefix,
}: FlattenFieldMapArgs): FlattenFieldMapResult => {
  return fieldMap.reduce((acc, field) => {
    if ('fieldMap' in field.fieldComponentProps && field.type !== 'array') {
      const translatedLabel = field.fieldComponentProps.label
        ? getTranslation(field.fieldComponentProps.label, i18n)
        : undefined
      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      acc.push(
        ...flattenFieldMap({
          fieldMap: field.fieldComponentProps.fieldMap,
          i18n,
          keepPresentationalFields,
          labelPrefix: labelWithPrefix,
        }),
      )
    } else if ('name' in field || (keepPresentationalFields && field.fieldIsPresentational)) {
      if (field.name === 'id' && labelPrefix !== undefined) {
        // ignore nested id fields
        return acc
      }

      const translatedLabel = field.fieldComponentProps.label
        ? getTranslation(field.fieldComponentProps.label, i18n)
        : undefined

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      const path =
        'fieldComponentProps' in field &&
        'path' in field.fieldComponentProps &&
        field.fieldComponentProps.path !== undefined
          ? field.fieldComponentProps.path
          : undefined

      const name = path ? path.replaceAll('.', '-') : 'name' in field ? field.name : undefined

      acc.push({ ...field, name, labelWithPrefix })
      return acc
    } else if (
      field.type === 'tabs' &&
      'tabs' in field.fieldComponentProps &&
      Array.isArray(field.fieldComponentProps.tabs)
    ) {
      return [
        ...acc,
        ...field.fieldComponentProps.tabs.reduce((tabAcc, tab) => {
          return [
            ...tabAcc,
            ...('name' in tab
              ? [{ ...tab }]
              : flattenFieldMap({
                  fieldMap: tab.fieldMap,
                  i18n,
                  keepPresentationalFields,
                  labelPrefix,
                })),
          ]
        }, []),
      ]
    }

    return acc
  }, [])
}

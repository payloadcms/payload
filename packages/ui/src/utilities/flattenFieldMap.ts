import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'

type FlattenFieldMapArgs = {
  fields: ClientField[]
  i18n: I18nClient
  keepPresentationalFields?: boolean
  labelPrefix?: string
}

type FlattenFieldMapResult = ({
  labelWithPrefix?: string
} & ClientField)[]

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
export const flattenFieldMap = ({
  fields,
  i18n,
  keepPresentationalFields,
  labelPrefix,
}: FlattenFieldMapArgs): FlattenFieldMapResult => {
  return fields.reduce((acc, field) => {
    if ('fields' in field && field.type !== 'array') {
      const translatedLabel = 'label' in field ? getTranslation(field.label, i18n) : undefined
      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      acc.push(
        ...flattenFieldMap({
          fields: field.fields,
          i18n,
          keepPresentationalFields,
          labelPrefix: labelWithPrefix,
        }),
      )
    } else if ('name' in field || (keepPresentationalFields && field._isPresentational)) {
      if (field.name === 'id' && labelPrefix !== undefined) {
        // ignore nested id fields
        return acc
      }

      const translatedLabel = field.label ? getTranslation(field.label, i18n) : undefined

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      const name = field._schemaPath
        ? field._schemaPath.replaceAll('.', '-')
        : 'name' in field
          ? field.name
          : undefined

      acc.push({ ...field, name, labelWithPrefix })
      return acc
    } else if (field.type === 'tabs' && 'tabs' in field && Array.isArray(field.tabs)) {
      return [
        ...acc,
        ...field.tabs.reduce((tabAcc, tab) => {
          return [
            ...tabAcc,
            ...('name' in tab
              ? [{ ...tab }]
              : flattenFieldMap({
                  fields: tab.fields,
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

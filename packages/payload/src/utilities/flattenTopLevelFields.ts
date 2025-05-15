// @ts-strict-ignore
import type { I18nClient } from '@payloadcms/translations'

import { getTranslation } from '@payloadcms/translations'

import type { ClientTab } from '../admin/fields/Tabs.js'
import type { ClientField } from '../fields/config/client.js'
import type {
  Field,
  FieldAffectingData,
  FieldAffectingDataClient,
  FieldPresentationalOnly,
  FieldPresentationalOnlyClient,
  Tab,
} from '../fields/config/types.js'

import { fieldAffectsData, fieldIsPresentationalOnly, tabHasName } from '../fields/config/types.js'

type FlattenedField<TField> = TField extends ClientField
  ? { accessor?: string; labelWithPrefix?: string } & (
      | FieldAffectingDataClient
      | FieldPresentationalOnlyClient
    )
  : { accessor?: string; labelWithPrefix?: string } & (FieldAffectingData | FieldPresentationalOnly)

type TabType<TField> = TField extends ClientField ? ClientTab : Tab

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
function flattenFields<TField extends ClientField | Field>(
  fields: TField[],
  options?:
    | {
        i18n?: I18nClient
        keepPresentationalFields?: boolean
        labelPrefix?: string
        pathPrefix?: string
      }
    | boolean,
): FlattenedField<TField>[] {
  const normalizedOptions =
    typeof options === 'boolean' ? { keepPresentationalFields: options } : (options ?? {})

  const { i18n, keepPresentationalFields, labelPrefix, pathPrefix } = normalizedOptions

  return fields.reduce<FlattenedField<TField>[]>((acc, field) => {
    if ('fields' in field && field.type !== 'array') {
      const translatedLabel =
        'label' in field && field.label && i18n ? getTranslation(field.label, i18n) : undefined

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? `${labelPrefix} > ${translatedLabel}`
          : labelPrefix
        : translatedLabel

      const nameWithPrefix =
        'name' in field && field.name
          ? pathPrefix
            ? `${pathPrefix}-${field.name}`
            : field.name
          : pathPrefix

      acc.push(
        ...flattenFields<TField>('fields' in field ? (field.fields as TField[]) : [], {
          i18n,
          keepPresentationalFields,
          labelPrefix: labelWithPrefix,
          pathPrefix: nameWithPrefix,
        }),
      )
    } else if (
      fieldAffectsData(field) ||
      (keepPresentationalFields && fieldIsPresentationalOnly(field))
    ) {
      // Ignore nested `id` fields
      if (field.name === 'id' && labelPrefix !== undefined) {
        return acc
      }

      const translatedLabel =
        'label' in field && field.label && i18n ? getTranslation(field.label, i18n) : undefined

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? `${labelPrefix} > ${translatedLabel}`
          : labelPrefix
        : undefined

      const name = 'name' in field ? field.name : undefined
      const accessor = pathPrefix && name ? `${pathPrefix}-${name}` : (name ?? '')

      acc.push({
        ...(field as FlattenedField<TField>),
        name,
        accessor,
        labelWithPrefix,
      })
    } else if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...acc,
        ...field.tabs.reduce<FlattenedField<TField>[]>((tabFields, tab: TabType<TField>) => {
          if (tabHasName(tab)) {
            return [
              ...tabFields,
              {
                ...tab,
                type: 'tab',
                labelPrefix,
              } as unknown as FlattenedField<TField>,
            ]
          } else {
            return [
              ...tabFields,
              ...flattenFields<TField>(tab.fields as TField[], {
                i18n,
                keepPresentationalFields,
                labelPrefix,
                pathPrefix,
              }),
            ]
          }
        }, []),
      ]
    }

    return acc
  }, [])
}

export default flattenFields

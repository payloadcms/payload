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

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsPresentationalOnly,
  tabHasName,
} from '../fields/config/types.js'

type FlattenedField<TField> = TField extends ClientField
  ? { accessor?: string; labelWithPrefix?: string } & (
      | FieldAffectingDataClient
      | FieldPresentationalOnlyClient
    )
  : { accessor?: string; labelWithPrefix?: string } & (FieldAffectingData | FieldPresentationalOnly)

type TabType<TField> = TField extends ClientField ? ClientTab : Tab

/**
 * Options to control how fields are flattened.
 */
type FlattenFieldsOptions = {
  /**
   * i18n context used for translating `label` values via `getTranslation`.
   */
  i18n?: I18nClient
  /**
   * If true, presentational-only fields (like UI fields) will be included
   * in the output. Otherwise, they will be skipped.
   * Default: false.
   */
  keepPresentationalFields?: boolean
  /**
   * A label prefix to prepend to translated labels when building `labelWithPrefix`.
   * Used recursively when flattening nested fields.
   */
  labelPrefix?: string
  /**
   * If true, nested fields inside `group` fields will be lifted to the top level
   * and given contextual `accessor` and `labelWithPrefix` values.
   * Default: false.
   */
  moveSubFieldsToTop?: boolean
  /**
   * A path prefix to prepend to field names when building the `accessor`.
   * Used recursively when flattening nested fields.
   */
  pathPrefix?: string
}

/**
 * Flattens a collection's fields into a single array of fields, optionally
 * extracting nested fields in group fields.
 *
 * @param fields - Array of fields to flatten
 * @param options - Options to control the flattening behavior
 */
function flattenFields<TField extends ClientField | Field>(
  fields: TField[],
  options?: boolean | FlattenFieldsOptions,
): FlattenedField<TField>[] {
  const normalizedOptions: FlattenFieldsOptions =
    typeof options === 'boolean' ? { keepPresentationalFields: options } : (options ?? {})

  const {
    i18n,
    keepPresentationalFields,
    labelPrefix,
    moveSubFieldsToTop = false,
    pathPrefix,
  } = normalizedOptions

  return fields.reduce<FlattenedField<TField>[]>((acc, field) => {
    if (fieldHasSubFields(field)) {
      if (field.type === 'group') {
        if (moveSubFieldsToTop && 'fields' in field) {
          const isNamedGroup = 'name' in field && typeof field.name === 'string' && !!field.name

          const translatedLabel =
            'label' in field && field.label && i18n
              ? getTranslation(field.label as string, i18n)
              : undefined

          const labelWithPrefix =
            isNamedGroup && labelPrefix && translatedLabel
              ? `${labelPrefix} > ${translatedLabel}`
              : (labelPrefix ?? translatedLabel)

          const nameWithPrefix =
            isNamedGroup && field.name
              ? pathPrefix
                ? `${pathPrefix}-${field.name as string}`
                : (field.name as string)
              : pathPrefix

          acc.push(
            ...flattenFields(field.fields as TField[], {
              i18n,
              keepPresentationalFields,
              labelPrefix: isNamedGroup ? labelWithPrefix : labelPrefix,
              moveSubFieldsToTop,
              pathPrefix: isNamedGroup ? nameWithPrefix : pathPrefix,
            }),
          )
        } else {
          // Just keep the group as-is
          acc.push(field as FlattenedField<TField>)
        }
      } else if (['collapsible', 'row'].includes(field.type)) {
        // Recurse into row and collapsible
        acc.push(...flattenFields(field.fields as TField[], options))
      } else {
        // Do not hoist fields from arrays & blocks
        acc.push(field as FlattenedField<TField>)
      }
    } else if (
      fieldAffectsData(field) ||
      (keepPresentationalFields && fieldIsPresentationalOnly(field))
    ) {
      // Ignore nested `id` fields when inside nested structure
      if (field.name === 'id' && labelPrefix !== undefined) {
        return acc
      }

      const translatedLabel =
        'label' in field && field.label && i18n ? getTranslation(field.label, i18n) : undefined

      const name = 'name' in field ? field.name : undefined

      const isHoistingFromGroup = pathPrefix !== undefined || labelPrefix !== undefined

      acc.push({
        ...(field as FlattenedField<TField>),
        ...(moveSubFieldsToTop &&
          isHoistingFromGroup && {
            accessor: pathPrefix && name ? `${pathPrefix}-${name}` : (name ?? ''),
            labelWithPrefix:
              labelPrefix && translatedLabel
                ? `${labelPrefix} > ${translatedLabel}`
                : (labelPrefix ?? translatedLabel),
          }),
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
                ...(moveSubFieldsToTop && { labelPrefix }),
              } as unknown as FlattenedField<TField>,
            ]
          } else {
            return [...tabFields, ...flattenFields<TField>(tab.fields as TField[], options)]
          }
        }, []),
      ]
    }

    return acc
  }, [])
}

export default flattenFields

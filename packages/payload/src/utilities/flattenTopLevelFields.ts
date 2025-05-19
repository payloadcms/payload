import type { I18nClient } from '@payloadcms/translations'
// @ts-strict-ignore
import type { JSX } from 'react'

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

type LabelType =
  | (() => JSX.Element)
  | ((args: { i18n: I18nClient; t: any }) => string)
  | JSX.Element
  | Record<string, string>
  | string

function isLabelType(value: unknown): value is LabelType {
  return (
    typeof value === 'string' ||
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null)
  )
}

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
   * If true, nested fields inside `group` fields will be lifted to the top level
   * and given contextual `accessor` and `labelWithPrefix` values.
   * Default: false.
   */
  extractFieldsToTopFromGroupFields?: boolean
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
    extractFieldsToTopFromGroupFields = false,
    i18n,
    keepPresentationalFields,
    labelPrefix,
    pathPrefix,
  } = normalizedOptions

  return fields.reduce<FlattenedField<TField>[]>((acc, field) => {
    if (fieldHasSubFields(field)) {
      if (field.type == 'group') {
        if (extractFieldsToTopFromGroupFields && 'fields' in field) {
          const translatedLabel =
            'label' in field && isLabelType(field.label) && i18n
              ? getTranslation(field.label, i18n)
              : undefined

          const labelWithPrefix =
            extractFieldsToTopFromGroupFields &&
            labelPrefix &&
            typeof translatedLabel === 'string' &&
            translatedLabel
              ? `${labelPrefix} > ${translatedLabel}`
              : (labelPrefix ?? (typeof translatedLabel === 'string' ? translatedLabel : undefined))

          const nameWithPrefix =
            'name' in field && field.name
              ? pathPrefix
                ? `${pathPrefix}-${field.name as string}`
                : (field.name as string)
              : pathPrefix

          acc.push(
            ...flattenFields(field.fields as TField[], {
              extractFieldsToTopFromGroupFields,
              i18n,
              keepPresentationalFields,
              labelPrefix: labelWithPrefix,
              pathPrefix: nameWithPrefix,
            }),
          )
        } else {
          // Don't recurse into group fields unless explicitly requested
          return acc
        }
      } else {
        // For rows, arrays, collapsible — recurse by default
        acc.push(...flattenFields(field.fields as TField[], options))
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

      acc.push({
        ...(field as FlattenedField<TField>),
        ...(extractFieldsToTopFromGroupFields && {
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
                ...(extractFieldsToTopFromGroupFields && { labelPrefix }),
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

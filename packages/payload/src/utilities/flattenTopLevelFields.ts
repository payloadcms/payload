import type { I18nClient } from '@ruya.sa/translations'

import { getTranslation } from '@ruya.sa/translations'

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
   * If true, nested fields inside `group` & `tabs` fields will be lifted to the top level
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
export function flattenTopLevelFields<TField extends ClientField | Field>(
  fields: TField[] = [],
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
    // If a group field has subfields and has a name, otherwise we catch it below along with collapsible and row fields
    if (field.type === 'group' && 'fields' in field) {
      if (moveSubFieldsToTop) {
        const isNamedGroup = 'name' in field && typeof field.name === 'string' && !!field.name
        const groupName = 'name' in field ? field.name : undefined

        const translatedLabel =
          'label' in field && field.label && i18n
            ? getTranslation(field.label as string, i18n)
            : undefined

        const labelWithPrefix = labelPrefix
          ? `${labelPrefix} > ${translatedLabel ?? groupName}`
          : (translatedLabel ?? groupName)

        const nameWithPrefix =
          'name' in field && field.name
            ? pathPrefix
              ? `${pathPrefix}.${field.name}`
              : field.name
            : pathPrefix

        acc.push(
          // Need to include the top-level group field when hoisting its subfields,
          // so that `buildColumnState` can detect and render a column if the group
          // has a custom admin Cell component defined in its configuration.
          // See: packages/ui/src/providers/TableColumns/buildColumnState/index.tsx
          field as FlattenedField<TField>,
          ...flattenTopLevelFields(field.fields as TField[], {
            i18n,
            keepPresentationalFields,
            labelPrefix: isNamedGroup ? labelWithPrefix : labelPrefix,
            moveSubFieldsToTop,
            pathPrefix: isNamedGroup ? nameWithPrefix : pathPrefix,
          }),
        )
      } else {
        if (fieldAffectsData(field)) {
          // Hoisting diabled - keep as top level field
          acc.push(field as FlattenedField<TField>)
        } else {
          acc.push(...flattenTopLevelFields(field.fields as TField[], options))
        }
      }
    } else if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...acc,
        ...field.tabs.reduce<FlattenedField<TField>[]>((tabFields, tab) => {
          if (tabHasName(tab)) {
            if (moveSubFieldsToTop) {
              const translatedLabel =
                'label' in tab && tab.label && i18n ? getTranslation(tab.label, i18n) : undefined

              const labelWithPrefixForTab = labelPrefix
                ? `${labelPrefix} > ${translatedLabel ?? tab.name}`
                : (translatedLabel ?? tab.name)

              const pathPrefixForTab = tab.name
                ? pathPrefix
                  ? `${pathPrefix}.${tab.name}`
                  : tab.name
                : pathPrefix

              return [
                ...tabFields,
                ...flattenTopLevelFields(tab.fields as TField[], {
                  i18n,
                  keepPresentationalFields,
                  labelPrefix: labelWithPrefixForTab,
                  moveSubFieldsToTop,
                  pathPrefix: pathPrefixForTab,
                }),
              ]
            } else {
              // Named tab, hoisting disabled: keep as top-level field
              return [
                ...tabFields,
                {
                  ...tab,
                  type: 'tab',
                } as unknown as FlattenedField<TField>,
              ]
            }
          } else {
            // Unnamed tab: always hoist its fields
            return [...tabFields, ...flattenTopLevelFields<TField>(tab.fields as TField[], options)]
          }
        }, []),
      ]
    } else if (fieldHasSubFields(field) && ['collapsible', 'row'].includes(field.type)) {
      // Recurse into row and collapsible
      acc.push(...flattenTopLevelFields(field.fields as TField[], options))
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
            accessor: pathPrefix && name ? `${pathPrefix}.${name}` : (name ?? ''),
            labelWithPrefix: labelPrefix
              ? `${labelPrefix} > ${translatedLabel ?? name}`
              : (translatedLabel ?? name),
          }),
      })
    }

    return acc
  }, [])
}

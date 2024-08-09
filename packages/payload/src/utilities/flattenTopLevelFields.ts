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
import { ClientTab } from '../admin/fields/Tabs.js'

type FlattenedField<T> = T extends ClientField
  ? FieldAffectingDataClient | FieldPresentationalOnlyClient
  : FieldAffectingData | FieldPresentationalOnly

type TabType<T> = T extends ClientField ? ClientTab : Tab

/**
 * Flattens a collection's fields into a single array of fields, as long
 * as the fields do not affect data.
 *
 * @param fields
 * @param keepPresentationalFields if true, will skip flattening fields that are presentational only
 */
function flattenFields<T extends ClientField | Field>(
  fields: T[],
  keepPresentationalFields?: boolean,
): FlattenedField<T>[] {
  return fields.reduce<FlattenedField<T>[]>((fieldsToUse, field) => {
    if (fieldAffectsData(field) || (keepPresentationalFields && fieldIsPresentationalOnly(field))) {
      return [...fieldsToUse, field as FlattenedField<T>]
    }

    if (fieldHasSubFields(field)) {
      return [...fieldsToUse, ...flattenFields(field.fields as T[], keepPresentationalFields)]
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce<FlattenedField<T>[]>((tabFields, tab: TabType<T>) => {
          if (tabHasName(tab)) {
            return [...tabFields, { ...tab, type: 'tab' } as unknown as FlattenedField<T>]
          } else {
            return [...tabFields, ...flattenFields(tab.fields as T[], keepPresentationalFields)]
          }
        }, []),
      ]
    }

    return fieldsToUse
  }, [])
}

export default flattenFields

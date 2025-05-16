// @ts-strict-ignore
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
  ? FieldAffectingDataClient | FieldPresentationalOnlyClient
  : FieldAffectingData | FieldPresentationalOnly

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
  keepPresentationalFields?: boolean,
): FlattenedField<TField>[] {
  return fields.reduce<FlattenedField<TField>[]>((acc, field) => {
    if (fieldAffectsData(field) || (keepPresentationalFields && fieldIsPresentationalOnly(field))) {
      acc.push(field as FlattenedField<TField>)
    } else if (fieldHasSubFields(field)) {
      acc.push(...flattenFields(field.fields as TField[], keepPresentationalFields))
    } else if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...acc,
        ...field.tabs.reduce<FlattenedField<TField>[]>((tabFields, tab: TabType<TField>) => {
          if (tabHasName(tab)) {
            return [...tabFields, { ...tab, type: 'tab' } as unknown as FlattenedField<TField>]
          } else {
            return [
              ...tabFields,
              ...flattenFields(tab.fields as TField[], keepPresentationalFields),
            ]
          }
        }, []),
      ]
    }

    return acc
  }, [])
}

export default flattenFields

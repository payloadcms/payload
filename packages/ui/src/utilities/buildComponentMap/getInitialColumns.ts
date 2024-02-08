import type { Field } from 'payload/types'

import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'
import { Column } from '../../elements/Table/types'

export const getInitialColumns = (
  fields: Field[],
  useAsTitle: string,
  defaultColumns: string[],
): Pick<Column, 'accessor' | 'active'>[] => {
  return fields.reduce((remaining, field, index) => {
    if (
      fieldAffectsData(field) &&
      (field.name === useAsTitle ||
        (defaultColumns && defaultColumns.includes(field.name)) ||
        index < 4)
    ) {
      return [...remaining, { accessor: field.name, active: true }]
    }

    if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
      return [...remaining, ...getInitialColumns(field.fields, useAsTitle, defaultColumns)]
    }

    if (field.type === 'tabs') {
      return [
        ...remaining,
        ...field.tabs.reduce(
          (tabFieldColumns, tab) => [
            ...tabFieldColumns,
            ...(tabHasName(tab)
              ? [tab.name]
              : getInitialColumns(tab.fields, useAsTitle, defaultColumns)),
          ],
          [],
        ),
      ]
    }

    return [
      ...remaining,
      {
        accessor: field.name,
        active: false,
      },
    ]
  }, [])
}

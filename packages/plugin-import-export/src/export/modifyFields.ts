import type { CollectionConfig, Field } from 'payload'

const fieldsToHide = ['slug', 'fields', 'where']

export function modifyFields(fields: Field[], collectionConfig: CollectionConfig): Field[] {
  const columns = collectionConfig.fields
    .map((field: Field) =>
      'name' in field
        ? {
            label: field.name,
            value: field.name,
          }
        : null,
    )
    .filter(Boolean)

  const fieldsToAdd = [
    {
      name: 'drafts',
      type: 'select',
      label: 'Drafts',
      options: [
        {
          label: 'True',
          value: 'true',
        },
        {
          label: 'False',
          value: 'false',
        },
      ],
    },
    {
      name: 'depth',
      type: 'number',
      defaultValue: 1,
      label: 'Depth',
      required: true,
    },
    {
      name: 'selectionToUse',
      type: 'radio',
      options: [
        {
          label: 'Use current selection',
          value: 'currentSelection',
        },
        {
          label: 'Use current filters',
          value: 'currentFilters',
        },
        {
          label: 'Use all documents',
          value: 'all',
        },
      ],
    },
    {
      name: 'columnsToExport',
      type: 'select',
      hasMany: true,
      label: 'Columns to Export',
      options: columns,
    },
  ]

  const flattenFields = (fields: Field[]): Field[] => {
    let result: Field[] = []

    fields.forEach((field) => {
      if ('fields' in field && Array.isArray(field.fields)) {
        result = result.concat(flattenFields(field.fields))
      } else {
        if ('name' in field && !fieldsToHide.includes(field.name)) {
          result.push(field)
        }
      }
    })

    return result
  }

  const modifiedFields = flattenFields(fields)

  const allFields = [...modifiedFields, ...fieldsToAdd] as Field[]

  const rows = [
    allFields[0],
    {
      type: 'row',
      fields: allFields.slice(1, 4).map((field) => ({
        ...field,
        admin: {
          width: '33%',
        },
      })),
    },
    {
      type: 'row',
      fields: allFields.slice(4, 7).map((field) => ({
        ...field,
        admin: {
          width: '33%',
        },
      })),
    },
  ]

  if (allFields.length > 7) {
    rows.push(...allFields.slice(7))
  }

  return [...rows] as Field[]
}

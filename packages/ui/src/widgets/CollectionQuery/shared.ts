export const collectionQuerySortableFieldTypes = new Set([
  'checkbox',
  'date',
  'email',
  'number',
  'radio',
  'select',
  'text',
  'textarea',
])

export function isCollectionQuerySortableField(field: { type: string }) {
  return collectionQuerySortableFieldTypes.has(field.type)
}

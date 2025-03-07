import type { RichTextAdapter } from 'payload'

export const traverseData: RichTextAdapter['traverseData'] = ({
  data,
  field,
  onFields,
  onRelationship,
}) => {
  if (
    field.admin?.elements?.includes('relationship') ||
    field.admin?.elements?.includes('upload') ||
    field.admin?.elements?.includes('link') ||
    !field?.admin?.elements
  ) {
    if (Array.isArray(data)) {
      for (const element of data) {
        if (element.type === 'relationship' && element?.value?.id && element.relationTo) {
          onRelationship({ id: element.value.id, collectionSlug: element.relationTo })
        }

        if (element.type === 'link' && element?.doc?.value && element?.doc?.relationTo) {
          onRelationship({ id: element.doc.value, collectionSlug: element.doc.relationTo })
        }

        if (Array.isArray(element.children)) {
          traverseData({ data: element.children, field, onFields, onRelationship })
        }
      }
    }
  }
}

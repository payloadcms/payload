import type { CollectionConfig } from '../../collections/config/types.js'
import type { Field, FieldAffectingData } from '../../fields/config/types.js'

export function findUseAsTitleField(collectionConfig: CollectionConfig): FieldAffectingData {
  const titleFieldName = collectionConfig.admin?.useAsTitle || 'id'
  const titleField = iterateFields({ fields: collectionConfig.fields, titleFieldName })

  return titleField
}

function iterateFields({
  fields,
  titleFieldName,
}: {
  fields: Field[]
  titleFieldName: string
}): FieldAffectingData {
  let titleField: FieldAffectingData | undefined

  for (const field of fields) {
    switch (field.type) {
      case 'text':
      case 'number':
      case 'textarea':
        if (field.name === titleFieldName) {
          titleField = field
        }
        break
      case 'row':
      case 'collapsible':
        titleField = iterateFields({ fields: field.fields, titleFieldName })
        break
      case 'group':
        if (!('name' in field)) {
          titleField = iterateFields({ fields: field.fields, titleFieldName })
        }
        break
      case 'tabs':
        for (const tab of field.tabs) {
          if (!('name' in tab)) {
            titleField = iterateFields({ fields: tab.fields, titleFieldName })
          }
        }
    }
  }

  if (!titleField) {
    throw new Error(
      `The Tree View title field "${titleFieldName}" was not found. It cannot be nested within named fields i.e. named groups, named tabs, etc.`,
    )
  }

  return titleField
}

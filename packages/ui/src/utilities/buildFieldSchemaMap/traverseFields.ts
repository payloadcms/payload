import { Field, tabHasName } from 'payload/types'
import { FieldSchemaMap } from './types'

type Args = {
  fields: Field[]
  schemaMap: FieldSchemaMap
  schemaPath: string
}

export const traverseFields = ({ fields, schemaMap, schemaPath }: Args) => {
  fields.map((field) => {
    switch (field.type) {
      case 'group':
      case 'array':
        traverseFields({
          fields: field.fields,
          schemaMap,
          schemaPath: `${schemaPath}.${field.name}`,
        })
        break

      case 'collapsible':
      case 'row':
        traverseFields({
          fields: field.fields,
          schemaMap,
          schemaPath,
        })
        break

      case 'blocks':
        field.blocks.map((block) => {
          traverseFields({
            fields: block.fields,
            schemaMap,
            schemaPath: `${schemaPath}.${field.name}.${block.slug}`,
          })
        })
        break

      case 'tabs':
        field.tabs.map((tab) => {
          const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath
          traverseFields({
            fields: tab.fields,
            schemaMap,
            schemaPath: tabSchemaPath,
          })
        })
        break
    }
  })
}

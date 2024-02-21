import { Field, SanitizedConfig, tabHasName } from 'payload/types'
import { FieldSchemaMap } from './types'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  schemaMap: FieldSchemaMap
  schemaPath: string
}

export const traverseFields = ({ config, fields, schemaMap, schemaPath }: Args) => {
  fields.map((field) => {
    switch (field.type) {
      case 'group':
      case 'array':
        traverseFields({
          config,
          fields: field.fields,
          schemaMap,
          schemaPath: `${schemaPath}.${field.name}`,
        })
        break

      case 'collapsible':
      case 'row':
        traverseFields({
          config,
          fields: field.fields,
          schemaMap,
          schemaPath,
        })
        break

      case 'blocks':
        field.blocks.map((block) => {
          traverseFields({
            config,
            fields: block.fields,
            schemaMap,
            schemaPath: `${schemaPath}.${field.name}.${block.slug}`,
          })
        })
        break

      case 'richText':
        if (typeof field.editor.generateSchemaMap === 'function') {
          field.editor.generateSchemaMap({ schemaPath, config, schemaMap })
        }

        break

      case 'tabs':
        field.tabs.map((tab) => {
          const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath
          traverseFields({
            config,
            fields: tab.fields,
            schemaMap,
            schemaPath: tabSchemaPath,
          })
        })
        break
    }
  })
}

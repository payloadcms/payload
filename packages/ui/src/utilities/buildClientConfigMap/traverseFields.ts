import type { ClientConfig, ClientConfigMap, ClientField } from 'payload'

import { tabHasName } from 'payload/shared'
type Args = {
  clientConfig: ClientConfig
  fields: ClientField[]
  schemaMap: ClientConfigMap
  schemaPath: string
}

export const traverseFields = ({ clientConfig, fields, schemaMap, schemaPath }: Args) => {
  for (const field of fields) {
    switch (field.type) {
      case 'group':
      case 'array':
        schemaMap.set(`${schemaPath}.${field.name}`, field)

        traverseFields({
          clientConfig,
          fields: field.fields,
          schemaMap,
          schemaPath: `${schemaPath}.${field.name}`,
        })
        break

      case 'collapsible':
      case 'row':
        traverseFields({
          clientConfig,
          fields: field.fields,
          schemaMap,
          schemaPath,
        })
        break

      case 'blocks':
        field.blocks.map((block) => {
          const blockSchemaPath = `${schemaPath}.${field.name}.${block.slug}`

          schemaMap.set(blockSchemaPath, block)

          traverseFields({
            clientConfig,
            fields: block.fields,
            schemaMap,
            schemaPath: blockSchemaPath,
          })
        })
        break

      case 'tabs':
        field.tabs.map((tab) => {
          const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath

          if (tabHasName(tab)) {
            schemaMap.set(tabSchemaPath, tab)
          }

          traverseFields({
            clientConfig,
            fields: tab.fields,
            schemaMap,
            schemaPath: tabSchemaPath,
          })
        })
        break

      default:
        if ('name' in field) {
          schemaMap.set(`${schemaPath}.${field.name}`, field)
        }
    }
  }
}

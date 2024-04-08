import type { Field, SanitizedConfig } from 'payload/types'

import { tabHasName } from 'payload/types'

import type { FieldSchemaMap } from './types.js'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  schemaMap: FieldSchemaMap
  schemaPath: string
  validRelationships: string[]
}

export const traverseFields = async ({
  config,
  fields,
  schemaMap,
  schemaPath,
  validRelationships,
}: Args): Promise<void> => {
  await Promise.all(
    fields.map(async (field) => {
      switch (field.type) {
        case 'group':
        case 'array':
          schemaMap.set(`${schemaPath}.${field.name}`, field.fields)

          await traverseFields({
            config,
            fields: field.fields,
            schemaMap,
            schemaPath: `${schemaPath}.${field.name}`,
            validRelationships,
          })
          break

        case 'collapsible':
        case 'row':
          await traverseFields({
            config,
            fields: field.fields,
            schemaMap,
            schemaPath,
            validRelationships,
          })
          break

        case 'blocks':
          await Promise.all(
            field.blocks.map(async (block) => {
              const blockSchemaPath = `${schemaPath}.${field.name}.${block.slug}`

              schemaMap.set(blockSchemaPath, block.fields)

              await traverseFields({
                config,
                fields: block.fields,
                schemaMap,
                schemaPath: blockSchemaPath,
                validRelationships,
              })
            }),
          )
          break

        case 'richText':
          if (typeof field.editor.generateSchemaMap === 'function') {
            await field.editor.generateSchemaMap({
              config,
              schemaMap,
              schemaPath: `${schemaPath}.${field.name}`,
            })
          }

          break

        case 'tabs':
          await Promise.all(
            field.tabs.map(async (tab) => {
              const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath

              if (tabHasName(tab)) {
                schemaMap.set(tabSchemaPath, tab.fields)
              }

              await traverseFields({
                config,
                fields: tab.fields,
                schemaMap,
                schemaPath: tabSchemaPath,
                validRelationships,
              })
            }),
          )
          break
      }
    }),
  )
}

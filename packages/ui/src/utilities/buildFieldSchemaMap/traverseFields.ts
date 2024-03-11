import type { Field, SanitizedConfig } from 'payload/types'

import { sanitizeFields } from 'payload/config'
import { tabHasName } from 'payload/types'

import type { FieldSchemaMap } from './types.js'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  schemaMap: FieldSchemaMap
  schemaPath: string
  validRelationships: string[]
}

export const traverseFields = ({
  config,
  fields,
  schemaMap,
  schemaPath,
  validRelationships,
}: Args) => {
  fields.map((field) => {
    let fieldsToSet
    switch (field.type) {
      case 'group':
      case 'array':
        fieldsToSet = sanitizeFields({
          config,
          fields: field.fields,
          validRelationships,
        })
        schemaMap.set(`${schemaPath}.${field.name}`, fieldsToSet)

        traverseFields({
          config,
          fields: field.fields,
          schemaMap,
          schemaPath: `${schemaPath}.${field.name}`,
          validRelationships,
        })
        break

      case 'collapsible':
      case 'row':
        traverseFields({
          config,
          fields: field.fields,
          schemaMap,
          schemaPath,
          validRelationships,
        })
        break

      case 'blocks':
        field.blocks.map((block) => {
          const blockSchemaPath = `${schemaPath}.${field.name}.${block.slug}`
          fieldsToSet = sanitizeFields({
            config,
            fields: [...block.fields, { name: 'blockName', type: 'text' }],
            validRelationships,
          })
          schemaMap.set(blockSchemaPath, fieldsToSet)

          traverseFields({
            config,
            fields: block.fields,
            schemaMap,
            schemaPath: blockSchemaPath,
            validRelationships,
          })
        })
        break

      case 'richText':
        if (typeof field.editor.generateSchemaMap === 'function') {
          field.editor.generateSchemaMap({
            config,
            schemaMap,
            schemaPath: `${schemaPath}.${field.name}`,
          })
        }

        break

      case 'tabs':
        field.tabs.map((tab) => {
          const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath

          if (tabHasName(tab)) {
            fieldsToSet = sanitizeFields({
              config,
              fields: tab.fields,
              validRelationships,
            })
            schemaMap.set(tabSchemaPath, fieldsToSet)
          }

          traverseFields({
            config,
            fields: tab.fields,
            schemaMap,
            schemaPath: tabSchemaPath,
            validRelationships,
          })
        })
        break
    }
  })
}

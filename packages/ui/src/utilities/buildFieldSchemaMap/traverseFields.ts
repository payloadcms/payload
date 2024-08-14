import type { I18n } from '@payloadcms/translations'
import type { Field, SanitizedConfig } from 'payload'

import { MissingEditorProp } from 'payload'
import { tabHasName } from 'payload/shared'

import type { FieldSchemaMap } from './types.js'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  i18n: I18n<any, any>
  schemaMap: FieldSchemaMap
  schemaPath: string
}

export const traverseFields = ({ config, fields, i18n, schemaMap, schemaPath }: Args) => {
  for (const field of fields) {
    switch (field.type) {
      case 'group':
      case 'array':
        schemaMap.set(`${schemaPath}.${field.name}`, field.fields)

        traverseFields({
          config,
          fields: field.fields,
          i18n,
          schemaMap,
          schemaPath: `${schemaPath}.${field.name}`,
        })
        break

      case 'collapsible':
      case 'row':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          schemaMap,
          schemaPath,
        })
        break

      case 'blocks':
        field.blocks.map((block) => {
          const blockSchemaPath = `${schemaPath}.${field.name}.${block.slug}`

          schemaMap.set(blockSchemaPath, block.fields)

          traverseFields({
            config,
            fields: block.fields,
            i18n,
            schemaMap,
            schemaPath: blockSchemaPath,
          })
        })
        break

      case 'richText':
        if (!field?.editor) {
          throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
        }
        if (typeof field.editor === 'function') {
          throw new Error('Attempted to access unsanitized rich text editor.')
        }

        if (typeof field.editor.generateSchemaMap === 'function') {
          field.editor.generateSchemaMap({
            config,
            field,
            i18n,
            schemaMap,
            schemaPath: `${schemaPath}.${field.name}`,
          })
        }

        break

      case 'tabs':
        field.tabs.map((tab) => {
          const tabSchemaPath = tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath

          if (tabHasName(tab)) {
            schemaMap.set(tabSchemaPath, tab.fields)
          }

          traverseFields({
            config,
            fields: tab.fields,
            i18n,
            schemaMap,
            schemaPath: tabSchemaPath,
          })
        })
        break
    }
  }
}

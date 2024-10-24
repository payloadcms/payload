import type { I18n } from '@payloadcms/translations'
import type { Field, FieldSchemaMap, SanitizedConfig } from 'payload'

import { MissingEditorProp } from 'payload'
import { generatePath, tabHasName } from 'payload/shared'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  i18n: I18n<any, any>
  schemaMap: FieldSchemaMap
  schemaPath: string
}

export const traverseFields = ({ config, fields, i18n, schemaMap, schemaPath }: Args) => {
  for (const [index, field] of fields.entries()) {
    const fieldKey = generatePath({
      name: 'name' in field ? field.name : undefined,
      fieldType: field.type,
      parentPath: schemaPath,
      schemaIndex: index,
    })

    schemaMap.set(fieldKey, field)

    switch (field.type) {
      case 'group':
      case 'array':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          schemaMap,
          schemaPath: fieldKey,
        })

        break

      case 'collapsible':
      case 'row':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          schemaMap,
          schemaPath: fieldKey,
        })

        break

      case 'blocks':
        field.blocks.map((block) => {
          const blockSchemaPath = `${fieldKey}.${block.slug}`

          schemaMap.set(blockSchemaPath, block)

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
            schemaPath: fieldKey,
          })
        }

        break

      case 'tabs':
        field.tabs.map((tab, tabIndex) => {
          const tabSchemaPath = generatePath({
            name: tabHasName(tab) ? tab.name : undefined,
            fieldType: field.type,
            parentPath: fieldKey,
            schemaIndex: tabIndex,
          })

          schemaMap.set(tabSchemaPath, tab)

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

import type { I18n } from '@payloadcms/translations'
import type { ClientConfig, Field, FieldSchemaMap, SanitizedConfig } from 'payload'

import { MissingEditorProp } from 'payload'
import { tabHasName } from 'payload/shared'

type Args = {
  clientConfig?: ClientConfig
  clientSchemaMap?: FieldSchemaMap
  config: SanitizedConfig
  fields: Field[]
  i18n: I18n<any, any>
  schemaMap: FieldSchemaMap
  schemaPath: string
}

export const traverseFields = ({
  clientConfig,
  clientSchemaMap,
  config,
  fields,
  i18n,
  schemaMap,
  schemaPath,
}: Args) => {
  for (const [index, field] of fields.entries()) {
    const clientField = clientConfig && 'fields' in clientConfig && clientConfig?.fields?.[index]

    switch (field.type) {
      case 'group':
      case 'array':
        schemaMap.set(`${schemaPath}.${field.name}`, field.fields)
        clientSchemaMap?.set(`${schemaPath}.${field.name}`, clientField.fields)

        traverseFields({
          clientConfig,
          clientSchemaMap,
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
          clientConfig,
          clientSchemaMap,
          config,
          fields: field.fields,
          i18n,
          schemaMap,
          schemaPath,
        })

        break

      case 'blocks':
        field.blocks.map((block, blockIndex) => {
          const blockSchemaPath = `${schemaPath}.${field.name}.${block.slug}`
          const clientBlock = clientField?.blocks?.[blockIndex]

          schemaMap.set(blockSchemaPath, block.fields)
          clientSchemaMap?.set(blockSchemaPath, clientBlock.fields)

          traverseFields({
            clientConfig,
            clientSchemaMap,
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
            clientConfig,
            clientSchemaMap,
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

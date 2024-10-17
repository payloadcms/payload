import type { I18n } from '@payloadcms/translations'
import type { ClientField, Field, FieldMap, SanitizedConfig } from 'payload'

import { MissingEditorProp } from 'payload'
import { tabHasName } from 'payload/shared'
type Args = {
  clientFields: ClientField[]
  config: SanitizedConfig
  fieldMap: FieldMap
  fields: Field[]
  i18n: I18n<any, any>
  schemaPath: string
}

export const traverseFields = ({
  clientFields,
  config,
  fieldMap,
  fields,
  i18n,
  schemaPath,
}: Args): void => {
  for (const [index, field] of fields.entries()) {
    const clientField = clientFields[index]

    switch (field.type) {
      case 'group':
      case 'array':
        fieldMap.set(`${schemaPath}.${field.name}`, { clientField, field })

        traverseFields({
          clientFields: ('fields' in clientField && clientField.fields) || [],
          config,
          fieldMap,
          fields: field.fields,
          i18n,
          schemaPath: `${schemaPath}.${field.name}`,
        })

        break

      case 'collapsible':
      case 'row':
        traverseFields({
          clientFields: ('fields' in clientField && clientField.fields) || [],
          config,
          fieldMap,
          fields: field.fields,
          i18n,
          schemaPath,
        })

        break

      case 'blocks':
        field.blocks.map((block, i) => {
          fieldMap.set(`${schemaPath}.${field.name}`, { clientField, field })

          traverseFields({
            clientFields: ('blocks' in clientField && clientField.blocks?.[i]?.fields) || [],
            config,
            fieldMap,
            fields: block.fields,
            i18n,
            schemaPath: `${schemaPath}.${field.name}.${block.slug}`,
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
          // field.editor.generateSchemaMap({
          //   config,
          //   field,
          //   i18n,
          //   fieldMap,
          //   schemaPath: `${schemaPath}.${field.name}`,
          // })
        }

        break

      case 'tabs':
        field.tabs.map((tab, i) => {
          traverseFields({
            clientFields: ('tabs' in clientField && clientField.tabs?.[i]?.fields) || [],
            config,
            fieldMap,
            fields: tab.fields,
            i18n,
            schemaPath: tabHasName(tab) ? `${schemaPath}.${tab.name}` : schemaPath,
          })
        })

        break

      default:
        if ('name' in field) {
          fieldMap.set(`${schemaPath}.${field.name}`, { clientField, field })
        }
    }
  }
}

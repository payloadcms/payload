import type { I18n } from '@payloadcms/translations'

import {
  type ClientConfig,
  type ClientField,
  type ClientFieldSchemaMap,
  createClientFields,
  type FieldSchemaMap,
  type Payload,
} from 'payload'
import { getFieldPaths, tabHasName } from 'payload/shared'

type Args = {
  clientSchemaMap: ClientFieldSchemaMap
  config: ClientConfig
  fields: ClientField[]
  i18n: I18n<any, any>
  parentIndexPath: string
  parentSchemaPath: string
  payload: Payload
  schemaMap: FieldSchemaMap
}

export const traverseFields = ({
  clientSchemaMap,
  config,
  fields,
  i18n,
  parentIndexPath,
  parentSchemaPath,
  payload,
  schemaMap,
}: Args) => {
  for (const [index, field] of fields.entries()) {
    if (!field) {
      continue
    }

    const { indexPath, schemaPath } = getFieldPaths({
      field,
      index,
      parentIndexPath: 'name' in field ? '' : parentIndexPath,
      parentPath: '',
      parentSchemaPath,
    })

    clientSchemaMap.set(schemaPath, field)

    switch (field.type) {
      case 'array':
      case 'group':
        traverseFields({
          clientSchemaMap,
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: '',
          parentSchemaPath: schemaPath,
          payload,
          schemaMap,
        })

        break

      case 'blocks':
        field.blocks.map((block) => {
          const blockSchemaPath = `${schemaPath}.${block.slug}`

          clientSchemaMap.set(blockSchemaPath, block)
          traverseFields({
            clientSchemaMap,
            config,
            fields: block.fields,
            i18n,
            parentIndexPath: '',
            parentSchemaPath: blockSchemaPath,
            payload,
            schemaMap,
          })
        })

        break
      case 'collapsible':
      case 'row':
        traverseFields({
          clientSchemaMap,
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: indexPath,
          parentSchemaPath,
          payload,
          schemaMap,
        })
        break

      case 'richText': {
        // richText sub-fields are not part of the ClientConfig or the Config.
        // They only exist in the field schema map.
        // Thus, we need to
        // 1. get them from the field schema map
        // 2. convert them to client fields
        // 3. add them to the client schema map

        // So these would basically be all fields that are not part of the client config already
        const richTextFieldSchemaMap: FieldSchemaMap = new Map()
        for (const [path, subField] of schemaMap.entries()) {
          if (path.startsWith(`${schemaPath}.`)) {
            richTextFieldSchemaMap.set(path, subField)
          }
        }

        // Now loop through them, convert each entry to a client field and add it to the client schema map
        for (const [path, subField] of richTextFieldSchemaMap.entries()) {
          const clientFields = createClientFields({
            defaultIDType: payload.config.db.defaultIDType,
            disableAddingID: true,
            fields: 'fields' in subField ? subField.fields : [subField],
            i18n,
            importMap: payload.importMap,
          })
          clientSchemaMap.set(path, {
            fields: clientFields,
          })
        }
        break
      }
      case 'tabs':
        field.tabs.map((tab, tabIndex) => {
          const { indexPath: tabIndexPath, schemaPath: tabSchemaPath } = getFieldPaths({
            field: {
              ...tab,
              type: 'tab',
            },
            index: tabIndex,
            parentIndexPath: indexPath,
            parentPath: '',
            parentSchemaPath,
          })

          clientSchemaMap.set(tabSchemaPath, tab)

          traverseFields({
            clientSchemaMap,
            config,
            fields: tab.fields,
            i18n,
            parentIndexPath: tabHasName(tab) ? '' : tabIndexPath,
            parentSchemaPath: tabHasName(tab) ? tabSchemaPath : parentSchemaPath,
            payload,
            schemaMap,
          })
        })

        break
    }
  }
}

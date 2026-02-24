import type { I18n } from '@payloadcms/translations'
import type {
  ClientConfig,
  ClientField,
  ClientFieldSchemaMap,
  Field,
  FieldSchemaMap,
  Payload,
  TabAsFieldClient,
} from 'payload'

import { createClientFields } from 'payload'
import { fieldAffectsData, getFieldPaths, tabHasName } from 'payload/shared'

type Args = {
  clientSchemaMap: ClientFieldSchemaMap
  config: ClientConfig
  fields: (ClientField | TabAsFieldClient)[]
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
    const { indexPath, schemaPath } = getFieldPaths({
      field,
      index,
      parentIndexPath,
      parentSchemaPath,
    })

    clientSchemaMap.set(schemaPath, field)

    switch (field.type) {
      case 'array': {
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
      }

      case 'blocks':
        ;(field.blockReferences ?? field.blocks).map((_block) => {
          const block =
            typeof _block === 'string'
              ? config.blocksMap
                ? config.blocksMap[_block]
                : config.blocks.find((block) => typeof block !== 'string' && block.slug === _block)
              : _block

          const blockSchemaPath = `${schemaPath}.${block.slug}`

          clientSchemaMap.set(blockSchemaPath, block)
          traverseFields({
            clientSchemaMap,
            config,
            fields: block.fields,
            i18n,
            parentIndexPath: '',
            parentSchemaPath: schemaPath + '.' + block.slug,
            payload,
            schemaMap,
          })
        })

        break

      case 'collapsible':
      case 'row': {
        traverseFields({
          clientSchemaMap,
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: indexPath,
          parentSchemaPath: schemaPath,
          payload,
          schemaMap,
        })
        break
      }

      case 'group': {
        if (fieldAffectsData(field)) {
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
        } else {
          traverseFields({
            clientSchemaMap,
            config,
            fields: field.fields,
            i18n,
            parentIndexPath: indexPath,
            parentSchemaPath: schemaPath,
            payload,
            schemaMap,
          })
        }
        break
      }

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
          // check if fields is the only key in the subField object
          const isFieldsOnly = Object.keys(subField).length === 1 && 'fields' in subField

          if (!isFieldsOnly && !('type' in subField)) {
            continue
          }

          const clientFields = createClientFields({
            defaultIDType: payload.config.db.defaultIDType,
            disableAddingID: true,
            fields: isFieldsOnly ? subField.fields : [subField as Field],
            i18n,
            importMap: payload.importMap,
          })

          clientSchemaMap.set(
            path,
            isFieldsOnly
              ? {
                  fields: clientFields,
                }
              : clientFields[0],
          )
        }
        break
      }

      case 'tab': {
        const isNamedTab = tabHasName(field)

        traverseFields({
          clientSchemaMap,
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: isNamedTab ? '' : indexPath,
          parentSchemaPath: schemaPath,
          payload,
          schemaMap,
        })

        break
      }

      case 'tabs': {
        traverseFields({
          clientSchemaMap,
          config,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          i18n,
          parentIndexPath: indexPath,
          parentSchemaPath: schemaPath,
          payload,
          schemaMap,
        })

        break
      }
    }
  }
}

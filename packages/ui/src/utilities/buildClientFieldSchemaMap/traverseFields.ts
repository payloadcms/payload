import type { I18n } from '@payloadcms/translations'
import type { ClientConfig, ClientField, ClientFieldSchemaMap } from 'payload'

import { getFieldPaths, tabHasName } from 'payload/shared'

type Args = {
  config: ClientConfig
  fields: ClientField[]
  i18n: I18n<any, any>
  parentIndexPath: string
  parentSchemaPath: string
  schemaMap: ClientFieldSchemaMap
}

export const traverseFields = ({
  config,
  fields,
  i18n,
  parentIndexPath,
  parentSchemaPath,
  schemaMap,
}: Args) => {
  for (const [index, field] of fields.entries()) {
    const { indexPath, schemaPath } = getFieldPaths({
      field,
      index,
      parentIndexPath: 'name' in field ? '' : parentIndexPath,
      parentPath: '',
      parentSchemaPath,
    })

    schemaMap.set(schemaPath, field)

    switch (field.type) {
      case 'array':
      case 'group':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: '',
          parentSchemaPath: schemaPath,
          schemaMap,
        })

        break

      case 'blocks':
        field.blocks.map((block) => {
          const blockSchemaPath = `${schemaPath}.${block.slug}`

          schemaMap.set(blockSchemaPath, block)
          traverseFields({
            config,
            fields: block.fields,
            i18n,
            parentIndexPath: '',
            parentSchemaPath: blockSchemaPath,
            schemaMap,
          })
        })

        break
      case 'collapsible':
      case 'row':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: indexPath,
          parentSchemaPath,
          schemaMap,
        })
        break

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

          schemaMap.set(tabSchemaPath, tab)

          traverseFields({
            config,
            fields: tab.fields,
            i18n,
            parentIndexPath: tabHasName(tab) ? '' : tabIndexPath,
            parentSchemaPath: tabHasName(tab) ? tabSchemaPath : parentSchemaPath,
            schemaMap,
          })
        })

        break
    }
  }
}

import type { I18n } from '@payloadcms/translations'
import type { Field, FieldSchemaMap, SanitizedConfig } from 'payload'

import { MissingEditorProp } from 'payload'
import { getFieldPaths, tabHasName } from 'payload/shared'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  i18n: I18n<any, any>
  parentIndexPath: string
  parentSchemaPath: string
  schemaMap: FieldSchemaMap
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
        ;(field.blockReferences ?? field.blocks).map((_block) => {
          // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
          const block =
            typeof _block === 'string' ? config.blocks.find((b) => b.slug === _block) : _block

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
            schemaPath,
          })
        }

        break

      case 'tabs':
        field.tabs.map((tab, tabIndex) => {
          const isNamedTab = tabHasName(tab)

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
            parentIndexPath: isNamedTab ? '' : tabIndexPath,
            parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
            schemaMap,
          })
        })

        break
    }
  }
}

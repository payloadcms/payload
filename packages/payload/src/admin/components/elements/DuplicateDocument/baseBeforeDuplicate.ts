import ObjectID from 'bson-objectid'

import { type BeforeDuplicate, type Field, tabHasName } from '../../../../exports/types'

/**
 * Creates new IDs for blocks / arrays items to avoid errors with relation databases.
 */
export const baseBeforeDuplicate = (args: Parameters<BeforeDuplicate>[0]) => {
  const {
    collection: { fields },
    data,
  } = args

  const traverseFields = (fields: Field[], data: unknown) => {
    if (typeof data === 'undefined' || data === null) return

    fields.forEach((field) => {
      switch (field.type) {
        case 'array':
          if (Array.isArray(data?.[field.name])) {
            data[field.name].forEach((row) => {
              if (!row) return
              row.id = new ObjectID().toHexString()
              traverseFields(field.fields, row)
            })
          }
          break
        case 'blocks': {
          if (Array.isArray(data?.[field.name])) {
            data[field.name].forEach((row) => {
              if (!row) return
              const configBlock = field.blocks.find((block) => block.slug === row.blockType)
              if (!configBlock) return
              row.id = new ObjectID().toHexString()
              traverseFields(configBlock.fields, row)
            })
          }
          break
        }
        case 'row':
        case 'collapsible':
          traverseFields(field.fields, data)
          break
        case 'tabs':
          field.tabs.forEach((tab) => {
            if (!tabHasName(tab)) {
              traverseFields(tab.fields, data)
              return
            }

            if (data && data[tab.name]) {
              traverseFields(tab.fields, data[tab.name])
            }
          })
          break
        case 'group':
          if (data && data[field.name]) {
            traverseFields(field.fields, data[field.name])
          }
          break
        default:
          break
      }
    })
  }

  traverseFields(fields, data)

  return data
}

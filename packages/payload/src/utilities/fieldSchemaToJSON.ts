import type { ClientField } from '../fields/config/client.js'
import type { FieldTypes } from '../fields/config/types.js'

export type FieldSchemaJSON = {
  blocks?: FieldSchemaJSON // TODO: conditionally add based on `type`
  fields?: FieldSchemaJSON // TODO: conditionally add based on `type`
  hasMany?: boolean // TODO: conditionally add based on `type`
  name: string
  relationTo?: string // TODO: conditionally add based on `type`
  slug?: string // TODO: conditionally add based on `type`
  type: FieldTypes
}[]

export const fieldSchemaToJSON = (fields: ClientField[]): FieldSchemaJSON => {
  return fields.reduce((acc, field) => {
    let result = acc

    switch (field.type) {
      case 'group':
        acc.push({
          name: field.name,
          type: field.type,
          fields: fieldSchemaToJSON(field.fields),
        })

        break

      case 'array':
        acc.push({
          name: field.name,
          type: field.type,
          fields: fieldSchemaToJSON([
            ...field.fields,
            {
              name: 'id',
              type: 'text',
            },
          ]),
        })

        break

      case 'blocks':
        acc.push({
          name: field.name,
          type: field.type,
          blocks: field.blocks.reduce((acc, block) => {
            acc[block.slug] = {
              fields: fieldSchemaToJSON([
                ...block.fields,
                {
                  name: 'id',
                  type: 'text',
                },
              ]),
            }

            return acc
          }, {}),
        })

        break

      case 'row':
      case 'collapsible':
        result = result.concat(fieldSchemaToJSON(field.fields))
        break

      case 'tabs': {
        let tabFields = []

        field.tabs.forEach((tab) => {
          if ('name' in tab) {
            tabFields.push({
              name: tab.name,
              type: field.type,
              fields: fieldSchemaToJSON(tab.fields),
            })
            return
          }

          tabFields = tabFields.concat(fieldSchemaToJSON(tab.fields))
        })

        result = result.concat(tabFields)

        break
      }

      case 'relationship':
      case 'upload':
        acc.push({
          name: field.name,
          type: field.type,
          hasMany: 'hasMany' in field ? Boolean(field.hasMany) : false, // TODO: type this
          relationTo: field.relationTo,
        })

        break

      default:
        if ('name' in field) {
          acc.push({
            name: field.name,
            type: field.type,
          })
        }
    }

    return result
  }, [])
}

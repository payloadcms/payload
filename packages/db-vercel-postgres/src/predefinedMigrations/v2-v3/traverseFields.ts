import type { TransactionPg } from '@payloadcms/drizzle/types'
import type { FlattenField, Payload } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { VercelPostgresAdapter } from '../../types.js'
import type { PathsToQuery } from './types.js'

type Args = {
  adapter: VercelPostgresAdapter
  collectionSlug?: string
  columnPrefix: string
  db: TransactionPg
  disableNotNull: boolean
  fields: FlattenField[]
  globalSlug?: string
  isVersions: boolean
  newTableName: string
  parentTableName: string
  path: string
  pathsToQuery: PathsToQuery
  payload: Payload
  rootTableName: string
}

export const traverseFields = (args: Args) => {
  args.fields.forEach((field) => {
    switch (field.type) {
      case 'array': {
        const newTableName = args.adapter.tableNameMap.get(
          `${args.newTableName}_${toSnakeCase(field.name)}`,
        )

        return traverseFields({
          ...args,
          columnPrefix: '',
          fields: field.flattenFields,
          newTableName,
          parentTableName: newTableName,
          path: `${args.path ? `${args.path}.` : ''}${field.name}.%`,
        })
      }

      case 'blocks': {
        return field.blocks.forEach((block) => {
          const newTableName = args.adapter.tableNameMap.get(
            `${args.rootTableName}_blocks_${toSnakeCase(block.slug)}`,
          )

          traverseFields({
            ...args,
            columnPrefix: '',
            fields: block.flattenFields,
            newTableName,
            parentTableName: newTableName,
            path: `${args.path ? `${args.path}.` : ''}${field.name}.%`,
          })
        })
      }

      case 'group':
      case 'tab': {
        let newTableName = `${args.newTableName}_${toSnakeCase(field.name)}`

        if (field.localized && args.payload.config.localization) {
          newTableName += args.adapter.localesSuffix
        }

        return traverseFields({
          ...args,
          columnPrefix: `${args.columnPrefix}${toSnakeCase(field.name)}_`,
          fields: field.flattenFields,
          newTableName,
          path: `${args.path ? `${args.path}.` : ''}${field.name}`,
        })
      }

      case 'relationship':
      case 'upload': {
        if (typeof field.relationTo === 'string') {
          if (field.type === 'upload' || !field.hasMany) {
            args.pathsToQuery.add(`${args.path ? `${args.path}.` : ''}${field.name}`)
          }
        }

        return null
      }
    }
  })
}

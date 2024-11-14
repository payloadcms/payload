import type { TransactionPg } from '@payloadcms/drizzle/types'
import type { Field, Payload } from 'payload'

import { tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { VercelPostgresAdapter } from '../../types.js'
import type { PathsToQuery } from './types.js'

type Args = {
  adapter: VercelPostgresAdapter
  collectionSlug?: string
  columnPrefix: string
  db: TransactionPg
  disableNotNull: boolean
  fields: Field[]
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
          fields: field.fields,
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
            fields: block.fields,
            newTableName,
            parentTableName: newTableName,
            path: `${args.path ? `${args.path}.` : ''}${field.name}.%`,
          })
        })
      }

      case 'collapsible':
      case 'row': {
        return traverseFields({
          ...args,
          fields: field.fields,
        })
      }

      case 'group': {
        let newTableName = `${args.newTableName}_${toSnakeCase(field.name)}`

        if (field.localized && args.payload.config.localization) {
          newTableName += args.adapter.localesSuffix
        }

        return traverseFields({
          ...args,
          columnPrefix: `${args.columnPrefix}${toSnakeCase(field.name)}_`,
          fields: field.fields,
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
      case 'tabs': {
        return field.tabs.forEach((tab) => {
          if (tabHasName(tab)) {
            args.columnPrefix = `${args.columnPrefix}_${toSnakeCase(tab.name)}_`
            args.path = `${args.path ? `${args.path}.` : ''}${tab.name}`
            args.newTableName = `${args.newTableName}_${toSnakeCase(tab.name)}`

            if (tab.localized && args.payload.config.localization) {
              args.newTableName += args.adapter.localesSuffix
            }
          }

          traverseFields({
            ...args,
            fields: tab.fields,
          })
        })
      }
    }
  })
}

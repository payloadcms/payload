import type { Payload } from 'payload'

import { type Field, tabHasName } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { DrizzleTransaction, PostgresAdapter } from '../../types.js'
import type { ColumnToCreate, PathsToQuery } from './types.js'

type Args = {
  adapter: PostgresAdapter
  collectionSlug?: string
  columnPrefix: string
  columnsToCreate: ColumnToCreate[]
  db: DrizzleTransaction
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

const idTypeMap = {
  number: 'numeric',
  serial: 'integer',
  text: 'varchar',
  uuid: 'uuid',
} as const

export const traverseFields = (args: Args) => {
  args.fields.forEach((field) => {
    switch (field.type) {
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

      case 'row':
      case 'collapsible': {
        return traverseFields({
          ...args,
          fields: field.fields,
        })
      }

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

      case 'relationship':
      case 'upload': {
        if (typeof field.relationTo === 'string') {
          if (field.type === 'upload' || !field.hasMany) {
            const condition = field.admin && field.admin.condition
            const notNull = !args.disableNotNull && field.required && !condition

            let tableName = args.parentTableName

            if (field.localized && args.payload.config.localization) {
              tableName += args.adapter.localesSuffix
            }

            args.columnsToCreate.push({
              columnName: `${args.columnPrefix}${toSnakeCase(field.name)}_id`,
              columnType:
                idTypeMap[
                  args.payload.collections[field.relationTo].customIDType || args.adapter.idType
                ],
              notNull,
              tableName,
            })

            args.pathsToQuery.add(`${args.path ? `${args.path}.` : ''}${field.name}`)
          }
        }

        return null
      }
    }
  })
}

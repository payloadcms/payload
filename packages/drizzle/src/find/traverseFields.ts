import type { DBQueryConfig } from 'drizzle-orm'
import type { Field, JoinQuery } from 'payload'

import { fieldAffectsData, fieldIsVirtual, tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import { buildOrderBy } from '../queries/buildOrderBy.js'
import buildQuery from '../queries/buildQuery.js'

type TraverseFieldArgs = {
  _locales: Result
  adapter: DrizzleAdapter
  currentArgs: Result
  currentTableName: string
  depth?: number
  fields: Field[]
  joinQuery: JoinQuery
  joins?: BuildQueryJoinAliases
  locale?: string
  path: string
  tablePath: string
  topLevelArgs: Record<string, unknown>
  topLevelTableName: string
}

export const traverseFields = ({
  _locales,
  adapter,
  currentArgs,
  currentTableName,
  depth,
  fields,
  joinQuery = {},
  joins,
  locale,
  path,
  tablePath,
  topLevelArgs,
  topLevelTableName,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
    if (fieldIsVirtual(field)) {
      return
    }

    // handle simple relationship
    if (
      depth > 0 &&
      (field.type === 'upload' || field.type === 'relationship') &&
      !field.hasMany &&
      typeof field.relationTo === 'string'
    ) {
      if (field.localized) {
        _locales.with[`${path}${field.name}`] = true
      } else {
        currentArgs.with[`${path}${field.name}`] = true
      }
    }

    if (field.type === 'collapsible' || field.type === 'row') {
      traverseFields({
        _locales,
        adapter,
        currentArgs,
        currentTableName,
        depth,
        fields: field.fields,
        joinQuery,
        joins,
        path,
        tablePath,
        topLevelArgs,
        topLevelTableName,
      })

      return
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        const tabPath = tabHasName(tab) ? `${path}${tab.name}_` : path
        const tabTablePath = tabHasName(tab) ? `${tablePath}${toSnakeCase(tab.name)}_` : tablePath

        traverseFields({
          _locales,
          adapter,
          currentArgs,
          currentTableName,
          depth,
          fields: tab.fields,
          joinQuery,
          joins,
          path: tabPath,
          tablePath: tabTablePath,
          topLevelArgs,
          topLevelTableName,
        })
      })

      return
    }

    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array': {
          const withArray: Result = {
            columns: {
              _parentID: false,
            },
            orderBy: ({ _order }, { asc }) => [asc(_order)],
            with: {},
          }

          const arrayTableName = adapter.tableNameMap.get(
            `${currentTableName}_${tablePath}${toSnakeCase(field.name)}`,
          )

          const arrayTableNameWithLocales = `${arrayTableName}${adapter.localesSuffix}`

          if (adapter.tables[arrayTableNameWithLocales]) {
            withArray.with._locales = {
              columns: {
                id: false,
                _parentID: false,
              },
              with: {},
            }
          }
          currentArgs.with[`${path}${field.name}`] = withArray

          traverseFields({
            _locales: withArray.with._locales,
            adapter,
            currentArgs: withArray,
            currentTableName: arrayTableName,
            depth,
            fields: field.fields,
            joinQuery,
            path: '',
            tablePath: '',
            topLevelArgs,
            topLevelTableName,
          })

          break
        }

        case 'select': {
          if (field.hasMany) {
            const withSelect: Result = {
              columns: {
                id: false,
                order: false,
                parent: false,
              },
              orderBy: ({ order }, { asc }) => [asc(order)],
            }

            currentArgs.with[`${path}${field.name}`] = withSelect
          }

          break
        }

        case 'blocks':
          field.blocks.forEach((block) => {
            const blockKey = `_blocks_${block.slug}`

            if (!topLevelArgs[blockKey]) {
              const withBlock: Result = {
                columns: {
                  _parentID: false,
                },
                orderBy: ({ _order }, { asc }) => [asc(_order)],
                with: {},
              }

              const tableName = adapter.tableNameMap.get(
                `${topLevelTableName}_blocks_${toSnakeCase(block.slug)}`,
              )

              if (adapter.tables[`${tableName}${adapter.localesSuffix}`]) {
                withBlock.with._locales = {
                  with: {},
                }
              }
              topLevelArgs.with[blockKey] = withBlock

              traverseFields({
                _locales: withBlock.with._locales,
                adapter,
                currentArgs: withBlock,
                currentTableName: tableName,
                depth,
                fields: block.fields,
                joinQuery,
                path: '',
                tablePath: '',
                topLevelArgs,
                topLevelTableName,
              })
            }
          })

          break

        case 'group': {
          traverseFields({
            _locales,
            adapter,
            currentArgs,
            currentTableName,
            depth,
            fields: field.fields,
            joinQuery,
            joins,
            path: `${path}${field.name}_`,
            tablePath: `${tablePath}${toSnakeCase(field.name)}_`,
            topLevelArgs,
            topLevelTableName,
          })

          break
        }

        case 'join': {
          // when `joinsQuery` is false, do not join
          if (joinQuery === false) {
            break
          }
          const {
            limit: limitArg = 10,
            sort,
            where,
          } = joinQuery[`${path.replaceAll('_', '.')}${field.name}`] || {}
          let limit = limitArg
          if (limit !== 0) {
            // get an additional document and slice it later to determine if there is a next page
            limit += 1
          }
          const fields = adapter.payload.collections[field.collection].config.fields
          const joinTableName = `${adapter.tableNameMap.get(toSnakeCase(field.collection))}${
            field.localized && adapter.payload.config.localization ? adapter.localesSuffix : ''
          }`
          const selectFields = {}

          const orderBy = buildOrderBy({
            adapter,
            fields,
            joins: [],
            locale,
            selectFields,
            sort,
            tableName: joinTableName,
          })
          const withJoin: DBQueryConfig<'many', true, any, any> = {
            columns: selectFields,
            orderBy: () => [orderBy.order(orderBy.column)],
          }
          if (limit) {
            withJoin.limit = limit
          }

          if (field.localized) {
            withJoin.columns._locale = true
            withJoin.columns._parentID = true
          } else {
            withJoin.columns.id = true
          }

          if (where) {
            const { where: joinWhere } = buildQuery({
              adapter,
              fields,
              joins,
              locale,
              sort,
              tableName: joinTableName,
              where,
            })
            withJoin.where = () => joinWhere
          }
          currentArgs.with[`${path.replaceAll('.', '_')}${field.name}`] = withJoin
          break
        }

        default: {
          break
        }
      }
    }
  })

  return topLevelArgs
}

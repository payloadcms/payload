import type { DBQueryConfig } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { Field, JoinQuery } from 'payload'

import { and, eq, sql } from 'drizzle-orm'
import { fieldAffectsData, fieldIsVirtual, tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases, ChainedMethods, DrizzleAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import buildQuery from '../queries/buildQuery.js'
import { chainMethods } from './chainMethods.js'

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
          const joinCollectionTableName = adapter.tableNameMap.get(toSnakeCase(field.collection))
          let joinTableName = `${adapter.tableNameMap.get(toSnakeCase(field.collection))}${
            field.localized && adapter.payload.config.localization ? adapter.localesSuffix : ''
          }`

          if (field.hasMany) {
            const db = adapter.drizzle as LibSQLDatabase
            if (field.localized) {
              joinTableName = adapter.tableNameMap.get(toSnakeCase(field.collection))
            }
            const joinTable = `${joinTableName}${adapter.relationshipsSuffix}`

            const joins: BuildQueryJoinAliases = [
              {
                type: 'innerJoin',
                condition: and(
                  eq(adapter.tables[joinTable].parent, adapter.tables[joinTableName].id),
                  eq(
                    sql.raw(`"${joinTable}"."${topLevelTableName}_id"`),
                    adapter.tables[currentTableName].id,
                  ),
                  eq(adapter.tables[joinTable].path, field.on),
                ),
                table: adapter.tables[joinTable],
              },
            ]

            const { orderBy, where: subQueryWhere } = buildQuery({
              adapter,
              fields,
              joins,
              locale,
              sort,
              tableName: joinCollectionTableName,
              where: {},
            })

            const chainedMethods: ChainedMethods = []

            joins.forEach(({ type, condition, table }) => {
              chainedMethods.push({
                args: [table, condition],
                method: type ?? 'leftJoin',
              })
            })

            const subQuery = chainMethods({
              methods: chainedMethods,
              query: db
                .select({
                  id: adapter.tables[joinTableName].id,
                  ...(field.localized && {
                    locale: adapter.tables[joinTable].locale,
                  }),
                })
                .from(adapter.tables[joinTableName])
                .where(subQueryWhere)
                .orderBy(orderBy.order(orderBy.column))
                .limit(limit),
            })

            const columnName = `${path.replaceAll('.', '_')}${field.name}`

            const jsonObjectSelect = field.localized
              ? sql.raw(`'_parentID', "id", '_locale', "locale"`)
              : sql.raw(`'id', "id"`)

            if (adapter.name === 'sqlite') {
              currentArgs.extras[columnName] = sql`
              COALESCE((
                SELECT json_group_array(json_object(${jsonObjectSelect}))
                FROM (
                  ${subQuery}
                ) AS ${sql.raw(`${columnName}_sub`)}
              ), '[]')
            `.as(columnName)
            } else {
              currentArgs.extras[columnName] = sql`
              COALESCE((
                SELECT json_agg(json_build_object(${jsonObjectSelect}))
                FROM (
                  ${subQuery}
                ) AS ${sql.raw(`${columnName}_sub`)}
              ), '[]'::json)
            `.as(columnName)
            }

            break
          }

          const selectFields = {}

          const withJoin: DBQueryConfig<'many', true, any, any> = {
            columns: selectFields,
          }
          if (limit) {
            withJoin.limit = limit
          }

          if (field.localized) {
            withJoin.columns._locale = true
            withJoin.columns._parentID = true
          } else {
            withJoin.columns.id = true
            withJoin.columns.parent = true
          }
          const { orderBy, where: joinWhere } = buildQuery({
            adapter,
            fields,
            joins,
            locale,
            sort,
            tableName: joinTableName,
            where,
          })
          if (joinWhere) {
            withJoin.where = () => joinWhere
          }
          withJoin.orderBy = orderBy.order(orderBy.column)
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

import type { Field, JoinQuery } from 'payload'

import { type DBQueryConfig, sql } from 'drizzle-orm'
import { APIError } from 'payload'
import { fieldAffectsData, tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import { buildOrderBy } from '../queries/buildOrderBy.js'

type TraverseFieldArgs = {
  _locales: Result
  adapter: DrizzleAdapter
  currentArgs: Result
  currentTableName: string
  depth?: number
  fields: Field[]
  joinQuery: JoinQuery
  locale?: string
  path: string
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
  locale,
  path,
  topLevelArgs,
  topLevelTableName,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
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
        path,
        topLevelArgs,
        topLevelTableName,
      })

      return
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        const tabPath = tabHasName(tab) ? `${path}${tab.name}_` : path

        traverseFields({
          _locales,
          adapter,
          currentArgs,
          currentTableName,
          depth,
          fields: tab.fields,
          joinQuery,
          path: tabPath,
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
            `${currentTableName}_${path}${toSnakeCase(field.name)}`,
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
                topLevelArgs,
                topLevelTableName,
              })
            }
          })

          break

        case 'group':
          traverseFields({
            _locales,
            adapter,
            currentArgs,
            currentTableName,
            depth,
            fields: field.fields,
            joinQuery,
            path: `${path}${field.name}_`,
            topLevelArgs,
            topLevelTableName,
          })

          break

        case 'join': {
          // when `joinsQuery` is false, do not join
          if (joinQuery !== false) {
            const { limit = 10, page = 1, sort } = joinQuery[`${path}${field.name}`] || {}
            if (page !== 1) {
              // we need a second query in read step to complete the join because drizzle doesn't support offset
              throw new APIError('Pagination is not supported for joins')
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
              columns: {
                ...selectFields,
              },
              limit,
              orderBy: () => [orderBy.order(orderBy.column)],
            }

            if (field.localized) {
              withJoin.columns._locale = true
              // Masquerade the parent_id as id, for population to work appropriately
              withJoin.extras = { id: sql`_parent_id`.as('id') }
            } else {
              withJoin.columns.id = true
            }

            currentArgs.with[toSnakeCase(`${path}${field.name}`)] = withJoin
          }
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

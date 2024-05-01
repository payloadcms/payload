/* eslint-disable no-param-reassign */
import type { Field, Select } from 'payload/types'

import { fieldAffectsData, tabHasName } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import { buildColumns } from './buildColumns.js'
import { buildFieldSelect } from './buildFieldSelect.js'

type TraverseFieldArgs = {
  _locales: Record<string, unknown>
  adapter: PostgresAdapter
  currentArgs: Result
  currentTableName: string
  depth?: number
  fields: Field[]
  localizedGroupOrTabParent?: boolean
  path: string
  select?: Select | boolean
  topLevelArgs: Result
  topLevelTableName: string
  withSelection: boolean
}

export const traverseFields = ({
  _locales,
  adapter,
  currentArgs,
  currentTableName,
  depth,
  fields,
  localizedGroupOrTabParent,
  path,
  select,
  topLevelArgs,
  topLevelTableName,
  withSelection,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
    if (field.type === 'collapsible' || field.type === 'row') {
      traverseFields({
        _locales,
        adapter,
        currentArgs,
        currentTableName,
        depth,
        fields: field.fields,
        localizedGroupOrTabParent,
        path,
        select,
        topLevelArgs,
        topLevelTableName,
        withSelection,
      })

      return
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        const hasName = tabHasName(tab)
        const tabPath = hasName ? `${path}${tab.name}_` : path

        traverseFields({
          _locales,
          adapter,
          currentArgs,
          currentTableName,
          depth,
          fields: tab.fields,
          localizedGroupOrTabParent: hasName ? tab.localized : false,
          path: tabPath,
          select: hasName ? buildFieldSelect({ field: tab, select }) : select,
          topLevelArgs,
          topLevelTableName,
          withSelection,
        })
      })

      return
    }

    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array': {
          const currentSelect = buildFieldSelect({ field, select })

          if (withSelection && !currentSelect) break

          const withArray: Result = {
            columns: buildColumns({
              exclude: ['_parentID'],
              include: ['id', '_order'],
              localized: field.localized,
              withSelection,
            }),
            orderBy: ({ _order }, { asc }) => [asc(_order)],
            with: {},
          }

          const arrayTableName = adapter.tableNameMap.get(
            `${currentTableName}_${path}${toSnakeCase(field.name)}`,
          )

          const arrayTableNameWithLocales = `${arrayTableName}${adapter.localesSuffix}`

          if (adapter.tables[arrayTableNameWithLocales])
            withArray.with._locales = {
              columns: buildColumns({
                exclude: ['id', '_parentID'],
                include: ['_locale'],
                withSelection,
              }),
            }

          currentArgs.with[`${path}${field.name}`] = withArray

          traverseFields({
            _locales,
            adapter,
            currentArgs: withArray,
            currentTableName: arrayTableName,
            depth,
            fields: field.fields,
            localizedGroupOrTabParent: false,
            path: '',
            select: buildFieldSelect({ field, select }),
            topLevelArgs,
            topLevelTableName,
            withSelection,
          })

          break
        }

        case 'select': {
          if (field.hasMany) {
            const currentSelect = buildFieldSelect({ field, select })

            if (withSelection && !currentSelect) break

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

        case 'blocks': {
          const currentSelect = buildFieldSelect({ field, select })
          if (withSelection && !currentSelect) break

          field.blocks.forEach((block) => {
            const blockSelect = buildFieldSelect({ field: block, select: currentSelect })

            const blockKey = `_blocks_${block.slug}`

            if (!topLevelArgs[blockKey]) {
              const withBlock: Result = {
                columns: buildColumns({
                  exclude: ['_parentID'],
                  include: ['id', '_path', '_order', 'blockName'],
                  localized: field.localized,
                  withSelection,
                }),
                orderBy: ({ _order }, { asc }) => [asc(_order)],
                with: {},
              }

              const tableName = adapter.tableNameMap.get(
                `${topLevelTableName}_blocks_${toSnakeCase(block.slug)}`,
              )

              if (adapter.tables[`${tableName}${adapter.localesSuffix}`]) {
                withBlock.with._locales = {
                  columns: buildColumns({
                    exclude: ['id', '_parentID'],
                    include: ['_locale'],
                    withSelection,
                  }),
                }
              }
              topLevelArgs.with[blockKey] = withBlock

              traverseFields({
                _locales,
                adapter,
                currentArgs: withBlock,
                currentTableName: tableName,
                depth,
                fields: block.fields,
                localizedGroupOrTabParent: false,
                path: '',
                select: blockSelect,
                topLevelArgs,
                topLevelTableName,
                withSelection,
              })
            }
          })

          break
        }

        case 'group':
          traverseFields({
            _locales,
            adapter,
            currentArgs,
            currentTableName,
            depth,
            fields: field.fields,
            localizedGroupOrTabParent: field.localized,
            path: `${path}${field.name}_`,
            select: buildFieldSelect({ field, select }),
            topLevelArgs,
            topLevelTableName,
            withSelection,
          })

          break

        case 'relationship':
        case 'upload': {
          if (typeof topLevelArgs.with._rels !== 'object') break

          const { relationTo } = field
          if (typeof relationTo === 'string')
            topLevelArgs.with._rels.columns[`${relationTo}_id`] = true
          else {
            for (const collection of relationTo) {
              topLevelArgs.with._rels.columns[`${collection}_id`] = true
            }
          }

          break
        }

        default: {
          if (!select) break
          let columns

          if (field.localized || localizedGroupOrTabParent) {
            if (typeof currentArgs.with._locales === 'object')
              columns = currentArgs.with._locales.columns
            else columns = _locales.columns
          } else {
            columns = currentArgs.columns
          }

          if (typeof select === 'boolean') columns[`${path}${field.name}`] = true
          if (select?.[field.name]) columns[`${path}${field.name}`] = true
          break
        }
      }
    }
  })

  return topLevelArgs
}

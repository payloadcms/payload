/* eslint-disable no-param-reassign */
import type { Field } from 'payload/types'

import { fieldAffectsData, tabHasName } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../types'
import type { Result } from './buildFindManyArgs'

type TraverseFieldArgs = {
  _locales: Record<string, unknown>
  adapter: PostgresAdapter
  currentArgs: Record<string, unknown>
  currentTableName: string
  depth?: number
  fields: Field[]
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
  path,
  tablePath,
  topLevelArgs,
  topLevelTableName,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
    if (field.type === 'collapsible' || field.type === 'row') {
      traverseFields({
        _locales,
        adapter,
        currentArgs,
        currentTableName,
        depth,
        tablePath,
        fields: field.fields,
        path,
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

          if (adapter.tables[arrayTableNameWithLocales]) withArray.with._locales = _locales
          currentArgs.with[`${path}${field.name}`] = withArray

          traverseFields({
            _locales,
            adapter,
            currentArgs: withArray,
            currentTableName: arrayTableName,
            depth,
            fields: field.fields,
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
                withBlock.with._locales = _locales
              }
              topLevelArgs.with[blockKey] = withBlock

              traverseFields({
                _locales,
                adapter,
                currentArgs: withBlock,
                currentTableName: tableName,
                depth,
                tablePath: '',
                fields: block.fields,
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
            tablePath: `${tablePath}${toSnakeCase(field.name)}_`,
            depth,
            fields: field.fields,
            path: `${path}${field.name}_`,
            topLevelArgs,
            topLevelTableName,
          })

          break

        default: {
          break
        }
      }
    }
  })

  return topLevelArgs
}

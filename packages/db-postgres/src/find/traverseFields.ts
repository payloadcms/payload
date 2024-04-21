/* eslint-disable no-param-reassign */
import type { Field, FieldAffectingData, NamedTab, Select } from 'payload/types'

import APIError from 'packages/payload/src/errors/APIError.js'
import { fieldAffectsData, tabHasName } from 'payload/types'

import type { PostgresAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import { getTableName } from '../schema/getTableName.js'
import { buildColumns } from './buildColumns.js'
import { buildFieldSelect } from './buildFieldSelect.js'

type TraverseFieldArgs = {
  _locales: Record<string, unknown>
  adapter: PostgresAdapter
  currentArgs: Result
  currentTableName: string
  depth?: number
  fields: Field[]
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
          const withArray: Result = {
            columns: buildColumns({
              exclude: ['_parentID'],
              include: ['id', '_path', '_order'],
              withSelection,
            }),
            orderBy: ({ _order }, { asc }) => [asc(_order)],
            with: {},
          }

          const arrayTableName = getTableName({
            adapter,
            config: field,
            parentTableName: currentTableName,
            prefix: `${currentTableName}_${path}`,
          })

          const arrayTableNameWithLocales = getTableName({
            adapter,
            config: field,
            locales: true,
            parentTableName: currentTableName,
            prefix: `${currentTableName}_${path}`,
          })

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
            select: buildFieldSelect({ field, select }),
            topLevelArgs,
            topLevelTableName,
            withSelection,
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
                columns: buildColumns({
                  exclude: ['_parentID'],
                  include: ['id', '_path', '_order'],
                  withSelection,
                }),
                orderBy: ({ _order }, { asc }) => [asc(_order)],
                with: {},
              }

              const tableName = getTableName({
                adapter,
                config: block,
                parentTableName: topLevelTableName,
                prefix: `${topLevelTableName}_blocks_`,
              })

              if (adapter.tables[`${tableName}${adapter.localesSuffix}`]) {
                withBlock.with._locales = _locales
              }
              topLevelArgs.with[blockKey] = withBlock

              const currentSelect = buildFieldSelect({ field, select })

              traverseFields({
                _locales,
                adapter,
                currentArgs: withBlock,
                currentTableName: tableName,
                depth,
                fields: block.fields,
                path: '',
                select:
                  currentSelect && typeof currentSelect === 'object'
                    ? currentSelect[block.slug]
                    : currentSelect,
                topLevelArgs,
                topLevelTableName,
                withSelection,
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

        default:
          if (!select) break
          currentArgs.columns[`${path}${field.name}`] =
            typeof select === 'boolean' ? true : !!select[field.name]
          break
      }
    }
  })

  return topLevelArgs
}

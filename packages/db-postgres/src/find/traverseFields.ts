/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'
import type { ArrayField, Block, Field } from 'payload/types'

import { fieldAffectsData } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

type TraverseFieldArgs = {
  _locales: Record<string, unknown>
  adapter: PostgresAdapter
  config: SanitizedConfig
  currentArgs: Record<string, unknown>
  currentTableName: string
  depth?: number
  fields: Field[]
  locatedArrays: { [path: string]: ArrayField }
  locatedBlocks: Block[]
  path: string
  topLevelArgs: Record<string, unknown>
  topLevelTableName: string
}

export const traverseFields = ({
  _locales,
  adapter,
  config,
  currentArgs,
  currentTableName,
  depth,
  fields,
  locatedArrays,
  locatedBlocks,
  path,
  topLevelArgs,
  topLevelTableName,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array': {
          const withArray: Result = {
            columns: {
              _order: false,
              _parentID: false,
            },
            orderBy: ({ _order }, { asc }) => [asc(_order)],
            with: {},
          }

          const arrayTableName = `${currentTableName}_${toSnakeCase(field.name)}`

          if (adapter.tables[`${arrayTableName}_locales`]) withArray.with._locales = _locales
          currentArgs.with[`${path}${field.name}`] = withArray

          traverseFields({
            _locales,
            adapter,
            config,
            currentArgs: withArray,
            currentTableName: arrayTableName,
            depth,
            fields: field.fields,
            locatedArrays,
            locatedBlocks,
            path: '',
            topLevelArgs,
            topLevelTableName,
          })

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

              if (adapter.tables[`${topLevelArgs}_${toSnakeCase(block.slug)}_locales`])
                withBlock.with._locales = _locales
              topLevelArgs.with[blockKey] = withBlock

              traverseFields({
                _locales,
                adapter,
                config,
                currentArgs: withBlock,
                currentTableName,
                depth,
                fields: block.fields,
                locatedArrays,
                locatedBlocks,
                path,
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
            config,
            currentArgs,
            currentTableName,
            depth,
            fields: field.fields,
            locatedArrays,
            locatedBlocks,
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

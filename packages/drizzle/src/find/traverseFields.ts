import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SQLiteSelect, SQLiteSelectBase } from 'drizzle-orm/sqlite-core'

import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm'
import {
  appendVersionToQueryKey,
  buildVersionCollectionFields,
  combineQueries,
  type FlattenedField,
  getQueryDraftsSort,
  type JoinQuery,
  type SelectMode,
  type SelectType,
  type Where,
} from 'payload'
import { fieldIsVirtual, fieldShouldBeLocalized } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import buildQuery from '../queries/buildQuery.js'
import { getTableAlias } from '../queries/getTableAlias.js'
import { operatorMap } from '../queries/operatorMap.js'
import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import { jsonAggBuildObject } from '../utilities/json.js'
import { rawConstraint } from '../utilities/rawConstraint.js'

const flattenAllWherePaths = (where: Where, paths: string[]) => {
  for (const k in where) {
    if (['AND', 'OR'].includes(k.toUpperCase())) {
      if (Array.isArray(where[k])) {
        for (const whereField of where[k]) {
          flattenAllWherePaths(whereField, paths)
        }
      }
    } else {
      // TODO: explore how to support arrays/relationship querying.
      paths.push(k.split('.').join('_'))
    }
  }
}

const buildSQLWhere = (where: Where, alias: string) => {
  for (const k in where) {
    if (['AND', 'OR'].includes(k.toUpperCase())) {
      if (Array.isArray(where[k])) {
        const op = 'AND' === k.toUpperCase() ? and : or
        const accumulated = []
        for (const whereField of where[k]) {
          accumulated.push(buildSQLWhere(whereField, alias))
        }
        return op(...accumulated)
      }
    } else {
      const payloadOperator = Object.keys(where[k])[0]
      const value = where[k][payloadOperator]

      return operatorMap[payloadOperator](sql.raw(`"${alias}"."${k.split('.').join('_')}"`), value)
    }
  }
}

type SQLSelect = SQLiteSelectBase<any, any, any, any>

type TraverseFieldArgs = {
  _locales: Result
  adapter: DrizzleAdapter
  collectionSlug?: string
  currentArgs: Result
  currentTableName: string
  depth?: number
  draftsEnabled?: boolean
  fields: FlattenedField[]
  joinQuery: JoinQuery
  joins?: BuildQueryJoinAliases
  locale?: string
  parentIsLocalized?: boolean
  path: string
  select?: SelectType
  selectAllOnCurrentLevel?: boolean
  selectMode?: SelectMode
  tablePath: string
  topLevelArgs: Record<string, unknown>
  topLevelTableName: string
  versions?: boolean
  withTabledFields: {
    numbers?: boolean
    rels?: boolean
    texts?: boolean
  }
}

export const traverseFields = ({
  _locales,
  adapter,
  collectionSlug,
  currentArgs,
  currentTableName,
  depth,
  draftsEnabled,
  fields,
  joinQuery = {},
  joins,
  locale,
  parentIsLocalized = false,
  path,
  select,
  selectAllOnCurrentLevel = false,
  selectMode,
  tablePath,
  topLevelArgs,
  topLevelTableName,
  versions,
  withTabledFields,
}: TraverseFieldArgs) => {
  fields.forEach((field) => {
    if (fieldIsVirtual(field)) {
      return
    }

    const isFieldLocalized = fieldShouldBeLocalized({
      field,
      parentIsLocalized,
    })

    // handle simple relationship
    if (
      depth > 0 &&
      (field.type === 'upload' || field.type === 'relationship') &&
      !field.hasMany &&
      typeof field.relationTo === 'string'
    ) {
      if (isFieldLocalized) {
        _locales.with[`${path}${field.name}`] = true
      } else {
        currentArgs.with[`${path}${field.name}`] = true
      }
    }

    switch (field.type) {
      case 'array': {
        const arraySelect = selectAllOnCurrentLevel ? true : select?.[field.name]

        if (select) {
          if (
            (selectMode === 'include' && typeof arraySelect === 'undefined') ||
            (selectMode === 'exclude' && arraySelect === false)
          ) {
            break
          }
        }

        const withArray: Result = {
          columns:
            typeof arraySelect === 'object'
              ? {
                  id: true,
                  _order: true,
                }
              : {
                  _parentID: false,
                },
          orderBy: ({ _order }, { asc }) => [asc(_order)],
          with: {},
        }

        const arrayTableName = adapter.tableNameMap.get(
          `${currentTableName}_${tablePath}${toSnakeCase(field.name)}`,
        )

        if (typeof arraySelect === 'object') {
          if (adapter.tables[arrayTableName]._locale) {
            withArray.columns._locale = true
          }

          if (adapter.tables[arrayTableName]._uuid) {
            withArray.columns._uuid = true
          }
        }

        const arrayTableNameWithLocales = `${arrayTableName}${adapter.localesSuffix}`

        if (adapter.tables[arrayTableNameWithLocales]) {
          withArray.with._locales = {
            columns:
              typeof arraySelect === 'object'
                ? {
                    _locale: true,
                  }
                : {
                    id: false,
                    _parentID: false,
                  },
            with: {},
          }
        }

        const relationName = field.dbName ? `_${arrayTableName}` : `${path}${field.name}`
        currentArgs.with[relationName] = withArray

        traverseFields({
          _locales: withArray.with._locales,
          adapter,
          currentArgs: withArray,
          currentTableName: arrayTableName,
          depth,
          draftsEnabled,
          fields: field.flattenedFields,
          joinQuery,
          locale,
          parentIsLocalized: parentIsLocalized || field.localized,
          path: '',
          select: typeof arraySelect === 'object' ? arraySelect : undefined,
          selectMode,
          tablePath: '',
          topLevelArgs,
          topLevelTableName,
          withTabledFields,
        })

        if (
          typeof arraySelect === 'object' &&
          withArray.with._locales &&
          Object.keys(withArray.with._locales).length === 1
        ) {
          delete withArray.with._locales
        }

        break
      }

      case 'blocks': {
        const blocksSelect = selectAllOnCurrentLevel ? true : select?.[field.name]

        if (select) {
          if (
            (selectMode === 'include' && !blocksSelect) ||
            (selectMode === 'exclude' && blocksSelect === false)
          ) {
            break
          }
        }

        ;(field.blockReferences ?? field.blocks).forEach((_block) => {
          const block = typeof _block === 'string' ? adapter.payload.blocks[_block] : _block
          const blockKey = `_blocks_${block.slug}`

          let blockSelect: boolean | SelectType | undefined

          let blockSelectMode = selectMode

          if (selectMode === 'include' && blocksSelect === true) {
            blockSelect = true
          }

          if (typeof blocksSelect === 'object') {
            if (typeof blocksSelect[block.slug] === 'object') {
              blockSelect = blocksSelect[block.slug]
            } else if (
              (selectMode === 'include' && typeof blocksSelect[block.slug] === 'undefined') ||
              (selectMode === 'exclude' && blocksSelect[block.slug] === false)
            ) {
              blockSelect = {}
              blockSelectMode = 'include'
            } else if (selectMode === 'include' && blocksSelect[block.slug] === true) {
              blockSelect = true
            }
          }

          if (!topLevelArgs[blockKey]) {
            const withBlock: Result = {
              columns:
                typeof blockSelect === 'object'
                  ? {
                      id: true,
                      _order: true,
                      _path: true,
                    }
                  : {
                      _parentID: false,
                    },
              orderBy: ({ _order }, { asc }) => [asc(_order)],
              with: {},
            }

            const tableName = adapter.tableNameMap.get(
              `${topLevelTableName}_blocks_${toSnakeCase(block.slug)}`,
            )

            if (typeof blockSelect === 'object') {
              if (adapter.tables[tableName]._locale) {
                withBlock.columns._locale = true
              }

              if (adapter.tables[tableName]._uuid) {
                withBlock.columns._uuid = true
              }
            }

            if (adapter.tables[`${tableName}${adapter.localesSuffix}`]) {
              withBlock.with._locales = {
                with: {},
              }

              if (typeof blockSelect === 'object') {
                withBlock.with._locales.columns = {
                  _locale: true,
                }
              }
            }
            topLevelArgs.with[blockKey] = withBlock

            traverseFields({
              _locales: withBlock.with._locales,
              adapter,
              currentArgs: withBlock,
              currentTableName: tableName,
              depth,
              draftsEnabled,
              fields: block.flattenedFields,
              joinQuery,
              locale,
              parentIsLocalized: parentIsLocalized || field.localized,
              path: '',
              select: typeof blockSelect === 'object' ? blockSelect : undefined,
              selectMode: blockSelectMode,
              tablePath: '',
              topLevelArgs,
              topLevelTableName,
              withTabledFields,
            })

            if (
              typeof blockSelect === 'object' &&
              withBlock.with._locales &&
              Object.keys(withBlock.with._locales.columns).length === 1
            ) {
              delete withBlock.with._locales
            }
          }
        })

        break
      }

      case 'group':
      case 'tab': {
        const fieldSelect = select?.[field.name]

        if (fieldSelect === false) {
          break
        }

        traverseFields({
          _locales,
          adapter,
          collectionSlug,
          currentArgs,
          currentTableName,
          depth,
          draftsEnabled,
          fields: field.flattenedFields,
          joinQuery,
          joins,
          locale,
          parentIsLocalized: parentIsLocalized || field.localized,
          path: `${path}${field.name}_`,
          select: typeof fieldSelect === 'object' ? fieldSelect : undefined,
          selectAllOnCurrentLevel:
            selectAllOnCurrentLevel ||
            fieldSelect === true ||
            (selectMode === 'exclude' && typeof fieldSelect === 'undefined'),
          selectMode,
          tablePath: `${tablePath}${toSnakeCase(field.name)}_`,
          topLevelArgs,
          topLevelTableName,
          versions,
          withTabledFields,
        })

        break
      }
      case 'join': {
        // when `joinsQuery` is false, do not join
        if (joinQuery === false) {
          break
        }

        if (
          (select && selectMode === 'include' && !select[field.name]) ||
          (selectMode === 'exclude' && select[field.name] === false)
        ) {
          break
        }

        const joinSchemaPath = `${path.replaceAll('_', '.')}${field.name}`

        if (joinQuery[joinSchemaPath] === false) {
          break
        }

        const {
          count: shouldCount = false,
          limit: limitArg = field.defaultLimit ?? 10,
          page,
          sort = field.defaultSort,
          where,
        } = joinQuery[joinSchemaPath] || {}
        let limit = limitArg

        if (limit !== 0) {
          // get an additional document and slice it later to determine if there is a next page
          limit += 1
        }

        const columnName = `${path.replaceAll('.', '_')}${field.name}`

        const db = adapter.drizzle as LibSQLDatabase

        if (Array.isArray(field.collection)) {
          let currentQuery: null | SQLSelect = null
          const onPath = field.on.split('.').join('_')

          if (Array.isArray(sort)) {
            throw new Error('Not implemented')
          }

          let sanitizedSort = sort

          if (!sanitizedSort) {
            if (
              field.collection.some((collection) =>
                adapter.payload.collections[collection].config.fields.some(
                  (f) => f.type === 'date' && f.name === 'createdAt',
                ),
              )
            ) {
              sanitizedSort = '-createdAt'
            } else {
              sanitizedSort = 'id'
            }
          }

          const sortOrder = sanitizedSort.startsWith('-') ? desc : asc
          sanitizedSort = sanitizedSort.replace('-', '')

          const sortPath = sanitizedSort.split('.').join('_')

          const wherePaths: string[] = []

          if (where) {
            flattenAllWherePaths(where, wherePaths)
          }

          for (const collection of field.collection) {
            const joinCollectionTableName = adapter.tableNameMap.get(toSnakeCase(collection))

            const table = adapter.tables[joinCollectionTableName]

            const sortColumn = table[sortPath]

            const selectFields = {
              id: adapter.tables[joinCollectionTableName].id,
              parent: sql`${adapter.tables[joinCollectionTableName][onPath]}`.as(onPath),
              relationTo: sql`${collection}`.as('relationTo'),
              sortPath: sql`${sortColumn ? sortColumn : null}`.as('sortPath'),
            }

            // Select for WHERE and Fallback NULL
            for (const path of wherePaths) {
              if (adapter.tables[joinCollectionTableName][path]) {
                selectFields[path] = sql`${adapter.tables[joinCollectionTableName][path]}`.as(path)
                // Allow to filter by collectionSlug
              } else if (path !== 'relationTo') {
                selectFields[path] = sql`null`.as(path)
              }
            }

            const query = db.select(selectFields).from(adapter.tables[joinCollectionTableName])
            if (currentQuery === null) {
              currentQuery = query as unknown as SQLSelect
            } else {
              currentQuery = currentQuery.unionAll(query) as SQLSelect
            }
          }

          const subQueryAlias = `${columnName}_subquery`

          let sqlWhere = eq(
            adapter.tables[currentTableName].id,
            sql.raw(`"${subQueryAlias}"."${onPath}"`),
          )

          if (where && Object.keys(where).length > 0) {
            sqlWhere = and(sqlWhere, buildSQLWhere(where, subQueryAlias))
          }

          if (shouldCount) {
            currentArgs.extras[`${columnName}_count`] = sql`${db
              .select({ count: count() })
              .from(sql`${currentQuery.as(subQueryAlias)}`)
              .where(sqlWhere)}`.as(`${columnName}_count`)
          }

          currentQuery = currentQuery.orderBy(sortOrder(sql`"sortPath"`)) as SQLSelect

          if (page && limit !== 0) {
            const offset = (page - 1) * limit
            if (offset > 0) {
              currentQuery = currentQuery.offset(offset) as SQLSelect
            }
          }

          if (limit) {
            currentQuery = currentQuery.limit(limit) as SQLSelect
          }

          currentArgs.extras[columnName] = sql`${db
            .select({
              id: jsonAggBuildObject(adapter, {
                id: sql.raw(`"${subQueryAlias}"."id"`),
                relationTo: sql.raw(`"${subQueryAlias}"."relationTo"`),
              }),
            })
            .from(sql`${currentQuery.as(subQueryAlias)}`)
            .where(sqlWhere)}`.as(columnName)
        } else {
          const useDrafts =
            (versions || draftsEnabled) &&
            Boolean(adapter.payload.collections[field.collection].config.versions.drafts)

          const fields = useDrafts
            ? buildVersionCollectionFields(
                adapter.payload.config,
                adapter.payload.collections[field.collection].config,
                true,
              )
            : adapter.payload.collections[field.collection].config.flattenedFields

          const joinCollectionTableName = adapter.tableNameMap.get(
            useDrafts
              ? `_${toSnakeCase(field.collection)}${adapter.versionsSuffix}`
              : toSnakeCase(field.collection),
          )

          const joins: BuildQueryJoinAliases = []

          const currentIDColumn = versions
            ? adapter.tables[currentTableName].parent
            : adapter.tables[currentTableName].id

          let joinQueryWhere: Where

          if (Array.isArray(field.targetField.relationTo)) {
            joinQueryWhere = {
              [field.on]: {
                equals: {
                  relationTo: collectionSlug,
                  value: rawConstraint(currentIDColumn),
                },
              },
            }
          } else {
            joinQueryWhere = {
              [field.on]: {
                equals: rawConstraint(currentIDColumn),
              },
            }
          }

          if (where && Object.keys(where).length) {
            joinQueryWhere = {
              and: [joinQueryWhere, where],
            }
          }

          if (useDrafts) {
            joinQueryWhere = combineQueries(appendVersionToQueryKey(joinQueryWhere), {
              latest: { equals: true },
            })
          }

          const columnName = `${path.replaceAll('.', '_')}${field.name}`

          const subQueryAlias = `${columnName}_alias`

          const { newAliasTable } = getTableAlias({
            adapter,
            tableName: joinCollectionTableName,
          })

          const {
            orderBy,
            selectFields,
            where: subQueryWhere,
          } = buildQuery({
            adapter,
            aliasTable: newAliasTable,
            fields,
            joins,
            locale,
            parentIsLocalized,
            selectLocale: true,
            sort: useDrafts
              ? getQueryDraftsSort({
                  collectionConfig: adapter.payload.collections[field.collection].config,
                  sort,
                })
              : sort,
            tableName: joinCollectionTableName,
            where: joinQueryWhere,
          })

          for (let key in selectFields) {
            const val = selectFields[key]

            if (val.table && getNameFromDrizzleTable(val.table) === joinCollectionTableName) {
              delete selectFields[key]
              key = key.split('.').pop()
              selectFields[key] = newAliasTable[key]
            }
          }

          if (useDrafts) {
            selectFields.parent = newAliasTable.parent
          }

          let query: SQLiteSelect = db
            .select(selectFields as any)
            .from(newAliasTable)
            .where(subQueryWhere)
            .orderBy(() => orderBy.map(({ column, order }) => order(column)))
            .$dynamic()

          joins.forEach(({ type, condition, table }) => {
            query = query[type ?? 'leftJoin'](table, condition)
          })

          if (page && limit !== 0) {
            const offset = (page - 1) * limit - 1
            if (offset > 0) {
              query = query.offset(offset)
            }
          }

          if (limit !== 0) {
            query = query.limit(limit)
          }

          const subQuery = query.as(subQueryAlias)

          if (shouldCount) {
            currentArgs.extras[`${columnName}_count`] = sql`${db
              .select({
                count: count(),
              })
              .from(
                sql`${db
                  .select(selectFields as any)
                  .from(newAliasTable)
                  .where(subQueryWhere)
                  .as(`${subQueryAlias}_count_subquery`)}`,
              )}`.as(`${subQueryAlias}_count`)
          }

          currentArgs.extras[columnName] = sql`${db
            .select({
              result: jsonAggBuildObject(adapter, {
                id: sql.raw(`"${subQueryAlias}".${useDrafts ? 'parent_id' : 'id'}`),
                ...(selectFields._locale && {
                  locale: sql.raw(`"${subQueryAlias}".${selectFields._locale.name}`),
                }),
              }),
            })
            .from(sql`${subQuery}`)}`.as(subQueryAlias)
        }

        break
      }

      case 'point': {
        if (adapter.name === 'sqlite') {
          break
        }

        const args = isFieldLocalized ? _locales : currentArgs
        if (!args.columns) {
          args.columns = {}
        }

        if (!args.extras) {
          args.extras = {}
        }

        const name = `${path}${field.name}`

        // Drizzle handles that poorly. See https://github.com/drizzle-team/drizzle-orm/issues/2526
        // Additionally, this way we format the column value straight in the database using ST_AsGeoJSON
        args.columns[name] = false

        let shouldSelect = false

        if (select || selectAllOnCurrentLevel) {
          if (
            selectAllOnCurrentLevel ||
            (selectMode === 'include' && select[field.name] === true) ||
            (selectMode === 'exclude' && typeof select[field.name] === 'undefined')
          ) {
            shouldSelect = true
          }
        } else {
          shouldSelect = true
        }

        if (shouldSelect) {
          args.extras[name] = sql.raw(`ST_AsGeoJSON(${toSnakeCase(name)})::jsonb`).as(name)
        }
        break
      }

      case 'select': {
        if (select && !selectAllOnCurrentLevel) {
          if (
            (selectMode === 'include' && !select[field.name]) ||
            (selectMode === 'exclude' && select[field.name] === false)
          ) {
            break
          }
        }

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
          break
        }

        if (select || selectAllOnCurrentLevel) {
          const fieldPath = `${path}${field.name}`

          if ((isFieldLocalized || parentIsLocalized) && _locales) {
            _locales.columns[fieldPath] = true
          } else if (adapter.tables[currentTableName]?.[fieldPath]) {
            currentArgs.columns[fieldPath] = true
          }
        }

        break
      }

      default: {
        if (!select && !selectAllOnCurrentLevel) {
          break
        }

        if (
          selectAllOnCurrentLevel ||
          (selectMode === 'include' && select[field.name] === true) ||
          (selectMode === 'exclude' && typeof select[field.name] === 'undefined')
        ) {
          const fieldPath = `${path}${field.name}`

          if ((isFieldLocalized || parentIsLocalized) && _locales) {
            _locales.columns[fieldPath] = true
          } else if (adapter.tables[currentTableName]?.[fieldPath]) {
            currentArgs.columns[fieldPath] = true
          }

          if (
            !withTabledFields.rels &&
            (field.type === 'relationship' || field.type === 'upload') &&
            (field.hasMany || Array.isArray(field.relationTo))
          ) {
            withTabledFields.rels = true
          }

          if (!withTabledFields.numbers && field.type === 'number' && field.hasMany) {
            withTabledFields.numbers = true
          }

          if (!withTabledFields.texts && field.type === 'text' && field.hasMany) {
            withTabledFields.texts = true
          }
        }

        break
      }
    }
  })

  return topLevelArgs
}

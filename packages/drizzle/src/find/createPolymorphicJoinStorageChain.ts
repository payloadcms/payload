import type { FlattenedBlock, FlattenedField } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'

import { resolveBlockTableName } from '../utilities/validateExistingBlockIsIdentical.js'

/**
 * One child table between a collection's main table and the table holding a leaf value. Array,
 * blocks and has-many select tables can hold many rows per parent; a `_locales` companion holds at
 * most one row per parent and locale, which is what makes negated operators sound.
 */
export type PolymorphicJoinStorageHop = {
  isLocalesTable: boolean
  /** Column key this table is filtered by locale on, when its rows are per-locale. */
  localeColumnKey?: string
  /** Column key correlating this table to its parent row's id. */
  parentColumnKey: string
  /** `_path` value a block table must be filtered by, so sibling blocks fields cannot match. */
  pathValue?: string
  tableName: string
}

export type PolymorphicJoinStorageChain = {
  hops: PolymorphicJoinStorageHop[]
  /** Column key on the last hop's table holding the value. */
  leafColumnKey: string
}

/** Field types stored as a single comparable column, so they can be a chain's leaf. */
const columnLeafFieldTypes = new Set<FlattenedField['type']>([
  'checkbox',
  'code',
  'date',
  'email',
  'number',
  'radio',
  'select',
  'text',
  'textarea',
])

/**
 * Resolves how a localized or separate-row path is stored for one target collection: the ordered
 * child tables to correlate through and the column holding the value. Tables are read from the
 * adapter rather than derived from the field config, so locale companions and localized array or
 * block rows are detected from the schema that was actually built.
 *
 * @returns The chain, or undefined when the path's storage cannot be correlated soundly.
 */
export const createPolymorphicJoinStorageChain = ({
  adapter,
  fields,
  schemaPath,
  tableName,
}: {
  adapter: DrizzleAdapter
  fields: FlattenedField[]
  schemaPath: string
  tableName: string
}): PolymorphicJoinStorageChain | undefined => {
  const segments = schemaPath.split('.')
  const hops: PolymorphicJoinStorageHop[] = []

  let currentFields = fields
  let currentTableName = tableName
  let columnPrefix = ''
  let tableNameSuffix = ''
  let constraintPath = ''

  while (segments.length > 0) {
    const segment = segments.shift()
    const field = currentFields.find((candidate) => candidate.name === segment)

    if (!field) {
      return undefined
    }

    const isLeaf = segments.length === 0

    if (!isLeaf) {
      if (field.type === 'group' || field.type === 'tab') {
        columnPrefix = `${columnPrefix}${field.name}_`
        tableNameSuffix = `${tableNameSuffix}${toSnakeCase(field.name)}_`
        constraintPath = `${constraintPath}${field.name}.`
        currentFields = field.flattenedFields
        continue
      }

      if (field.type === 'array') {
        const hop = resolveChildHop({
          adapter,
          tableNameKey: `${currentTableName}_${tableNameSuffix}${toSnakeCase(field.name)}`,
        })

        if (!hop) {
          return undefined
        }

        hops.push(hop)
        currentFields = field.flattenedFields
        currentTableName = hop.tableName
        columnPrefix = ''
        tableNameSuffix = ''
        constraintPath = `${constraintPath}${field.name}.%.`
        continue
      }

      if (field.type === 'blocks' && !adapter.blocksAsJSON) {
        const block = findBlock({ slug: segments[0], adapter, field })
        const mappedBlockTableName = block
          ? adapter.tableNameMap.get(`${currentTableName}_blocks_${toSnakeCase(block.slug)}`)
          : undefined

        if (!block || !mappedBlockTableName) {
          return undefined
        }

        // The block slug is part of the schema path but not of the storage path.
        segments.shift()

        const hop = resolveChildHop({
          adapter,
          pathValue: `${constraintPath}${field.name}`,
          tableName: resolveBlockTableName(block, mappedBlockTableName),
        })

        if (!hop || segments.length === 0) {
          return undefined
        }

        hops.push(hop)
        currentFields = block.flattenedFields
        currentTableName = hop.tableName
        columnPrefix = ''
        tableNameSuffix = ''
        constraintPath = `${constraintPath}${field.name}.%.`
        continue
      }

      return undefined
    }

    if (field.type === 'select' && field.hasMany) {
      // Has-many select value tables name their locale column `locale`, unlike the `_locale` of
      // array, block and locale companion tables.
      const hop = resolveChildHop({
        adapter,
        localeColumnKey: 'locale',
        tableNameKey: `${currentTableName}_${tableNameSuffix}${toSnakeCase(field.name)}`,
      })

      if (!hop || !adapter.tables[hop.tableName]?.['value']) {
        return undefined
      }

      return { hops: [...hops, hop], leafColumnKey: 'value' }
    }

    if (!columnLeafFieldTypes.has(field.type)) {
      return undefined
    }

    const leafColumnKey = `${columnPrefix}${field.name}`

    if ((adapter.tables[currentTableName] as GenericTable | undefined)?.[leafColumnKey]) {
      // The value sits on the table the last hop already reached, e.g. a plain column on an array
      // row or a field of a localized array whose rows carry `_locale` themselves.
      if (hops.length === 0) {
        return undefined
      }

      return { hops, leafColumnKey }
    }

    const localesTableName = `${currentTableName}${adapter.localesSuffix ?? '_locales'}`

    if (!(adapter.tables[localesTableName] as GenericTable | undefined)?.[leafColumnKey]) {
      return undefined
    }

    const localesHop = resolveChildHop({
      adapter,
      isLocalesTable: true,
      tableName: localesTableName,
    })

    if (!localesHop) {
      return undefined
    }

    return { hops: [...hops, localesHop], leafColumnKey }
  }

  return undefined
}

const findBlock = ({
  slug,
  adapter,
  field,
}: {
  adapter: DrizzleAdapter
  field: FlattenedField
  slug?: string
}): FlattenedBlock | undefined => {
  if (!slug || !('blocks' in field)) {
    return undefined
  }

  for (const blockOrReference of field.blockReferences ?? field.blocks) {
    const block =
      typeof blockOrReference === 'string'
        ? adapter.payload.blocks[blockOrReference]
        : blockOrReference

    if (block?.slug === slug) {
      return block
    }
  }

  return undefined
}

const resolveChildHop = ({
  adapter,
  isLocalesTable = false,
  localeColumnKey = '_locale',
  pathValue,
  tableName,
  tableNameKey,
}: {
  adapter: DrizzleAdapter
  isLocalesTable?: boolean
  localeColumnKey?: string
  pathValue?: string
  tableName?: string
  tableNameKey?: string
}): PolymorphicJoinStorageHop | undefined => {
  const resolvedTableName = tableName ?? adapter.tableNameMap.get(tableNameKey)
  const table = resolvedTableName
    ? (adapter.tables[resolvedTableName] as GenericTable | undefined)
    : undefined

  if (!resolvedTableName || !table) {
    return undefined
  }

  const parentColumnKey = table['_parentID'] ? '_parentID' : table['parent'] ? 'parent' : undefined

  if (!parentColumnKey) {
    return undefined
  }

  // A block table can be shared by several blocks fields, so a `_path` filter is required to keep a
  // constraint from matching rows that belong to a different field.
  if (pathValue && !table['_path']) {
    return undefined
  }

  return {
    isLocalesTable,
    localeColumnKey: table[localeColumnKey] ? localeColumnKey : undefined,
    parentColumnKey,
    pathValue,
    tableName: resolvedTableName,
  }
}

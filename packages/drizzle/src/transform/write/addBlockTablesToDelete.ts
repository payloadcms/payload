import type { FlattenedBlocksField, FlattenedField } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../../types.js'

import { resolveBlockTableName } from '../../utilities/validateExistingBlockIsIdentical.js'

type Args = {
  adapter: DrizzleAdapter
  baseTableName: string
  blocksToDelete: Set<string>
  field: FlattenedBlocksField
}

/**
 * Marks the tables of every block a blocks field allows for deletion, plus the tables of
 * every blocks field nested inside those blocks (also through arrays, groups and tabs).
 *
 * All block rows reference the document through `_parent_id`, not the block that contains
 * them. So nested rows must be cleared even when no block of the containing type is present
 * in the new data, otherwise rows with a stale `_path` survive and are merged into whatever
 * block later occupies that path on read.
 */
export const addBlockTablesToDelete = ({
  adapter,
  baseTableName,
  blocksToDelete,
  field,
}: Args): void => {
  field.blocks.forEach((block) => {
    const matchedBlock =
      typeof block === 'string'
        ? adapter.payload.config.blocks.find((each) => each.slug === block)
        : block

    if (!matchedBlock) {
      return
    }

    const tableName = resolveBlockTableName(
      matchedBlock,
      adapter.tableNameMap.get(`${baseTableName}_blocks_${toSnakeCase(matchedBlock.slug)}`),
    )

    if (blocksToDelete.has(tableName)) {
      return
    }

    blocksToDelete.add(tableName)
    addNestedBlockTablesToDelete({
      adapter,
      baseTableName,
      blocksToDelete,
      fields: matchedBlock.flattenedFields,
    })
  })
}

const addNestedBlockTablesToDelete = ({
  adapter,
  baseTableName,
  blocksToDelete,
  fields,
}: { fields: FlattenedField[] } & Omit<Args, 'field'>): void => {
  fields.forEach((field) => {
    if (field.type === 'blocks') {
      addBlockTablesToDelete({ adapter, baseTableName, blocksToDelete, field })
    } else if ('flattenedFields' in field) {
      addNestedBlockTablesToDelete({
        adapter,
        baseTableName,
        blocksToDelete,
        fields: field.flattenedFields,
      })
    }
  })
}

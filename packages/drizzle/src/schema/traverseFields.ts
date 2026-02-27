import type { FlattenedField } from 'payload'

import { InvalidConfiguration } from 'payload'
import {
  fieldAffectsData,
  fieldIsVirtual,
  fieldShouldBeLocalized,
  optionIsObject,
} from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type {
  DrizzleAdapter,
  IDType,
  RawColumn,
  RawForeignKey,
  RawIndex,
  RawRelation,
  RelationMap,
  SetColumnID,
} from '../types.js'

import { createTableName } from '../createTableName.js'
import { buildForeignKeyName } from '../utilities/buildForeignKeyName.js'
import { buildIndexName } from '../utilities/buildIndexName.js'
import { getArrayRelationName } from '../utilities/getArrayRelationName.js'
import { hasLocalesTable } from '../utilities/hasLocalesTable.js'
import {
  InternalBlockTableNameIndex,
  setInternalBlockIndex,
  validateExistingBlockIsIdentical,
} from '../utilities/validateExistingBlockIsIdentical.js'
import { buildTable } from './build.js'
import { idToUUID } from './idToUUID.js'
import { withDefault } from './withDefault.js'

type Args = {
  adapter: DrizzleAdapter
  blocksTableNameMap: Record<string, number>
  columnPrefix?: string
  columns: Record<string, RawColumn>
  disableNotNull: boolean
  disableRelsTableUnique?: boolean
  disableUnique?: boolean
  fieldPrefix?: string
  fields: FlattenedField[]
  forceLocalized?: boolean
  indexes: Record<string, RawIndex>
  localesColumns: Record<string, RawColumn>
  localesIndexes: Record<string, RawIndex>
  newTableName: string
  parentIsLocalized: boolean
  parentTableName: string
  relationships: Set<string>
  relationsToBuild: RelationMap
  rootRelationsToBuild?: RelationMap
  rootTableIDColType: IDType
  rootTableName: string
  setColumnID: SetColumnID
  uniqueRelationships: Set<string>
  versions: boolean
  /**
   * Tracks whether or not this table is built
   * from the result of a localized array or block field at some point
   */
  withinLocalizedArrayOrBlock?: boolean
}

type Result = {
  hasLocalizedField: boolean
  hasLocalizedManyNumberField: boolean
  hasLocalizedManyTextField: boolean
  hasLocalizedRelationshipField: boolean
  hasManyNumberField: 'index' | boolean
  hasManyTextField: 'index' | boolean
}

export const traverseFields = ({
  adapter,
  blocksTableNameMap,
  columnPrefix,
  columns,
  disableNotNull,
  disableRelsTableUnique,
  disableUnique = false,
  fieldPrefix,
  fields,
  forceLocalized,
  indexes,
  localesColumns,
  localesIndexes,
  newTableName,
  parentIsLocalized,
  parentTableName,
  relationships,
  relationsToBuild,
  rootRelationsToBuild,
  rootTableIDColType,
  rootTableName,
  setColumnID,
  uniqueRelationships,
  versions,
  withinLocalizedArrayOrBlock,
}: Args): Result => {
  const throwValidationError = true
  let hasLocalizedField = false
  let hasLocalizedRelationshipField = false
  let hasManyTextField: 'index' | boolean = false
  let hasLocalizedManyTextField = false
  let hasManyNumberField: 'index' | boolean = false
  let hasLocalizedManyNumberField = false

  let parentIDColType: IDType = 'integer'

  const idColumn = columns.id

  if (idColumn && ['numeric', 'text', 'uuid', 'varchar'].includes(idColumn.type)) {
    parentIDColType = idColumn.type as IDType
  }

  fields.forEach((field) => {
    if ('name' in field && field.name === 'id') {
      return
    }
    if (fieldIsVirtual(field)) {
      return
    }

    let targetTable = columns
    let targetIndexes = indexes

    const columnName = `${columnPrefix || ''}${field.name[0] === '_' ? '_' : ''}${toSnakeCase(
      field.name,
    )}`
    const fieldName = `${fieldPrefix?.replace('.', '_') || ''}${field.name}`

    const isFieldLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

    // If field is localized,
    // add the column to the locale table instead of main table
    if (
      adapter.payload.config.localization &&
      (isFieldLocalized || forceLocalized) &&
      field.type !== 'array' &&
      (field.type !== 'blocks' || adapter.blocksAsJSON) &&
      (('hasMany' in field && field.hasMany !== true) || !('hasMany' in field))
    ) {
      hasLocalizedField = true
      targetTable = localesColumns
      targetIndexes = localesIndexes
    }

    if (
      (field.unique || field.index || ['relationship', 'upload'].includes(field.type)) &&
      !['array', 'blocks', 'group'].includes(field.type) &&
      !('hasMany' in field && field.hasMany === true) &&
      !('relationTo' in field && Array.isArray(field.relationTo))
    ) {
      const unique = disableUnique !== true && field.unique
      if (unique) {
        const constraintValue = `${fieldPrefix || ''}${field.name}`
        if (!adapter.fieldConstraints?.[rootTableName]) {
          adapter.fieldConstraints[rootTableName] = {}
        }
        adapter.fieldConstraints[rootTableName][`${columnName}_idx`] = constraintValue
      }

      const indexName = buildIndexName({ name: `${newTableName}_${columnName}`, adapter })

      targetIndexes[indexName] = {
        name: indexName,
        on: isFieldLocalized ? [fieldName, '_locale'] : fieldName,
        unique,
      }
    }

    switch (field.type) {
      case 'array': {
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        const arrayTableName = createTableName({
          adapter,
          config: field,
          parentTableName: newTableName,
          prefix: `${newTableName}_`,
          throwValidationError,
          versionsCustomName: versions,
        })

        const baseColumns: Record<string, RawColumn> = {
          _order: {
            name: '_order',
            type: 'integer',
            notNull: true,
          },
          _parentID: {
            name: '_parent_id',
            type: parentIDColType,
            notNull: true,
          },
        }

        const baseIndexes: Record<string, RawIndex> = {
          _orderIdx: {
            name: buildIndexName({ name: `${arrayTableName}_order`, adapter }),
            on: ['_order'],
          },
          _parentIDIdx: {
            name: buildIndexName({ name: `${arrayTableName}_parent_id`, adapter }),
            on: '_parentID',
          },
        }

        const baseForeignKeys: Record<string, RawForeignKey> = {
          _parentIDFk: {
            name: buildForeignKeyName({ name: `${arrayTableName}_parent_id`, adapter }),
            columns: ['_parentID'],
            foreignColumns: [
              {
                name: 'id',
                table: parentTableName,
              },
            ],
            onDelete: 'cascade',
          },
        }

        const isLocalized =
          Boolean(isFieldLocalized && adapter.payload.config.localization) ||
          withinLocalizedArrayOrBlock ||
          forceLocalized

        if (isLocalized) {
          baseColumns._locale = {
            name: '_locale',
            type: 'enum',
            locale: true,
            notNull: true,
          }

          baseIndexes._localeIdx = {
            name: buildIndexName({ name: `${arrayTableName}_locale`, adapter }),
            on: '_locale',
          }
        }

        const {
          hasLocalizedManyNumberField: subHasLocalizedManyNumberField,
          hasLocalizedManyTextField: subHasLocalizedManyTextField,
          hasLocalizedRelationshipField: subHasLocalizedRelationshipField,
          hasManyNumberField: subHasManyNumberField,
          hasManyTextField: subHasManyTextField,
          relationsToBuild: subRelationsToBuild,
        } = buildTable({
          adapter,
          baseColumns,
          baseForeignKeys,
          baseIndexes,
          blocksTableNameMap,
          disableNotNull: disableNotNullFromHere,
          disableRelsTableUnique: true,
          disableUnique,
          fields: disableUnique ? idToUUID(field.flattenedFields) : field.flattenedFields,
          parentIsLocalized: parentIsLocalized || field.localized,
          rootRelationships: relationships,
          rootRelationsToBuild,
          rootTableIDColType,
          rootTableName,
          rootUniqueRelationships: uniqueRelationships,
          setColumnID,
          tableName: arrayTableName,
          versions,
          withinLocalizedArrayOrBlock: isLocalized,
        })

        if (subHasLocalizedManyNumberField) {
          hasLocalizedManyNumberField = subHasLocalizedManyNumberField
        }

        if (subHasLocalizedRelationshipField) {
          hasLocalizedRelationshipField = subHasLocalizedRelationshipField
        }

        if (subHasLocalizedManyTextField) {
          hasLocalizedManyTextField = subHasLocalizedManyTextField
        }

        if (subHasManyTextField) {
          if (!hasManyTextField || subHasManyTextField === 'index') {
            hasManyTextField = subHasManyTextField
          }
        }
        if (subHasManyNumberField) {
          if (!hasManyNumberField || subHasManyNumberField === 'index') {
            hasManyNumberField = subHasManyNumberField
          }
        }

        const relationName = getArrayRelationName({
          field,
          path: fieldName,
          tableName: arrayTableName,
        })

        relationsToBuild.set(relationName, {
          type: 'many',
          // arrays have their own localized table, independent of the base table.
          localized: false,
          target: arrayTableName,
        })

        const arrayRelations: Record<string, RawRelation> = {
          _parentID: {
            type: 'one',
            fields: [
              {
                name: '_parentID',
                table: arrayTableName,
              },
            ],
            references: ['id'],
            relationName,
            to: parentTableName,
          },
        }

        if (
          hasLocalesTable({
            fields: field.fields,
            parentIsLocalized: parentIsLocalized || field.localized,
          })
        ) {
          arrayRelations._locales = {
            type: 'many',
            relationName: '_locales',
            to: `${arrayTableName}${adapter.localesSuffix}`,
          }
        }

        subRelationsToBuild.forEach(({ type, localized, target }, key) => {
          if (type === 'one') {
            const arrayWithLocalized = localized
              ? `${arrayTableName}${adapter.localesSuffix}`
              : arrayTableName

            arrayRelations[key] = {
              type: 'one',
              fields: [
                {
                  name: key,
                  table: arrayWithLocalized,
                },
              ],
              references: ['id'],
              relationName: key,
              to: target,
            }
          }

          if (type === 'many') {
            arrayRelations[key] = {
              type: 'many',
              relationName: key,
              to: target,
            }
          }
        })

        adapter.rawRelations[arrayTableName] = arrayRelations

        break
      }
      case 'blocks': {
        if (adapter.blocksAsJSON) {
          targetTable[fieldName] = withDefault(
            {
              name: columnName,
              type: 'jsonb',
            },
            field,
          )
          break
        }

        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        ;(field.blockReferences ?? field.blocks).forEach((_block) => {
          const block = typeof _block === 'string' ? adapter.payload.blocks[_block] : _block

          let blockTableName = createTableName({
            adapter,
            config: block,
            parentTableName: rootTableName,
            prefix: `${rootTableName}_blocks_`,
            throwValidationError,
            versionsCustomName: versions,
          })

          if (typeof blocksTableNameMap[blockTableName] === 'undefined') {
            blocksTableNameMap[blockTableName] = 1
          } else if (
            !adapter.rawTables[blockTableName] ||
            !validateExistingBlockIsIdentical({
              block,
              localized: field.localized,
              rootTableName,
              table: adapter.rawTables[blockTableName],
              tableLocales: adapter.rawTables[`${blockTableName}${adapter.localesSuffix}`],
            })
          ) {
            blocksTableNameMap[blockTableName]++
            setInternalBlockIndex(block, blocksTableNameMap[blockTableName])
            blockTableName = `${blockTableName}_${blocksTableNameMap[blockTableName]}`
          }
          let relationName = `_blocks_${block.slug}`
          if (typeof block[InternalBlockTableNameIndex] !== 'undefined') {
            relationName = `_blocks_${block.slug}_${block[InternalBlockTableNameIndex]}`
          }

          if (!adapter.rawTables[blockTableName]) {
            const baseColumns: Record<string, RawColumn> = {
              _order: {
                name: '_order',
                type: 'integer',
                notNull: true,
              },
              _parentID: {
                name: '_parent_id',
                type: rootTableIDColType,
                notNull: true,
              },
              _path: {
                name: '_path',
                type: 'text',
                notNull: true,
              },
            }

            const baseIndexes: Record<string, RawIndex> = {
              _orderIdx: {
                name: buildIndexName({ name: `${blockTableName}_order`, adapter }),
                on: '_order',
              },
              _parentIDIdx: {
                name: buildIndexName({ name: `${blockTableName}_parent_id`, adapter }),
                on: ['_parentID'],
              },
              _pathIdx: {
                name: buildIndexName({ name: `${blockTableName}_path`, adapter }),
                on: '_path',
              },
            }

            const baseForeignKeys: Record<string, RawForeignKey> = {
              _parentIdFk: {
                name: buildForeignKeyName({ name: `${blockTableName}_parent_id`, adapter }),
                columns: ['_parentID'],
                foreignColumns: [
                  {
                    name: 'id',
                    table: rootTableName,
                  },
                ],
                onDelete: 'cascade',
              },
            }

            const isLocalized =
              Boolean(isFieldLocalized && adapter.payload.config.localization) ||
              withinLocalizedArrayOrBlock ||
              forceLocalized

            if (isLocalized) {
              baseColumns._locale = {
                name: '_locale',
                type: 'enum',
                locale: true,
                notNull: true,
              }

              baseIndexes._localeIdx = {
                name: buildIndexName({ name: `${blockTableName}_locale`, adapter }),
                on: '_locale',
              }
            }

            const {
              hasLocalizedManyNumberField: subHasLocalizedManyNumberField,
              hasLocalizedManyTextField: subHasLocalizedManyTextField,
              hasLocalizedRelationshipField: subHasLocalizedRelationshipField,
              hasManyNumberField: subHasManyNumberField,
              hasManyTextField: subHasManyTextField,
              relationsToBuild: subRelationsToBuild,
            } = buildTable({
              adapter,
              baseColumns,
              baseForeignKeys,
              baseIndexes,
              blocksTableNameMap,
              disableNotNull: disableNotNullFromHere,
              disableRelsTableUnique: true,
              disableUnique,
              fields: disableUnique ? idToUUID(block.flattenedFields) : block.flattenedFields,
              parentIsLocalized: parentIsLocalized || field.localized,
              rootRelationships: relationships,
              rootRelationsToBuild,
              rootTableIDColType,
              rootTableName,
              rootUniqueRelationships: uniqueRelationships,
              setColumnID,
              tableName: blockTableName,
              versions,
              withinLocalizedArrayOrBlock: isLocalized,
            })

            if (subHasLocalizedManyNumberField) {
              hasLocalizedManyNumberField = subHasLocalizedManyNumberField
            }

            if (subHasLocalizedRelationshipField) {
              hasLocalizedRelationshipField = subHasLocalizedRelationshipField
            }

            if (subHasLocalizedManyTextField) {
              hasLocalizedManyTextField = subHasLocalizedManyTextField
            }

            if (subHasManyTextField) {
              if (!hasManyTextField || subHasManyTextField === 'index') {
                hasManyTextField = subHasManyTextField
              }
            }

            if (subHasManyNumberField) {
              if (!hasManyNumberField || subHasManyNumberField === 'index') {
                hasManyNumberField = subHasManyNumberField
              }
            }

            const blockRelations: Record<string, RawRelation> = {
              _parentID: {
                type: 'one',
                fields: [
                  {
                    name: '_parentID',
                    table: blockTableName,
                  },
                ],
                references: ['id'],
                relationName,
                to: rootTableName,
              },
            }

            if (
              hasLocalesTable({
                fields: block.fields,
                parentIsLocalized: parentIsLocalized || field.localized,
              })
            ) {
              blockRelations._locales = {
                type: 'many',
                relationName: '_locales',
                to: `${blockTableName}${adapter.localesSuffix}`,
              }
            }

            subRelationsToBuild.forEach(({ type, localized, target }, key) => {
              if (type === 'one') {
                const blockWithLocalized = localized
                  ? `${blockTableName}${adapter.localesSuffix}`
                  : blockTableName

                blockRelations[key] = {
                  type: 'one',
                  fields: [
                    {
                      name: key,
                      table: blockWithLocalized,
                    },
                  ],
                  references: ['id'],
                  relationName: key,
                  to: target,
                }
              }

              if (type === 'many') {
                blockRelations[key] = {
                  type: 'many',
                  relationName: key,
                  to: target,
                }
              }
            })

            adapter.rawRelations[blockTableName] = blockRelations
          }

          // blocks relationships are defined from the collection or globals table down to the block, bypassing any subBlocks
          rootRelationsToBuild.set(relationName, {
            type: 'many',
            // blocks are not localized on the parent table
            localized: false,
            target: blockTableName,
          })
        })

        break
      }
      case 'checkbox': {
        targetTable[fieldName] = withDefault(
          {
            name: columnName,
            type: 'boolean',
          },
          field,
        )

        break
      }

      case 'code':
      case 'email':
      case 'textarea': {
        targetTable[fieldName] = withDefault(
          {
            name: columnName,
            type: 'varchar',
          },
          field,
        )

        break
      }

      case 'date': {
        targetTable[fieldName] = withDefault(
          {
            name: columnName,
            type: 'timestamp',
            mode: 'string',
            precision: 3,
            withTimezone: true,
          },
          field,
        )

        break
      }

      case 'group':
      case 'tab': {
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        const {
          hasLocalizedField: groupHasLocalizedField,
          hasLocalizedManyNumberField: groupHasLocalizedManyNumberField,
          hasLocalizedManyTextField: groupHasLocalizedManyTextField,
          hasLocalizedRelationshipField: groupHasLocalizedRelationshipField,
          hasManyNumberField: groupHasManyNumberField,
          hasManyTextField: groupHasManyTextField,
        } = traverseFields({
          adapter,
          blocksTableNameMap,
          columnPrefix: `${columnName}_`,
          columns,
          disableNotNull: disableNotNullFromHere,
          disableUnique,
          fieldPrefix: `${fieldName}.`,
          fields: field.flattenedFields,
          forceLocalized: isFieldLocalized,
          indexes,
          localesColumns,
          localesIndexes,
          newTableName: `${parentTableName}_${columnName}`,
          parentIsLocalized: parentIsLocalized || field.localized,
          parentTableName,
          relationships,
          relationsToBuild,
          rootRelationsToBuild,
          rootTableIDColType,
          rootTableName,
          setColumnID,
          uniqueRelationships,
          versions,
          withinLocalizedArrayOrBlock: withinLocalizedArrayOrBlock || isFieldLocalized,
        })

        if (groupHasLocalizedField) {
          hasLocalizedField = true
        }
        if (groupHasLocalizedRelationshipField) {
          hasLocalizedRelationshipField = true
        }
        if (groupHasManyTextField) {
          hasManyTextField = true
        }
        if (groupHasLocalizedManyTextField) {
          hasLocalizedManyTextField = true
        }
        if (groupHasManyNumberField) {
          hasManyNumberField = true
        }
        if (groupHasLocalizedManyNumberField) {
          hasLocalizedManyNumberField = true
        }
        break
      }

      case 'json':
      case 'richText': {
        targetTable[fieldName] = withDefault(
          {
            name: columnName,
            type: 'jsonb',
          },
          field,
        )

        break
      }

      case 'number': {
        if (field.hasMany) {
          const isLocalized =
            Boolean(isFieldLocalized && adapter.payload.config.localization) ||
            withinLocalizedArrayOrBlock ||
            forceLocalized

          if (isLocalized) {
            hasLocalizedManyNumberField = true
          }

          if (field.index) {
            hasManyNumberField = 'index'
          } else if (!hasManyNumberField) {
            hasManyNumberField = true
          }

          if (field.unique) {
            throw new InvalidConfiguration(
              'Unique is not supported in Postgres for hasMany number fields.',
            )
          }
        } else {
          targetTable[fieldName] = withDefault(
            {
              name: columnName,
              type: 'numeric',
            },
            field,
          )
        }

        break
      }

      case 'point': {
        targetTable[fieldName] = withDefault(
          {
            name: columnName,
            type: 'geometry',
          },
          field,
        )

        break
      }

      case 'radio':
      case 'select': {
        const enumName = createTableName({
          adapter,
          config: field,
          parentTableName: newTableName,
          prefix: `enum_${newTableName}_`,
          target: 'enumName',
          throwValidationError,
        })

        const options = field.options.map((option) => {
          if (optionIsObject(option)) {
            return option.value
          }

          return option
        })

        if (field.type === 'select' && field.hasMany) {
          const selectTableName = createTableName({
            adapter,
            config: field,
            parentTableName: newTableName,
            prefix: `${newTableName}_`,
            throwValidationError,
            versionsCustomName: versions,
          })

          const baseColumns: Record<string, RawColumn> = {
            order: {
              name: 'order',
              type: 'integer',
              notNull: true,
            },
            parent: {
              name: 'parent_id',
              type: parentIDColType,
              notNull: true,
            },
            value: {
              name: 'value',
              type: 'enum',
              enumName: createTableName({
                adapter,
                config: field,
                parentTableName: newTableName,
                prefix: `enum_${newTableName}_`,
                target: 'enumName',
                throwValidationError,
              }),
              options,
            },
          }

          const baseIndexes: Record<string, RawIndex> = {
            orderIdx: {
              name: buildIndexName({ name: `${selectTableName}_order`, adapter }),
              on: 'order',
            },
            parentIdx: {
              name: buildIndexName({ name: `${selectTableName}_parent`, adapter }),
              on: 'parent',
            },
          }

          const baseForeignKeys: Record<string, RawForeignKey> = {
            parentFk: {
              name: buildForeignKeyName({ name: `${selectTableName}_parent`, adapter }),
              columns: ['parent'],
              foreignColumns: [
                {
                  name: 'id',
                  table: parentTableName,
                },
              ],
              onDelete: 'cascade',
            },
          }

          const isLocalized =
            Boolean(isFieldLocalized && adapter.payload.config.localization) ||
            withinLocalizedArrayOrBlock ||
            forceLocalized

          if (isLocalized) {
            baseColumns.locale = {
              name: 'locale',
              type: 'enum',
              locale: true,
              notNull: true,
            }

            baseIndexes.localeIdx = {
              name: buildIndexName({ name: `${selectTableName}_locale`, adapter }),
              on: 'locale',
            }
          }

          if (field.index) {
            baseIndexes.value = {
              name: buildIndexName({ name: `${selectTableName}_value`, adapter }),
              on: 'value',
            }
          }

          buildTable({
            adapter,
            baseColumns,
            baseForeignKeys,
            baseIndexes,
            blocksTableNameMap,
            disableNotNull,
            disableUnique,
            fields: [],
            parentIsLocalized: parentIsLocalized || field.localized,
            rootTableName,
            setColumnID,
            tableName: selectTableName,
            versions,
          })

          relationsToBuild.set(fieldName, {
            type: 'many',
            // selects have their own localized table, independent of the base table.
            localized: false,
            target: selectTableName,
          })

          adapter.rawRelations[selectTableName] = {
            parent: {
              type: 'one',
              fields: [
                {
                  name: 'parent',
                  table: selectTableName,
                },
              ],
              references: ['id'],
              relationName: fieldName,
              to: parentTableName,
            },
          }
        } else {
          targetTable[fieldName] = withDefault(
            {
              name: columnName,
              type: 'enum',
              enumName,
              options,
            },
            field,
          )
        }
        break
      }

      case 'relationship':
      case 'upload':
        if (Array.isArray(field.relationTo)) {
          field.relationTo.forEach((relation) => {
            relationships.add(relation)
            if (field.unique && !disableUnique && !disableRelsTableUnique) {
              uniqueRelationships.add(relation)
            }
          })
        } else if (field.hasMany) {
          relationships.add(field.relationTo)
          if (field.unique && !disableUnique && !disableRelsTableUnique) {
            uniqueRelationships.add(field.relationTo)
          }
        } else {
          // simple relationships get a column on the targetTable with a foreign key to the relationTo table
          const relationshipConfig = adapter.payload.collections[field.relationTo].config

          const tableName = adapter.tableNameMap.get(toSnakeCase(field.relationTo))

          // get the id type of the related collection
          let colType: IDType = adapter.idType === 'uuid' ? 'uuid' : 'integer'
          const relatedCollectionCustomID = relationshipConfig.fields.find(
            (field) => fieldAffectsData(field) && field.name === 'id',
          )
          if (relatedCollectionCustomID?.type === 'number') {
            colType = 'numeric'
          }
          if (relatedCollectionCustomID?.type === 'text') {
            colType = 'varchar'
          }

          // make the foreign key column for relationship using the correct id column type
          targetTable[fieldName] = {
            name: `${columnName}_id`,
            type: colType,
            reference: {
              name: 'id',
              onDelete: 'set null',
              table: tableName,
            },
          }

          // add relationship to table
          relationsToBuild.set(fieldName, {
            type: 'one',
            localized: adapter.payload.config.localization && (isFieldLocalized || forceLocalized),
            target: tableName,
          })

          // add notNull when not required
          if (!disableNotNull && field.required && !field.admin?.condition) {
            targetTable[fieldName].notNull = true
          }
          break
        }

        if (
          Boolean(isFieldLocalized && adapter.payload.config.localization) ||
          withinLocalizedArrayOrBlock
        ) {
          hasLocalizedRelationshipField = true
        }

        break

      case 'text': {
        if (field.hasMany) {
          const isLocalized =
            Boolean(isFieldLocalized && adapter.payload.config.localization) ||
            withinLocalizedArrayOrBlock ||
            forceLocalized

          if (isLocalized) {
            hasLocalizedManyTextField = true
          }

          if (field.index) {
            hasManyTextField = 'index'
          } else if (!hasManyTextField) {
            hasManyTextField = true
          }

          if (field.unique) {
            throw new InvalidConfiguration(
              'Unique is not supported in Postgres for hasMany text fields.',
            )
          }
        } else {
          targetTable[fieldName] = withDefault(
            {
              name: columnName,
              type: 'varchar',
            },
            field,
          )
        }
        break
      }

      default:
        break
    }

    const condition = field.admin && field.admin.condition

    if (
      !disableNotNull &&
      targetTable[fieldName] &&
      'required' in field &&
      field.required &&
      !condition
    ) {
      targetTable[fieldName].notNull = true
    }
  })

  return {
    hasLocalizedField,
    hasLocalizedManyNumberField,
    hasLocalizedManyTextField,
    hasLocalizedRelationshipField,
    hasManyNumberField,
    hasManyTextField,
  }
}

import type { CompoundIndex, FlattenedField } from 'payload'

import { InvalidConfiguration } from 'payload'
import {
  array,
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
import { buildIndexName } from '../utilities/buildIndexName.js'
import { hasLocalesTable } from '../utilities/hasLocalesTable.js'
import { validateExistingBlockIsIdentical } from '../utilities/validateExistingBlockIsIdentical.js'
import { buildTable } from './build.js'
import { idToUUID } from './idToUUID.js'
import { withDefault } from './withDefault.js'

type Args = {
  adapter: DrizzleAdapter
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
      field.type !== 'blocks' &&
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
            name: `${arrayTableName}_order_idx`,
            on: ['_order'],
          },
          _parentIDIdx: {
            name: `${arrayTableName}_parent_id_idx`,
            on: '_parentID',
          },
        }

        const baseForeignKeys: Record<string, RawForeignKey> = {
          _parentIDFk: {
            name: `${arrayTableName}_parent_id_fk`,
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
            name: `${arrayTableName}_locale_idx`,
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

        const relationName = field.dbName ? `_${arrayTableName}` : fieldName

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
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        ;(field.blockReferences ?? field.blocks).forEach((_block) => {
          const block = typeof _block === 'string' ? adapter.payload.blocks[_block] : _block

          const blockTableName = createTableName({
            adapter,
            config: block,
            parentTableName: rootTableName,
            prefix: `${rootTableName}_blocks_`,
            throwValidationError,
            versionsCustomName: versions,
          })
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
                name: `${blockTableName}_order_idx`,
                on: '_order',
              },
              _parentIDIdx: {
                name: `${blockTableName}_parent_id_idx`,
                on: ['_parentID'],
              },
              _pathIdx: {
                name: `${blockTableName}_path_idx`,
                on: '_path',
              },
            }

            const baseForeignKeys: Record<string, RawForeignKey> = {
              _parentIdFk: {
                name: `${blockTableName}_parent_id_fk`,
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
                name: `${blockTableName}_locale_idx`,
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
                relationName: `_blocks_${block.slug}`,
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
          } else if (process.env.NODE_ENV !== 'production' && !versions) {
            validateExistingBlockIsIdentical({
              block,
              localized: field.localized,
              parentIsLocalized: parentIsLocalized || field.localized,
              rootTableName,
              table: adapter.rawTables[blockTableName],
              tableLocales: adapter.rawTables[`${blockTableName}${adapter.localesSuffix}`],
            })
          }
          // blocks relationships are defined from the collection or globals table down to the block, bypassing any subBlocks
          rootRelationsToBuild.set(`_blocks_${block.slug}`, {
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
              name: `${selectTableName}_order_idx`,
              on: 'order',
            },
            parentIdx: {
              name: `${selectTableName}_parent_idx`,
              on: 'parent',
            },
          }

          const baseForeignKeys: Record<string, RawForeignKey> = {
            parentFk: {
              name: `${selectTableName}_parent_fk`,
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
              name: `${selectTableName}_locale_idx`,
              on: 'locale',
            }
          }

          if (field.index) {
            baseIndexes.value = {
              name: `${selectTableName}_value_idx`,
              on: 'value',
            }
          }

          buildTable({
            adapter,
            baseColumns,
            baseForeignKeys,
            baseIndexes,
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

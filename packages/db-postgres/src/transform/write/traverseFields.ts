/* eslint-disable no-param-reassign */
import type { Field } from 'payload/types'

import { fieldAffectsData, valueIsValueWithRelation } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { ArrayRowToInsert, BlockRowToInsert } from './types.js'

import { isArrayOfRows } from '../../utilities/isArrayOfRows.js'

type Args = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  columnPrefix: string
  data: Record<string, unknown>
  fields: Field[]
  locale: string
  localeRow: Record<string, unknown>
  newTableName: string
  parentTableName: string
  path: string
  relationships: Record<string, unknown>[]
  row: Record<string, unknown>
}

export const traverseFields = ({
  arrays,
  blocks,
  columnPrefix,
  data,
  fields,
  locale,
  localeRow,
  newTableName,
  parentTableName,
  path,
  relationships,
  row,
}: Args) => {
  fields.forEach((field) => {
    let targetRow = row
    let columnName = ''
    let fieldData

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${field.name}`
      fieldData = data[field.name]

      if (field.localized) {
        targetRow = localeRow

        if (
          typeof data[field.name] === 'object' &&
          data[field.name] !== null &&
          data[field.name][locale]
        ) {
          fieldData = data[field.name][locale]
        }
      }
    }

    switch (field.type) {
      case 'number': {
        // TODO: handle hasMany
        targetRow[columnName] = fieldData
        break
      }

      case 'select': {
        break
      }

      case 'array': {
        if (isArrayOfRows(fieldData)) {
          const arrayTableName = `${newTableName}_${toSnakeCase(field.name)}`
          if (!arrays[arrayTableName]) arrays[arrayTableName] = []

          fieldData.forEach((arrayRow, i) => {
            const newRow: ArrayRowToInsert = {
              arrays: {},
              columnName,
              locale: {
                _locale: locale,
              },
              row: {
                _order: i + 1,
              },
            }

            if (field.localized) newRow.row._locale = locale

            traverseFields({
              arrays: newRow.arrays,
              blocks,
              columnPrefix: '',
              data: arrayRow,
              fields: field.fields,
              locale,
              localeRow: newRow.locale,
              newTableName: arrayTableName,
              parentTableName: arrayTableName,
              path: `${path || ''}${field.name}.${i}.`,
              relationships,
              row: newRow.row,
            })

            arrays[arrayTableName].push(newRow)
          })
        }

        break
      }

      case 'blocks': {
        if (isArrayOfRows(fieldData)) {
          fieldData.forEach((blockRow, i) => {
            if (typeof blockRow.blockType !== 'string') return
            const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType)
            if (!matchedBlock) return

            if (!blocks[blockRow.blockType]) blocks[blockRow.blockType] = []

            const newRow: BlockRowToInsert = {
              arrays: {},
              locale: {},
              row: {
                _order: i + 1,
                _path: `${path}${field.name}`,
              },
            }

            if (field.localized) newRow.row._locale = locale

            const blockTableName = `${newTableName}_${toSnakeCase(blockRow.blockType)}`

            traverseFields({
              arrays: newRow.arrays,
              blocks,
              columnPrefix: '',
              data: blockRow,
              fields: matchedBlock.fields,
              locale,
              localeRow: newRow.locale,
              newTableName: blockTableName,
              parentTableName: blockTableName,
              path: `${path || ''}${field.name}.${i}.`,
              relationships,
              row: newRow.row,
            })

            blocks[blockRow.blockType].push(newRow)
          })
        }

        break
      }

      case 'group': {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          traverseFields({
            arrays,
            blocks,
            columnPrefix: `${columnName}_`,
            data: data[field.name] as Record<string, unknown>,
            fields: field.fields,
            locale,
            localeRow,
            newTableName: `${parentTableName}_${toSnakeCase(field.name)}`,
            parentTableName,
            path: `${path || ''}${field.name}.`,
            relationships,
            row,
          })
        }

        break
      }

      case 'date': {
        if (typeof fieldData === 'string') {
          const parsedDate = new Date(fieldData)
          targetRow[columnName] = parsedDate
        }

        break
      }

      // case 'tabs': {
      //   await Promise.all(field.tabs.map(async (tab) => {
      //     if ('name' in tab) {
      //       if (typeof data[tab.name] === 'object' && data[tab.name] !== null) {
      //         await traverseFields({
      //           adapter,
      //           arrayRowPromises,
      //           blockRows,
      //           columnPrefix: `${columnName}_`,
      //           data: data[tab.name] as Record<string, unknown>,
      //           fields: tab.fields,
      //           locale,
      //           localeRow,
      //           operation,
      //           path: `${path || ''}${tab.name}.`,
      //           relationshipRows,
      //           row,
      //           tableName,
      //         });
      //       }
      //     } else {
      //       await traverseFields({
      //         adapter,
      //         arrayRowPromises,
      //         blockRows,
      //         columnPrefix,
      //         data,
      //         fields: tab.fields,
      //         locale,
      //         localeRow,
      //         operation,
      //         path,
      //         relationshipRows,
      //         row,
      //         tableName,
      //       });
      //     }
      //   }));
      //   break;
      // }

      // case 'row':
      // case 'collapsible': {
      //   await traverseFields({
      //     adapter,
      //     arrayRowPromises,
      //     blockRows,
      //     columnPrefix,
      //     data,
      //     fields: field.fields,
      //     locale,
      //     localeRow,
      //     operation,
      //     path,
      //     relationshipRows,
      //     row,
      //     tableName,
      //   });
      //   break;
      // }

      case 'relationship':
      case 'upload': {
        const relations = Array.isArray(fieldData) ? fieldData : [fieldData]

        relations.forEach((relation, i) => {
          const relationRow: Record<string, unknown> = {
            path: `${path || ''}${field.name}`,
          }

          if ('hasMany' in field && field.hasMany) relationRow.order = i + 1
          if (field.localized) relationRow.locale = locale

          if (Array.isArray(field.relationTo) && valueIsValueWithRelation(relation)) {
            relationRow[`${relation.relationTo}ID`] = relation.value
            relationships.push(relationRow)
          } else {
            relationRow[`${field.relationTo}ID`] = relation
            if (relation) relationships.push(relationRow)
          }
        })

        break
      }

      default: {
        if (typeof fieldData !== 'undefined') {
          targetRow[columnName] = fieldData
        }
        break
      }
    }
  })
}

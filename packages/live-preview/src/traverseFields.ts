import type { DocumentEvent, FieldSchemaJSON } from 'payload'

import type { PopulationsByCollection } from './types.js'

import { traverseRichText } from './traverseRichText.js'

export const traverseFields = <T extends Record<string, any>>(args: {
  externallyUpdatedRelationship?: DocumentEvent
  fieldSchema: FieldSchemaJSON
  incomingData: T
  localeChanged: boolean
  populationsByCollection: PopulationsByCollection
  result: Record<string, any>
}): void => {
  const {
    externallyUpdatedRelationship,
    fieldSchema: fieldSchemas,
    incomingData,
    localeChanged,
    populationsByCollection,
    result,
  } = args

  fieldSchemas.forEach((fieldSchema) => {
    if ('name' in fieldSchema && typeof fieldSchema.name === 'string') {
      const fieldName = fieldSchema.name

      switch (fieldSchema.type) {
        case 'array':
          if (
            !incomingData[fieldName] &&
            incomingData[fieldName] !== undefined &&
            result?.[fieldName] !== undefined
          ) {
            result[fieldName] = []
          }

          if (Array.isArray(incomingData[fieldName])) {
            result[fieldName] = incomingData[fieldName].map((incomingRow, i) => {
              if (!result[fieldName]) {
                result[fieldName] = []
              }

              if (!result[fieldName][i]) {
                result[fieldName][i] = {}
              }

              traverseFields({
                externallyUpdatedRelationship,
                fieldSchema: fieldSchema.fields!,
                incomingData: incomingRow,
                localeChanged,
                populationsByCollection,
                result: result[fieldName][i],
              })

              return result[fieldName][i]
            })
          }

          break

        case 'blocks':
          if (Array.isArray(incomingData[fieldName])) {
            result[fieldName] = incomingData[fieldName].map((incomingBlock, i) => {
              const incomingBlockJSON = fieldSchema.blocks?.[incomingBlock.blockType]

              if (!result[fieldName]) {
                result[fieldName] = []
              }

              if (
                !result[fieldName][i] ||
                result[fieldName][i].id !== incomingBlock.id ||
                result[fieldName][i].blockType !== incomingBlock.blockType
              ) {
                result[fieldName][i] = {
                  blockType: incomingBlock.blockType,
                }
              }

              traverseFields({
                externallyUpdatedRelationship,
                fieldSchema: incomingBlockJSON!.fields!,
                incomingData: incomingBlock,
                localeChanged,
                populationsByCollection,
                result: result[fieldName][i],
              })

              return result[fieldName][i]
            })
          } else {
            result[fieldName] = []
          }

          break

        case 'group':
        // falls through
        case 'tabs':
          if (!result[fieldName]) {
            result[fieldName] = {}
          }

          traverseFields({
            externallyUpdatedRelationship,
            fieldSchema: fieldSchema.fields!,
            incomingData: incomingData[fieldName] || {},
            localeChanged,
            populationsByCollection,
            result: result[fieldName],
          })

          break

        case 'relationship':
        // falls through
        case 'upload':
          // Handle `hasMany` relationships
          if (fieldSchema.hasMany && Array.isArray(incomingData[fieldName])) {
            if (!result[fieldName] || !incomingData[fieldName].length) {
              result[fieldName] = []
            }

            incomingData[fieldName].forEach((incomingRelation, i) => {
              // Handle `hasMany` polymorphic
              if (Array.isArray(fieldSchema.relationTo)) {
                // if the field doesn't exist on the result, create it
                // the value will be populated later
                if (!result[fieldName][i]) {
                  result[fieldName][i] = {
                    relationTo: incomingRelation.relationTo,
                  }
                }

                const oldID = result[fieldName][i]?.value?.id
                const oldRelation = result[fieldName][i]?.relationTo
                const newID = incomingRelation.value
                const newRelation = incomingRelation.relationTo

                const hasChanged = newID !== oldID || newRelation !== oldRelation

                const hasUpdated =
                  newRelation === externallyUpdatedRelationship?.entitySlug &&
                  newID === externallyUpdatedRelationship?.id

                if (hasChanged || hasUpdated || localeChanged) {
                  if (!populationsByCollection[newRelation]) {
                    populationsByCollection[newRelation] = []
                  }

                  populationsByCollection[newRelation].push({
                    id: incomingRelation.value,
                    accessor: 'value',
                    ref: result[fieldName][i],
                  })
                }
              } else {
                // Handle `hasMany` monomorphic
                const hasChanged = incomingRelation !== result[fieldName][i]?.id

                const hasUpdated =
                  fieldSchema.relationTo === externallyUpdatedRelationship?.entitySlug &&
                  incomingRelation === externallyUpdatedRelationship?.id

                if (hasChanged || hasUpdated || localeChanged) {
                  if (!populationsByCollection[fieldSchema.relationTo!]) {
                    populationsByCollection[fieldSchema.relationTo!] = []
                  }

                  populationsByCollection[fieldSchema.relationTo!]?.push({
                    id: incomingRelation,
                    accessor: i,
                    ref: result[fieldName],
                  })
                }
              }
            })
          } else {
            // Handle `hasOne` polymorphic
            if (Array.isArray(fieldSchema.relationTo)) {
              // if the field doesn't exist on the result, create it
              // the value will be populated later
              if (!result[fieldName]) {
                result[fieldName] = {
                  relationTo: incomingData[fieldName]?.relationTo,
                }
              }

              const hasNewValue =
                incomingData[fieldName] &&
                typeof incomingData[fieldName] === 'object' &&
                incomingData[fieldName] !== null

              const hasOldValue =
                result[fieldName] &&
                typeof result[fieldName] === 'object' &&
                result[fieldName] !== null

              const newID = hasNewValue
                ? typeof incomingData[fieldName].value === 'object'
                  ? incomingData[fieldName].value.id
                  : incomingData[fieldName].value
                : ''

              const oldID = hasOldValue
                ? typeof result[fieldName].value === 'object'
                  ? result[fieldName].value.id
                  : result[fieldName].value
                : ''

              const newRelation = hasNewValue ? incomingData[fieldName].relationTo : ''
              const oldRelation = hasOldValue ? result[fieldName].relationTo : ''

              const hasChanged = newID !== oldID || newRelation !== oldRelation

              const hasUpdated =
                newRelation === externallyUpdatedRelationship?.entitySlug &&
                newID === externallyUpdatedRelationship?.id

              // if the new value/relation is different from the old value/relation
              // populate the new value, otherwise leave it alone
              if (hasChanged || hasUpdated || localeChanged) {
                // if the new value is not empty, populate it
                // otherwise set the value to null
                if (newID) {
                  if (!populationsByCollection[newRelation]) {
                    populationsByCollection[newRelation] = []
                  }

                  populationsByCollection[newRelation].push({
                    id: newID,
                    accessor: 'value',
                    ref: result[fieldName],
                  })
                } else {
                  result[fieldName] = null
                }
              }
            } else {
              // Handle `hasOne` monomorphic
              const newID: number | string | undefined =
                (incomingData[fieldName] &&
                  typeof incomingData[fieldName] === 'object' &&
                  incomingData[fieldName].id) ||
                incomingData[fieldName]

              const oldID: number | string | undefined =
                (result[fieldName] &&
                  typeof result[fieldName] === 'object' &&
                  result[fieldName].id) ||
                result[fieldName]

              const hasChanged = newID !== oldID

              const hasUpdated =
                fieldSchema.relationTo === externallyUpdatedRelationship?.entitySlug &&
                newID === externallyUpdatedRelationship?.id

              // if the new value is different from the old value
              // populate the new value, otherwise leave it alone
              if (hasChanged || hasUpdated || localeChanged) {
                // if the new value is not empty, populate it
                // otherwise set the value to null
                if (newID) {
                  if (!populationsByCollection[fieldSchema.relationTo!]) {
                    populationsByCollection[fieldSchema.relationTo!] = []
                  }

                  populationsByCollection[fieldSchema.relationTo!]?.push({
                    id: newID,
                    accessor: fieldName,
                    ref: result as Record<string, unknown>,
                  })
                } else {
                  result[fieldName] = null
                }
              }
            }
          }

          break
        case 'richText':
          result[fieldName] = traverseRichText({
            externallyUpdatedRelationship,
            incomingData: incomingData[fieldName],
            populationsByCollection,
            result: result[fieldName],
          })

          break

        default:
          result[fieldName] = incomingData[fieldName]
      }
    }
  })
}

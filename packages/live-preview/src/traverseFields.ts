import type { fieldSchemaToJSON } from 'payload/utilities'

import { promise } from './promise'

type Args<T> = {
  apiRoute?: string
  depth: number
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: T
  populationPromises: Promise<void>[]
  result: T
  serverURL: string
}

export const traverseFields = <T>({
  apiRoute,
  depth,
  fieldSchema: fieldSchemas,
  incomingData,
  populationPromises,
  result,
  serverURL,
}: Args<T>): void => {
  fieldSchemas.forEach((fieldSchema) => {
    if ('name' in fieldSchema && typeof fieldSchema.name === 'string') {
      const fieldName = fieldSchema.name

      switch (fieldSchema.type) {
        case 'array':
          if (Array.isArray(incomingData[fieldName])) {
            result[fieldName] = incomingData[fieldName].map((incomingRow, i) => {
              if (!result[fieldName]) {
                result[fieldName] = []
              }

              if (!result[fieldName][i]) {
                result[fieldName][i] = {}
              }

              traverseFields({
                apiRoute,
                depth,
                fieldSchema: fieldSchema.fields,
                incomingData: incomingRow,
                populationPromises,
                result: result[fieldName][i],
                serverURL,
              })

              return result[fieldName][i]
            })
          }
          break

        case 'blocks':
          if (Array.isArray(incomingData[fieldName])) {
            result[fieldName] = incomingData[fieldName].map((incomingBlock, i) => {
              const incomingBlockJSON = fieldSchema.blocks[incomingBlock.blockType]

              if (!result[fieldName]) {
                result[fieldName] = []
              }

              if (!result[fieldName][i]) {
                result[fieldName][i] = {
                  blockType: incomingBlock.blockType,
                }
              }

              traverseFields({
                apiRoute,
                depth,
                fieldSchema: incomingBlockJSON.fields,
                incomingData: incomingBlock,
                populationPromises,
                result: result[fieldName][i],
                serverURL,
              })

              return result[fieldName][i]
            })
          } else {
            result[fieldName] = []
          }

          break

        case 'tabs':
        case 'group':
          if (!result[fieldName]) {
            result[fieldName] = {}
          }

          traverseFields({
            apiRoute,
            depth,
            fieldSchema: fieldSchema.fields,
            incomingData: incomingData[fieldName] || {},
            populationPromises,
            result: result[fieldName],
            serverURL,
          })

          break

        case 'upload':
        case 'relationship':
          // Handle `hasMany` relationships
          if (fieldSchema.hasMany && Array.isArray(incomingData[fieldName])) {
            if (!result[fieldName]) {
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

                if (oldID !== newID || oldRelation !== newRelation) {
                  populationPromises.push(
                    promise({
                      id: incomingRelation.value,
                      accessor: 'value',
                      apiRoute,
                      collection: newRelation,
                      depth,
                      ref: result[fieldName][i],
                      serverURL,
                    }),
                  )
                }
              } else {
                // Handle `hasMany` monomorphic
                if (!result[fieldName][i]) {
                  result[fieldName][i] = {}
                }

                if (result[fieldName][i]?.id !== incomingRelation) {
                  populationPromises.push(
                    promise({
                      id: incomingRelation,
                      accessor: i,
                      apiRoute,
                      collection: String(fieldSchema.relationTo),
                      depth,
                      ref: result[fieldName],
                      serverURL,
                    }),
                  )
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

              // if the new value/relation is different from the old value/relation
              // populate the new value, otherwise leave it alone
              if (newID !== oldID || newRelation !== oldRelation) {
                // if the new value is not empty, populate it
                // otherwise set the value to null
                if (newID) {
                  populationPromises.push(
                    promise({
                      id: newID,
                      accessor: 'value',
                      apiRoute,
                      collection: newRelation,
                      depth,
                      ref: result[fieldName],
                      serverURL,
                    }),
                  )
                } else {
                  result[fieldName] = null
                }
              }
            } else {
              if (!result[fieldName]) {
                result[fieldName] = {}
              }

              // Handle `hasOne` monomorphic
              const newID: string =
                (typeof incomingData[fieldName] === 'string' && incomingData[fieldName]) ||
                (typeof incomingData[fieldName] === 'object' &&
                  incomingData[fieldName] !== null &&
                  incomingData[fieldName].id) ||
                ''

              const oldID: string =
                (typeof result[fieldName] === 'string' && result[fieldName]) ||
                (typeof result[fieldName] === 'object' &&
                  result[fieldName] !== null &&
                  result[fieldName].id) ||
                ''

              // if the new value is different from the old value
              // populate the new value, otherwise leave it alone
              if (newID !== oldID) {
                // if the new value is not empty, populate it
                // otherwise set the value to null
                if (newID) {
                  populationPromises.push(
                    promise({
                      id: newID,
                      accessor: fieldName,
                      apiRoute,
                      collection: String(fieldSchema.relationTo),
                      depth,
                      ref: result as Record<string, unknown>,
                      serverURL,
                    }),
                  )
                } else {
                  result[fieldName] = null
                }
              }
            }
          }

          break

        default:
          result[fieldName] = incomingData[fieldName]
      }
    }
  })

  return null
}

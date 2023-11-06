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
  fieldSchema,
  incomingData,
  populationPromises,
  result,
  serverURL,
}: Args<T>): void => {
  fieldSchema.forEach((fieldJSON) => {
    if ('name' in fieldJSON && typeof fieldJSON.name === 'string') {
      const fieldName = fieldJSON.name

      switch (fieldJSON.type) {
        case 'array':
          if (Array.isArray(incomingData[fieldName])) {
            result[fieldName] = incomingData[fieldName].map((row, i) => {
              const hasExistingRow =
                Array.isArray(result[fieldName]) &&
                typeof result[fieldName][i] === 'object' &&
                result[fieldName][i] !== null

              const newRow = hasExistingRow ? { ...result[fieldName][i] } : {}

              traverseFields({
                apiRoute,
                depth,
                fieldSchema: fieldJSON.fields,
                incomingData: row,
                populationPromises,
                result: newRow,
                serverURL,
              })

              return newRow
            })
          }
          break

        case 'blocks':
          if (Array.isArray(incomingData[fieldName])) {
            result[fieldName] = incomingData[fieldName].map((incomingBlock, i) => {
              const incomingBlockJSON = fieldJSON.blocks[incomingBlock.blockType]

              // Compare the index and id to determine if this block already exists in the result
              // If so, we want to use the existing block as the base, otherwise take the incoming block
              // Either way, we will traverse the fields of the block to populate relationships
              const isExistingBlock =
                Array.isArray(result[fieldName]) &&
                typeof result[fieldName][i] === 'object' &&
                result[fieldName][i] !== null &&
                result[fieldName][i].id === incomingBlock.id

              const block = isExistingBlock ? result[fieldName][i] : incomingBlock

              traverseFields({
                apiRoute,
                depth,
                fieldSchema: incomingBlockJSON.fields,
                incomingData: incomingBlock,
                populationPromises,
                result: block,
                serverURL,
              })

              return block
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
            fieldSchema: fieldJSON.fields,
            incomingData: incomingData[fieldName] || {},
            populationPromises,
            result: result[fieldName],
            serverURL,
          })

          break

        case 'upload':
        case 'relationship':
          // Handle `hasMany` relationships
          if (fieldJSON.hasMany && Array.isArray(incomingData[fieldName])) {
            const oldValue = Array.isArray(result[fieldName]) ? [...result[fieldName]] : []

            // slice the array down to the new length
            // this is for when an item is removed from the array
            // we'll build up the array again with new values
            result[fieldName] = Array.isArray(result[fieldName])
              ? [...result[fieldName]].slice(0, incomingData[fieldName].length)
              : []

            incomingData[fieldName].forEach((incomingRelation, i) => {
              // Handle `hasMany` polymorphic
              if (Array.isArray(fieldJSON.relationTo)) {
                const oldID = oldValue[i]?.value?.id
                const oldRelation = oldValue[i]?.relationTo
                const newID = incomingRelation.value
                const newRelation = incomingRelation.relationTo

                if (oldID !== newID || oldRelation !== newRelation) {
                  // if the field doesn't exist on the result, create it
                  // the value will be populated later
                  if (!result[fieldName][i]) {
                    result[fieldName][i] = {
                      relationTo: newRelation,
                    }
                  }

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
                const oldID = oldValue[i]?.id

                if (oldID !== incomingRelation) {
                  populationPromises.push(
                    promise({
                      id: incomingRelation,
                      accessor: i,
                      apiRoute,
                      collection: String(fieldJSON.relationTo),
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
            if (Array.isArray(fieldJSON.relationTo)) {
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
                  // if the field doesn't exist on the result, create it
                  // the value will be populated later
                  if (!result[fieldName]) {
                    result[fieldName] = {
                      relationTo: newRelation,
                    }
                  }

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
                      collection: String(fieldJSON.relationTo),
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

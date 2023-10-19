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
          if (fieldJSON.hasMany && Array.isArray(incomingData[fieldName])) {
            const existingValue = Array.isArray(result[fieldName]) ? [...result[fieldName]] : []
            result[fieldName] = Array.isArray(result[fieldName])
              ? [...result[fieldName]].slice(0, incomingData[fieldName].length)
              : []

            incomingData[fieldName].forEach((relation, i) => {
              // Handle `hasMany` polymorphic
              if (Array.isArray(fieldJSON.relationTo)) {
                const existingID = existingValue[i]?.value?.id

                if (
                  existingID !== relation.value ||
                  existingValue[i]?.relationTo !== relation.relationTo
                ) {
                  result[fieldName][i] = {
                    relationTo: relation.relationTo,
                  }

                  populationPromises.push(
                    promise({
                      id: relation.value,
                      accessor: 'value',
                      apiRoute,
                      collection: relation.relationTo,
                      depth,
                      ref: result[fieldName][i],
                      serverURL,
                    }),
                  )
                }
              } else {
                // Handle `hasMany` monomorphic
                const existingID = existingValue[i]?.id

                if (existingID !== relation) {
                  populationPromises.push(
                    promise({
                      id: relation,
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
                typeof incomingData[fieldName] === 'object' && incomingData[fieldName] !== null
              const hasOldValue =
                typeof result[fieldName] === 'object' && result[fieldName] !== null

              const newValue = hasNewValue ? incomingData[fieldName].value : ''
              const newRelation = hasNewValue ? incomingData[fieldName].relationTo : ''

              const oldValue = hasOldValue ? result[fieldName].value : ''
              const oldRelation = hasOldValue ? result[fieldName].relationTo : ''

              if (newValue !== oldValue || newRelation !== oldRelation) {
                if (newValue) {
                  if (!result[fieldName]) {
                    result[fieldName] = {
                      relationTo: newRelation,
                    }
                  }

                  populationPromises.push(
                    promise({
                      id: newValue,
                      accessor: 'value',
                      apiRoute,
                      collection: newRelation,
                      depth,
                      ref: result[fieldName],
                      serverURL,
                    }),
                  )
                }
              } else {
                result[fieldName] = null
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

              if (newID !== oldID) {
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

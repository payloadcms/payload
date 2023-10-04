import { promise } from './promise'

type Args<T> = {
  apiRoute?: string
  depth: number
  fieldSchema: Record<string, unknown>[]
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
  fieldSchema.forEach((field) => {
    if ('name' in field && typeof field.name === 'string') {
      // TODO: type this
      const fieldName = field.name

      switch (field.type) {
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
                fieldSchema: field.fields as Record<string, unknown>[], // TODO: type this
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
            result[fieldName] = incomingData[fieldName].map((row, i) => {
              const matchedBlock = field.blocks[row.blockType]

              const hasExistingRow =
                Array.isArray(result[fieldName]) &&
                typeof result[fieldName][i] === 'object' &&
                result[fieldName][i] !== null &&
                result[fieldName][i].blockType === row.blockType

              const newRow = hasExistingRow
                ? { ...result[fieldName][i] }
                : {
                    blockType: matchedBlock.slug,
                  }

              traverseFields({
                apiRoute,
                depth,
                fieldSchema: matchedBlock.fields as Record<string, unknown>[], // TODO: type this
                incomingData: row,
                populationPromises,
                result: newRow,
                serverURL,
              })

              return newRow
            })
          }
          break

        case 'tab':
        case 'group':
          if (!result[fieldName]) {
            result[fieldName] = {}
          }

          traverseFields({
            apiRoute,
            depth,
            fieldSchema: field.fields as Record<string, unknown>[], // TODO: type this
            incomingData: incomingData[fieldName] || {},
            populationPromises,
            result: result[fieldName],
            serverURL,
          })

          break

        case 'upload':
        case 'relationship':
          if (field.hasMany && Array.isArray(incomingData[fieldName])) {
            const existingValue = Array.isArray(result[fieldName]) ? [...result[fieldName]] : []
            result[fieldName] = []

            incomingData[fieldName].forEach((relation, i) => {
              if (typeof existingValue[i] === 'object' && existingValue[i] !== null) {
                // Handle `hasMany` polymorphic
                if (Array.isArray(field.relationTo)) {
                  if (typeof existingValue[i].value === 'object') {
                    const existingID = existingValue[i].value.id

                    if (
                      existingID !== relation.value ||
                      existingValue[i].relationTo !== relation.relationTo
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
                  }
                } else {
                  // Handle `hasMany` singular
                  const existingID = existingValue[i].id

                  if (existingID !== relation) {
                    populationPromises.push(
                      promise({
                        id: relation,
                        accessor: i,
                        apiRoute,
                        collection: String(field.relationTo),
                        depth,
                        ref: result[fieldName],
                        serverURL,
                      }),
                    )
                  }
                }
              } else {
                // TODO: populate new ID
              }
            })
          } else {
            // Handle `hasOne` polymorphic
            if (Array.isArray(field.relationTo)) {
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
              const hasNewValue =
                typeof incomingData[fieldName] === 'object' && incomingData[fieldName] !== null
              const hasOldValue =
                typeof result[fieldName] === 'object' && result[fieldName] !== null

              const newValue = hasNewValue ? incomingData[fieldName].value : ''

              const oldValue = hasOldValue ? result[fieldName].value : ''

              if (newValue !== oldValue) {
                if (newValue) {
                  populationPromises.push(
                    promise({
                      id: newValue,
                      accessor: fieldName,
                      apiRoute,
                      collection: String(field.relationTo),
                      depth,
                      ref: result as Record<string, unknown>,
                      serverURL,
                    }),
                  )
                }
              } else {
                result[fieldName] = null
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

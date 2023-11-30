import type { PaginatedDocs } from 'payload/database'
import type { fieldSchemaToJSON } from 'payload/utilities'

import type { PopulationsByCollection, UpdatedDocument } from './types'

import { traverseFields } from './traverseFields'

export const mergeData = async <T>(args: {
  apiRoute?: string
  depth?: number
  externallyUpdatedRelationship?: UpdatedDocument
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: Partial<T>
  initialData: T
  returnNumberOfRequests?: boolean
  serverURL: string
}): Promise<
  T & {
    _numberOfRequests?: number
  }
> => {
  const {
    apiRoute,
    depth,
    externallyUpdatedRelationship,
    fieldSchema,
    incomingData,
    initialData,
    returnNumberOfRequests,
    serverURL,
  } = args

  const result = { ...initialData }

  const populationsByCollection: PopulationsByCollection = {}

  traverseFields({
    externallyUpdatedRelationship,
    fieldSchema,
    incomingData,
    populationsByCollection,
    result,
  })

  await Promise.all(
    Object.entries(populationsByCollection).map(async ([collection, populations]) => {
      const ids = new Set(populations.map(({ id }) => id))
      const url = `${serverURL}${
        apiRoute || '/api'
      }/${collection}?depth=${depth}&where[id][in]=${Array.from(ids).join(',')}`

      let res: PaginatedDocs

      try {
        res = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((res) => res.json())

        if (res?.docs?.length > 0) {
          res.docs.forEach((doc) => {
            populationsByCollection[collection].forEach((population) => {
              if (population.id === doc.id) {
                population.ref[population.accessor] = doc
              }
            })
          })
        }
      } catch (err) {
        console.error(err) // eslint-disable-line no-console
      }
    }),
  )

  return {
    ...result,
    ...(returnNumberOfRequests
      ? { _numberOfRequests: Object.keys(populationsByCollection).length }
      : {}),
  }
}

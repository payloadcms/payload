import type { PaginatedDocs } from 'payload/database'
import type { fieldSchemaToJSON } from 'payload/utilities'

import type { PopulationsByCollection, RecentUpdate } from './types'

import { traverseFields } from './traverseFields'

export const mergeData = async <T>(args: {
  apiRoute?: string
  depth?: number
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: Partial<T>
  initialData: T
  mostRecentUpdate?: RecentUpdate
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
    fieldSchema,
    incomingData,
    initialData,
    mostRecentUpdate,
    returnNumberOfRequests,
    serverURL,
  } = args

  const result = { ...initialData }

  const populationsByCollection: PopulationsByCollection = {}

  traverseFields({
    fieldSchema,
    incomingData,
    mostRecentUpdate,
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

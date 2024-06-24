import type { PaginatedDocs } from 'payload'
import type { fieldSchemaToJSON } from 'payload/shared'

import type { PopulationsByCollection, UpdatedDocument } from './types.js'

import { traverseFields } from './traverseFields.js'

const defaultRequestHandler = ({ apiPath, endpoint, serverURL }) => {
  const url = `${serverURL}${apiPath}/${endpoint}`
  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const mergeData = async <T>(args: {
  apiRoute?: string
  collectionPopulationRequestHandler?: ({
    apiPath,
    endpoint,
    serverURL,
  }: {
    apiPath: string
    endpoint: string
    serverURL: string
  }) => Promise<Response>
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
      let res: PaginatedDocs

      const ids = new Set(populations.map(({ id }) => id))
      const requestHandler = args.collectionPopulationRequestHandler || defaultRequestHandler

      try {
        res = await requestHandler({
          apiPath: apiRoute || '/api',
          endpoint: `${collection}?depth=${depth}&where[id][in]=${Array.from(ids).join(',')}`,
          serverURL,
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

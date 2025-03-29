import type { DocumentEvent, FieldSchemaJSON, PaginatedDocs } from 'payload'

import type { PopulationsByCollection } from './types.js'

import { traverseFields } from './traverseFields.js'

const defaultRequestHandler = ({
  apiPath,
  endpoint,
  serverURL,
}: {
  apiPath: string
  endpoint: string
  serverURL: string
}) => {
  const url = `${serverURL}${apiPath}/${endpoint}`
  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// Relationships are only updated when their `id` or `relationTo` changes, by comparing the old and new values
// This needs to also happen when locale changes, except this is not not part of the API response
// Instead, we keep track of the old locale ourselves and trigger a re-population when it changes
let prevLocale: string | undefined

export const mergeData = async <T extends Record<string, any>>(args: {
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
  externallyUpdatedRelationship?: DocumentEvent
  fieldSchema: FieldSchemaJSON
  incomingData: Partial<T>
  initialData: T
  locale?: string
  returnNumberOfRequests?: boolean
  serverURL: string
}): Promise<
  {
    _numberOfRequests?: number
  } & T
> => {
  const {
    apiRoute,
    depth,
    externallyUpdatedRelationship,
    fieldSchema,
    incomingData,
    initialData,
    locale,
    returnNumberOfRequests,
    serverURL,
  } = args

  const result = { ...initialData }

  const populationsByCollection: PopulationsByCollection = {}

  traverseFields({
    externallyUpdatedRelationship,
    fieldSchema,
    incomingData,
    localeChanged: prevLocale !== locale,
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
          endpoint: encodeURI(
            `${collection}?depth=${depth}&where[id][in]=${Array.from(ids).join(',')}${locale ? `&locale=${locale}` : ''}`,
          ),
          serverURL,
        }).then((res) => res.json())

        if (res?.docs?.length > 0) {
          res.docs.forEach((doc) => {
            populationsByCollection[collection]?.forEach((population) => {
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

  prevLocale = locale

  return {
    ...result,
    ...(returnNumberOfRequests
      ? { _numberOfRequests: Object.keys(populationsByCollection).length }
      : {}),
  }
}

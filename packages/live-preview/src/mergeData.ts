import type { FieldSchemaJSON } from 'payload'

import type { CollectionPopulationRequestHandler } from './types.js'

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

export const mergeData = async <T extends Record<string, any>>(args: {
  apiRoute?: string
  /**
   * @deprecated Use `requestHandler` instead
   */
  collectionPopulationRequestHandler?: CollectionPopulationRequestHandler
  collectionSlug?: string
  depth?: number
  fieldSchema: FieldSchemaJSON
  globalSlug?: string
  incomingData: Partial<T>
  initialData: T
  locale?: string
  requestHandler?: CollectionPopulationRequestHandler
  returnNumberOfRequests?: boolean
  serverURL: string
}): Promise<
  {
    _numberOfRequests?: number
  } & T
> => {
  console.log('ARGS', args)
  const {
    apiRoute,
    collectionSlug,
    depth,
    fieldSchema,
    globalSlug,
    incomingData,
    initialData,
    locale,
    returnNumberOfRequests,
    serverURL,
  } = args

  const requestHandler =
    args.collectionPopulationRequestHandler || args.requestHandler || defaultRequestHandler

  // TODO: Use get-as-post to pass data
  const result = await requestHandler({
    apiPath: apiRoute || '/api',
    endpoint: encodeURI(
      `${collectionSlug ?? globalSlug}${collectionSlug ? `/${initialData.id}` : ''}?depth=${depth}${locale ? `&locale=${locale}` : ''}&data=${JSON.stringify(incomingData)}`,
    ),
    serverURL,
  }).then((res) => res.json())

  return {
    ...result,
    ...(returnNumberOfRequests ? { _numberOfRequests: 1 } : {}),
  }
}

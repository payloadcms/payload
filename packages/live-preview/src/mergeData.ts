import type { FieldSchemaJSON } from 'payload'

import type { CollectionPopulationRequestHandler } from './types.js'

const defaultRequestHandler: CollectionPopulationRequestHandler = ({
  apiPath,
  data,
  endpoint,
  postEndpoint,
  serverURL,
}) => {
  const url = `${serverURL}${apiPath}/${data && postEndpoint ? postEndpoint : endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (data) {
    headers['X-Payload-HTTP-Method-Override'] = 'GET'
  }

  return fetch(url, {
    body: JSON.stringify(data),
    credentials: 'include',
    headers,
    method: data ? 'POST' : 'GET',
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

  const result = await requestHandler({
    apiPath: apiRoute || '/api',
    data: {
      data: incomingData,
      depth,
      locale,
    },
    endpoint: encodeURI(
      `${collectionSlug ?? globalSlug}${collectionSlug ? `/${initialData.id}` : ''}?depth=${depth}${locale ? `&locale=${locale}` : ''}&data=${JSON.stringify(incomingData)}`,
    ),
    postEndpoint: encodeURI(
      `${collectionSlug ?? globalSlug}${collectionSlug ? `/${initialData.id}` : ''}`,
    ),
    serverURL,
  }).then((res) => res.json())

  return {
    ...result,
    ...(returnNumberOfRequests ? { _numberOfRequests: 1 } : {}),
  }
}

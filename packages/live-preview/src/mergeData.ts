import type { CollectionPopulationRequestHandler } from './types.js'

const defaultRequestHandler: CollectionPopulationRequestHandler = ({
  apiPath,
  data,
  endpoint,
  serverURL,
}) => {
  const url = `${serverURL}${apiPath}/${endpoint}`

  return fetch(url, {
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Payload-HTTP-Method-Override': 'GET',
    },
    method: 'POST',
  })
}

export const mergeData = async <T extends Record<string, any>>(args: {
  apiRoute?: string
  collectionSlug?: string
  depth?: number
  globalSlug?: string
  incomingData: Partial<T>
  initialData: T
  locale?: string
  requestHandler?: CollectionPopulationRequestHandler
  serverURL: string
}): Promise<T> => {
  const {
    apiRoute,
    collectionSlug,
    depth,
    globalSlug,
    incomingData,
    initialData,
    locale,
    serverURL,
  } = args

  const requestHandler = args.requestHandler || defaultRequestHandler

  const result = await requestHandler({
    apiPath: apiRoute || '/api',
    data: {
      data: incomingData,
      depth,
      // The incoming data already has had its locales flattened
      flattenLocales: false,
      locale,
    },
    endpoint: encodeURI(
      `${globalSlug ? 'globals/' : ''}${collectionSlug ?? globalSlug}${collectionSlug ? `/${initialData.id}` : ''}`,
    ),
    serverURL,
  }).then((res) => res.json())

  return result
}

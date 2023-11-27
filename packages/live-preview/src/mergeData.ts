import type { fieldSchemaToJSON } from 'payload/utilities'

import { traverseFields } from './traverseFields'

export const mergeData = async <T>(args: {
  apiRoute?: string
  cache?: Map<string, unknown>
  depth?: number
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
    cache,
    depth,
    fieldSchema,
    incomingData,
    initialData,
    returnNumberOfRequests,
    serverURL,
  } = args

  const result = { ...initialData }

  const populationPromises: Promise<void>[] = []

  traverseFields({
    apiRoute,
    cache,
    depth,
    fieldSchema,
    incomingData,
    populationPromises,
    result,
    serverURL,
  })

  await Promise.all(populationPromises)

  return {
    ...result,
    ...(returnNumberOfRequests ? { _numberOfRequests: populationPromises.length } : {}),
  }
}

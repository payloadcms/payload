import type { fieldSchemaToJSON } from 'payload/utilities'

import { traverseFields } from './traverseFields'

export const mergeData = async <T>(args: {
  apiRoute?: string
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
    depth,
    fieldSchema,
    incomingData,
    initialData,
    returnNumberOfRequests,
    serverURL,
  } = args

  const result = { ...initialData }

  const populationPromises: Promise<void>[] = []
  const cache = new Map()

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

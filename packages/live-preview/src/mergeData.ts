import type { MergeLiveDataArgs } from './types'

import { traverseFields } from './traverseFields'

export const mergeData = async <T>({
  apiRoute,
  depth,
  fieldSchema,
  incomingData,
  initialData,
  returnNumberOfRequests,
  serverURL,
}: MergeLiveDataArgs<T>): Promise<
  T & {
    _numberOfRequests?: number
  }
> => {
  const result = { ...initialData }

  const populationPromises: Promise<void>[] = []

  traverseFields({
    apiRoute,
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

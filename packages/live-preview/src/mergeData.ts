import type { fieldSchemaToJSON } from 'payload/utilities'

import { traverseFields } from './traverseFields'

export type MergeLiveDataArgs<T> = {
  apiRoute?: string
  depth: number
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: Partial<T>
  initialData: T
  returnNumberOfRequests?: boolean
  serverURL: string
}

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

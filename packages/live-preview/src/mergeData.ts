import type { fieldSchemaToJSON } from 'payload/utilities'

import { traverseFields } from './traverseFields'

export type MergeLiveDataArgs<T> = {
  apiRoute?: string
  depth: number
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: Partial<T>
  initialData: T
  serverURL: string
}

export const mergeData = async <T>({
  apiRoute,
  depth,
  fieldSchema,
  incomingData,
  initialData,
  serverURL,
}: MergeLiveDataArgs<T>): Promise<T> => {
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

  return result
}

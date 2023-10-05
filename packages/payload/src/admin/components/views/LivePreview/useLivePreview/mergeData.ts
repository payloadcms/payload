import { traverseFields } from './traverseFields'

export type MergeLiveDataArgs<T> = {
  apiRoute?: string
  depth: number
  existingData: T
  fieldSchema: Record<string, unknown>[]
  incomingData: T
  serverURL: string
}

export const mergeLivePreviewData = async <T>({
  apiRoute,
  depth,
  existingData,
  fieldSchema,
  incomingData,
  serverURL,
}: MergeLiveDataArgs<T>): Promise<T> => {
  const result = { ...existingData }

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

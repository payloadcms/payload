import { promise } from './promise'

export const traverseRichText = ({
  apiRoute,
  cache,
  depth,
  incomingData,
  populationPromises,
  result,
  serverURL,
}: {
  apiRoute: string
  cache?: Map<string, unknown>
  depth: number
  incomingData: any
  populationPromises: Promise<void>[]
  result: any
  serverURL: string
}): any => {
  if (Array.isArray(incomingData)) {
    result = incomingData.map((incomingRow) =>
      traverseRichText({
        apiRoute,
        cache,
        depth,
        incomingData: incomingRow,
        populationPromises,
        result,
        serverURL,
      }),
    )
  } else if (typeof incomingData === 'object' && incomingData !== null) {
    result = incomingData

    if ('relationTo' in incomingData && 'value' in incomingData && incomingData.value) {
      const cacheKey = `${incomingData.relationTo}_${incomingData.value}`
      const cachedValue = cache && cache.get(cacheKey)

      if (cachedValue) {
        result = cachedValue
      } else {
        populationPromises.push(
          promise({
            id: typeof incomingData.value === 'object' ? incomingData.value.id : incomingData.value,
            accessor: 'value',
            apiRoute,
            cache,
            cacheKey,
            collection: String(incomingData.relationTo),
            depth,
            ref: result,
            serverURL,
          }),
        )
      }
    } else {
      result = {}

      Object.keys(incomingData).forEach((key) => {
        result[key] = traverseRichText({
          apiRoute,
          cache,
          depth,
          incomingData: incomingData[key],
          populationPromises,
          result,
          serverURL,
        })
      })
    }
  } else {
    result = incomingData
  }

  return result
}

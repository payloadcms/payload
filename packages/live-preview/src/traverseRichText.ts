import { promise } from './promise'

export const traverseRichText = ({
  apiRoute,
  depth,
  incomingData,
  populationPromises,
  result,
  serverURL,
}: {
  apiRoute: string
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
      populationPromises.push(
        promise({
          id: typeof incomingData.value === 'object' ? incomingData.value.id : incomingData.value,
          accessor: 'value',
          apiRoute,
          collection: String(incomingData.relationTo),
          depth,
          ref: result,
          serverURL,
        }),
      )
    } else {
      result = {}

      Object.keys(incomingData).forEach((key) => {
        result[key] = traverseRichText({
          apiRoute,
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

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
  populationPromises: Promise<any>[]
  result: any
  serverURL: string
}): any => {
  if (Array.isArray(incomingData)) {
    if (!result) {
      result = []
    }

    result = incomingData.map((item, index) => {
      if (!result[index]) {
        result[index] = item
      }

      return traverseRichText({
        apiRoute,
        depth,
        incomingData: item,
        populationPromises,
        result: result[index],
        serverURL,
      })
    })
  } else if (incomingData && typeof incomingData === 'object') {
    if (!result) {
      result = {}
    }

    Object.keys(incomingData).forEach((key) => {
      if (!result[key]) {
        result[key] = incomingData[key]
      }

      const isRelationship = key === 'value' && 'relationTo' in incomingData

      if (isRelationship) {
        const needsPopulation = !result.value || typeof result.value !== 'object'

        if (needsPopulation) {
          populationPromises.push(
            promise({
              id: incomingData[key],
              accessor: 'value',
              apiRoute,
              collection: incomingData.relationTo,
              depth,
              ref: result,
              serverURL,
            }),
          )
        }
      } else {
        result[key] = traverseRichText({
          apiRoute,
          depth,
          incomingData: incomingData[key],
          populationPromises,
          result: result[key],
          serverURL,
        })
      }
    })
  } else {
    result = incomingData
  }

  return result
}

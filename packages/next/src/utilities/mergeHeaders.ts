const headersToJoin = ['set-cookie', 'warning', 'www-authenticate', 'proxy-authenticate', 'vary']

export function mergeHeaders(sourceHeaders: Headers, destinationHeaders: Headers): void {
  // Create a map to store combined headers
  const combinedHeaders = new Headers()

  // Add existing destination headers to the combined map
  destinationHeaders.forEach((value, key) => {
    combinedHeaders.set(key, value)
  })

  // Add source headers to the combined map, joining specific headers
  sourceHeaders.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (headersToJoin.includes(lowerKey)) {
      if (combinedHeaders.has(key)) {
        combinedHeaders.set(key, `${combinedHeaders.get(key)}, ${value}`)
      } else {
        combinedHeaders.set(key, value)
      }
    } else {
      combinedHeaders.set(key, value)
    }
  })

  // Clear the destination headers and set the combined headers
  destinationHeaders.forEach((_, key) => {
    destinationHeaders.delete(key)
  })
  combinedHeaders.forEach((value, key) => {
    destinationHeaders.append(key, value)
  })
}

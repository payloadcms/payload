export const mergeHeaders = (sourceHeaders: Headers, destinationHeaders: Headers): Headers => {
  // Create a new Headers object
  const combinedHeaders = new Headers(destinationHeaders)

  // Append sourceHeaders to combinedHeaders
  sourceHeaders.forEach((value, key) => {
    combinedHeaders.append(key, value)
  })

  return combinedHeaders
}

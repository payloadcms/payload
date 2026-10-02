export const decodeParams = <T extends Record<string, string | string[] | undefined>>({
  params,
}: {
  params: T
}): T => {
  const decodedParams: Record<string, string | string[] | undefined> = { ...params }

  for (const key of Object.keys(decodedParams)) {
    const value = decodedParams[key]

    if (Array.isArray(value)) {
      const decodedValues = new Array<string>(value.length)

      for (let index = 0; index < value.length; index++) {
        if (index in value) {
          const segment = value[index]

          decodedValues[index] = segment.includes('%') ? decodeURIComponent(segment) : segment
        }
      }

      decodedParams[key] = decodedValues
    } else if (typeof value === 'string' && value.includes('%')) {
      decodedParams[key] = decodeURIComponent(value)
    }
  }

  return decodedParams as T
}

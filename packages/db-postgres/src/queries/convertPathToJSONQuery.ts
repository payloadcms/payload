export const convertPathToJSONQuery = (path: string) => {
  const segments = path.split('.')
  segments.shift()

  return segments.reduce((res, segment, i) => {
    const formattedSegment = Number.isNaN(parseInt(segment)) ? `'${segment}'` : segment

    if (i + 1 === segments.length) return `${res}->>${formattedSegment}`
    return `${res}->${formattedSegment}`
  }, '')
}

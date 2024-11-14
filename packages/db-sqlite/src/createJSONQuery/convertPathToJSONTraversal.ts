export const convertPathToJSONTraversal = (incomingSegments: string[]): string => {
  const segments = [...incomingSegments]
  segments.shift()

  return segments.reduce((res, segment) => {
    const formattedSegment = Number.isNaN(parseInt(segment)) ? `'${segment}'` : segment
    return `${res}->>${formattedSegment}`
  }, '')
}

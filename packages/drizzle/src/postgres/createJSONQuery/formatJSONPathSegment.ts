export const formatJSONPathSegment = (segment: string) => {
  return Number.isNaN(parseInt(segment)) ? `'${segment}'` : segment
}

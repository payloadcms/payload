/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */
export const getQueryDraftsSort = (sort: string): string => {
  if (!sort) return sort

  return sort
    .split(',')
    .map((sortString) => {
      let direction = ''
      let orderBy = sortString
      if (sortString[0] === '-') {
        direction = '-'
        orderBy = sortString.substring(1)
      }
      return `${direction}version.${orderBy}`
    })
    .join(',')
}

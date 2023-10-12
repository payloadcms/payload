/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */
export const getQueryDraftsSort = (sort: string): string => {
  if (!sort) return sort

  let direction = ''
  let orderBy = sort

  if (sort[0] === '-') {
    direction = '-'
    orderBy = sort.substring(1)
  }

  return `${direction}version.${orderBy}`
}

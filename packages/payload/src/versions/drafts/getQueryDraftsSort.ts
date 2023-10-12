/**
 * Takes the incoming sort argument and prefixes it with `versions.` and preserves any `-` prefixes for descending order
 * @param sort
 */
export const getQueryDraftsSort = (sort: string): string => {
  let result = sort
  if (sort) {
    const direction = sort[0] === '-' ? '-' : ''
    result = `${direction}version.${direction.length === 1 ? sort.substring(1) : sort}`
  }
  return result
}

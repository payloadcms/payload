export const sanitizeSortParams = (sort: unknown): string[] | undefined => {
  if (typeof sort === 'string') {
    return sort.split(',')
  }

  if (Array.isArray(sort) && sort.every((value) => typeof value === 'string')) {
    return sort
  }

  return undefined
}

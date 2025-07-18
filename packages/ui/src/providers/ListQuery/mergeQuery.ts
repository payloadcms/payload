import type { ListQuery } from 'payload'

export const mergeQuery = (
  currentQuery: ListQuery,
  newQuery: ListQuery,
  options?: {
    defaults?: ListQuery
  },
): ListQuery => {
  let page = 'page' in newQuery ? newQuery.page : currentQuery?.page

  if ('where' in newQuery || 'search' in newQuery) {
    page = 1
  }

  const mergedQuery: ListQuery = {
    ...currentQuery,
    ...newQuery,
    columns: 'columns' in newQuery ? newQuery.columns : currentQuery.columns,
    groupBy:
      'groupBy' in newQuery
        ? newQuery.groupBy
        : (currentQuery?.groupBy ?? options?.defaults?.groupBy),
    limit: 'limit' in newQuery ? newQuery.limit : (currentQuery?.limit ?? options?.defaults?.limit),
    page,
    preset: 'preset' in newQuery ? newQuery.preset : currentQuery?.preset,
    search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
    sort:
      'sort' in newQuery
        ? newQuery.sort
        : ((currentQuery?.sort as string) ?? options?.defaults?.sort),
    where: 'where' in newQuery ? newQuery.where : currentQuery?.where,
  }

  return mergedQuery
}

import type { ListQuery } from '@ruya.sa/payload'

export const mergeQuery = (
  currentQuery: ListQuery,
  newQuery: ListQuery,
  options?: {
    defaults?: ListQuery
  },
): ListQuery => {
  let page = 'page' in newQuery ? newQuery.page : currentQuery?.page

  const shouldResetPage = ['where', 'search', 'groupBy']?.some(
    (key) => key in newQuery && !['limit', 'page'].includes(key),
  )

  if (shouldResetPage) {
    page = 1
  }

  const shouldResetQueryByGroup = ['where', 'search', 'page', 'limit', 'groupBy', 'sort'].some(
    (key) => key in newQuery,
  )

  let mergedQueryByGroup = undefined

  if (!shouldResetQueryByGroup) {
    // Deeply merge queryByGroup so we can send a partial update for a specific group
    mergedQueryByGroup = {
      ...(currentQuery?.queryByGroup || {}),
      ...(newQuery.queryByGroup
        ? Object.fromEntries(
            Object.entries(newQuery.queryByGroup).map(([key, value]) => [
              key,
              {
                ...(currentQuery?.queryByGroup?.[key] || {}),
                ...value,
              },
            ]),
          )
        : {}),
    }
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
    queryByGroup: mergedQueryByGroup,
    search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
    sort:
      'sort' in newQuery
        ? newQuery.sort
        : ((currentQuery?.sort as string) ?? options?.defaults?.sort),
    where: 'where' in newQuery ? newQuery.where : currentQuery?.where,
  }

  return mergedQuery
}

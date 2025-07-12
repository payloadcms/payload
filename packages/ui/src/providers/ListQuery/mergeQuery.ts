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
    page = '1'
  }

  // Deeply merge queryByGroup so we can send a partial update for a specific group
  const mergedQueryByGroup = {
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

  const mergedQuery: ListQuery = {
    ...currentQuery,
    ...newQuery,
    columns: 'columns' in newQuery ? newQuery.columns : currentQuery.columns,
    groupBy:
      'groupBy' in newQuery
        ? newQuery.groupBy
        : (currentQuery?.groupBy ?? options?.defaults?.groupBy),
    limit:
      'limit' in newQuery
        ? newQuery.limit
        : (currentQuery?.limit ?? String(options?.defaults?.limit)),
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

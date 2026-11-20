import type { ListQuery } from 'payload'

import { combineWhereConstraints } from 'payload/shared'

export function getNestedDocsRootWhere({
  documentLayout,
  parentFieldName,
  query,
  where,
}: {
  documentLayout: string | undefined
  parentFieldName: string
  query: ListQuery
  where: ReturnType<typeof combineWhereConstraints>
}): ReturnType<typeof combineWhereConstraints> | undefined {
  if (
    documentLayout !== 'tree' ||
    query.groupBy ||
    query.search ||
    (query.where && Object.keys(query.where).length > 0)
  ) {
    return undefined
  }

  return combineWhereConstraints([
    where,
    {
      or: [{ [parentFieldName]: { exists: false } }, { [parentFieldName]: { equals: null } }],
    },
  ])
}

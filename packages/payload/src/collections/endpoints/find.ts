import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { findOperation } from '../operations/find.js'

export const findHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const { depth, draft, joins, limit, page, pagination, populate, select, sort, trash, where } =
    parseParams(req.query)

  // Handle filterByCollections for hierarchy collections
  let finalWhere: undefined | Where = where
  const filterByCollections = req.query.filterByCollections

  if (filterByCollections) {
    const hierarchyConfig = collection.config.hierarchy

    if (hierarchyConfig && hierarchyConfig.collectionSpecific) {
      // Parse filterByCollections (may be array or comma-separated string)
      const filters = Array.isArray(filterByCollections)
        ? filterByCollections
        : String(filterByCollections).split(',').filter(Boolean)

      // Exclude hierarchy collection itself (folders always show folders)
      const filteredTypes = filters.filter((t) => t !== collection.config.slug)

      if (filteredTypes.length > 0) {
        const typeFieldName = hierarchyConfig.collectionSpecific.fieldName
        const typeCondition: Where = {
          or: [
            { [typeFieldName]: { in: filteredTypes } },
            { [typeFieldName]: { exists: false } }, // Include unrestricted folders
          ],
        }

        // Combine with existing where clause
        finalWhere = where ? { and: [where, typeCondition] } : typeCondition
      }
    }
  }

  const result = await findOperation({
    collection,
    depth,
    draft,
    joins,
    limit,
    page,
    pagination,
    populate,
    req,
    select,
    sort,
    trash,
    where: finalWhere,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}

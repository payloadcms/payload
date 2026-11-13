import type { Endpoint } from '../../config/types.js'

import { APIError } from '../../errors/APIError.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { getHierarchyContents } from '../getHierarchyContents.js'

/** Collection-scoped transport; all source mappings and filters are resolved on the server. */
export const hierarchyContentsEndpoint: Endpoint = {
  handler: async (req) => {
    const collection = getRequestCollection(req)
    const { limit, page, parentID, search, source } = req.query

    if (
      [limit, page, parentID, search, source].some(
        (value) => value !== undefined && typeof value !== 'string',
      ) ||
      (limit !== undefined && !/^\d+$/.test(limit as string)) ||
      (page !== undefined && !/^\d+$/.test(page as string))
    ) {
      throw new APIError('Invalid folder contents query.', 400)
    }

    const result = await getHierarchyContents({
      collectionSlug: collection.config.slug,
      limit: limit === undefined ? undefined : Number(limit),
      page: page === undefined ? undefined : Number(page),
      parentID: (parentID as string | undefined) ?? null,
      req,
      search: search as string | undefined,
      source: source as string | undefined,
    })

    return Response.json(result, {
      headers: headersWithCors({ headers: new Headers(), req }),
    })
  },
  method: 'get',
  path: '/hierarchy-contents',
}

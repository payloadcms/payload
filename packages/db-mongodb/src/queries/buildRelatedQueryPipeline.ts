import type { PipelineStage } from 'mongoose'

import { APIError } from 'payload'

/** Keep geospatial filtering first, before branch visibility introduces lookups. */
export const buildRelatedQueryPipeline = ({
  branchVisibility,
  query,
}: {
  branchVisibility: PipelineStage[]
  query: Record<string, unknown>
}): PipelineStage[] => {
  let geoNear: PipelineStage.GeoNear['$geoNear'] | undefined

  const extractNear = ({ query }: { query: Record<string, unknown> }): Record<string, unknown> => {
    const remainingQuery: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(query)) {
      if (key === '$and' && Array.isArray(value)) {
        remainingQuery[key] = value.map((query) => extractNear({ query }))
      } else if (value && typeof value === 'object' && '$near' in value) {
        if (geoNear) {
          throw new APIError('Only one near constraint is supported per related query.', 400)
        }

        const { $near, ...remainingOperators } = value
        const near = $near as {
          $geometry: { coordinates: [number, number]; type: 'Point' }
          $maxDistance?: number
          $minDistance?: number
        }

        geoNear = {
          distanceField: '__payloadRelatedDistance',
          key,
          near: near.$geometry,
          spherical: true,
          ...(near.$maxDistance !== undefined ? { maxDistance: near.$maxDistance } : {}),
          ...(near.$minDistance !== undefined ? { minDistance: near.$minDistance } : {}),
        }

        if (Object.keys(remainingOperators).length) {
          remainingQuery[key] = remainingOperators
        }
      } else {
        remainingQuery[key] = value
      }
    }

    return remainingQuery
  }

  // MongoDB permits $near at the top level or in $and, but not inside $or/$nor.
  // Leave those unsupported forms intact so MongoDB still rejects invalid queries.
  const remainingQuery = extractNear({ query })

  return [
    geoNear ? { $geoNear: { ...geoNear, query: remainingQuery } } : { $match: query },
    ...branchVisibility,
  ]
}

import type { Model, PipelineStage } from 'mongoose'

import { randomUUID } from 'node:crypto'
import { APIError } from 'payload'

/** $near cannot appear in aggregation $match or countDocuments. Keep session-bound reads native with $geoNear first. */
export const buildSnapshotNearStages = ({
  Model,
  query,
}: {
  Model: Model<any>
  query: Record<string, unknown>
}): null | PipelineStage[] => {
  let near: { key: string; value: Record<string, unknown> } | undefined
  const remove = ({
    isConjunction = true,
    query,
  }: {
    isConjunction?: boolean
    query: Record<string, unknown>
  }): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(query).flatMap(([key, value]) => {
        if (['$and', '$nor', '$or'].includes(key) && Array.isArray(value)) {
          return [
            [
              key,
              value.map((child) =>
                remove({ isConjunction: isConjunction && key === '$and', query: child }),
              ),
            ],
          ]
        }
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          ('$near' in value || '$nearSphere' in value)
        ) {
          if (!isConjunction || near) {
            throw new APIError(
              'A snapshot near query requires one mandatory geospatial predicate.',
              400,
            )
          }
          const { $near, $nearSphere, ...remaining } = value as Record<string, unknown>
          const operand = $near ?? $nearSphere
          if (
            !operand ||
            typeof operand !== 'object' ||
            Array.isArray(operand) ||
            !('$geometry' in operand)
          ) {
            throw new APIError('Invalid snapshot near query.', 400)
          }
          near = { key, value: operand as Record<string, unknown> }
          return Object.keys(remaining).length ? [[key, remaining]] : []
        }
        return [[key, value]]
      }),
    )
  const remaining = remove({ query })
  if (!near) {
    return null
  }
  // Additional root keys can be preserved without appearing in the configured schema.
  let distanceField = `__payloadBranchNativeDistance_${randomUUID().replaceAll('-', '')}`
  while (Model.schema.path(distanceField)) {
    distanceField = `__payloadBranchNativeDistance_${randomUUID().replaceAll('-', '')}`
  }
  return [
    {
      $geoNear: {
        distanceField,
        key: near.key,
        near: near.value.$geometry as never,
        query: remaining,
        spherical: true,
        ...(near.value.$maxDistance !== undefined
          ? { maxDistance: Number(near.value.$maxDistance) }
          : {}),
        ...(near.value.$minDistance !== undefined
          ? { minDistance: Number(near.value.$minDistance) }
          : {}),
      },
    },
    { $unset: distanceField },
  ]
}

/** Native snapshot-safe history/draft counts share the same geospatial relation. */
export const countSnapshotDocuments = async ({
  Model,
  options,
  query,
}: {
  Model: Model<any>
  options?: Parameters<Model<any>['countDocuments']>[1]
  query: Record<string, unknown>
}): Promise<number> => {
  const near = options?.session ? buildSnapshotNearStages({ Model, query }) : null
  if (!near) {
    return Model.countDocuments(query, options)
  }
  const rows = await Model.aggregate([...near, { $count: 'totalDocs' }], {
    collation: options?.collation,
    session: options?.session,
  })
  return rows[0]?.totalDocs ?? 0
}

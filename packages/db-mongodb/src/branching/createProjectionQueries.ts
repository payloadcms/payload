import type { PipelineStage } from 'mongoose'
import type { BranchProjectionQueries, BranchProjectionQueryContext, FindArgs } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildProjectionFromSelect } from '../utilities/buildProjectionFromSelect.js'
import { getCollection } from '../utilities/getEntity.js'
import { getSession } from '../utilities/getSession.js'
import { transform } from '../utilities/transform.js'
import { buildProjectionQuery, projectionPathValues } from './buildProjectionQuery.js'

type Stage = Record<string, any>
type Args = { context: BranchProjectionQueryContext } & FindArgs

export const createProjectionQueries = ({
  adapter,
}: {
  adapter: MongooseAdapter
}): BranchProjectionQueries => ({
  count: async (args) => {
    const query = await buildProjectionQuery({ adapter, ...args })
    const rows = await aggregate({
      adapter,
      args,
      pipeline: [...query.stages, { $count: 'totalDocs' }],
      sourceCollection: query.sourceCollection,
    })

    return { totalDocs: rows[0]?.totalDocs ?? 0 }
  },
  find: async (args) => {
    const query = await buildProjectionQuery({ adapter, ...args })
    const { collectionConfig } = getCollection({ adapter, collectionSlug: args.collection })
    const docs: Stage[] = []
    const sorts: Record<string, -1 | 1> = {}
    const identityPath = collectionConfig.custom?.branchProjectionStorage
      ? '_branchProjection.logicalID'
      : '_id'
    const sort =
      args.sort ??
      collectionConfig.defaultSort ??
      (collectionConfig.timestamps ? '-createdAt' : identityPath)

    for (const item of typeof sort === 'string' ? [sort] : sort) {
      const direction = item.startsWith('-') ? -1 : 1
      const resolved = await query.resolvePath({ path: direction === -1 ? item.slice(1) : item })

      docs.push(...resolved.stages)
      sorts[resolved.path] = direction
    }

    if (!Object.hasOwn(sorts, identityPath)) {
      sorts[identityPath] = 1
    }

    docs.push({ $sort: sorts })
    const limit = args.limit ?? 0
    const page = args.page ?? 1
    const isPaginated = args.pagination !== false && limit > 0

    if (isPaginated && page > 1) {
      docs.push({ $skip: (page - 1) * limit })
    }
    if (limit > 0) {
      docs.push({ $limit: limit })
    }
    if (args.joins !== false) {
      docs.push(...(await query.buildJoins({ joins: args.joins })))
    }

    const projection = args.select
      ? buildProjectionFromSelect({
          adapter,
          fields: collectionConfig.flattenedFields,
          select: args.select,
        })
      : args.projection

    if (projection) {
      const isInclusion = Object.values(projection).some(Boolean)

      docs.push(
        isInclusion
          ? {
              $project: {
                ...Object.fromEntries(
                  Object.entries(projection).filter(
                    ([path]) => !path.startsWith('_branchProjection.'),
                  ),
                ),
                _id: 1,
                _branchProjection: 1,
              },
            }
          : {
              $project: Object.fromEntries(
                Object.entries(projection).filter(
                  ([path]) =>
                    path !== '_id' &&
                    path !== '_branchProjection' &&
                    !path.startsWith('_branchProjection.'),
                ),
              ),
            },
      )
    }

    const rows = await aggregate({
      adapter,
      args,
      pipeline: isPaginated
        ? [...query.stages, { $facet: { count: [{ $count: 'totalDocs' }], docs } }]
        : [...query.stages, ...docs],
      sourceCollection: query.sourceCollection,
    })
    const result = isPaginated ? (rows[0] ?? { count: [], docs: [] }) : { count: [], docs: rows }

    for (const doc of result.docs) {
      for (const key of Object.keys(doc)) {
        if (query.privateFields.has(key)) {
          delete doc[key]
        }
      }
    }

    transform({ adapter, data: result.docs, fields: collectionConfig.fields, operation: 'read' })

    return {
      ...paginate({
        limit,
        page,
        totalDocs: isPaginated ? (result.count[0]?.totalDocs ?? 0) : result.docs.length,
      }),
      docs: result.docs,
    }
  },
  findDistinct: async (args) => {
    const query = await buildProjectionQuery({ adapter, ...args })
    const value = await query.resolvePath({ path: args.field })
    const limit = args.limit ?? 0
    const page = args.page ?? 1
    const sort = args.sort ? (typeof args.sort === 'string' ? args.sort : args.sort[0]) : args.field
    const descending = sort?.startsWith('-') ?? false
    const sortPath = sort ? (descending ? sort.slice(1) : sort) : args.field
    const sortValue = await query.resolvePath({ path: sortPath })
    // eslint-disable-next-line perfectionist/sort-objects -- Mongo sort key order is requested value first, then deterministic identity.
    const values: Stage[] = [{ $sort: { _sort: descending ? -1 : 1, _id: 1 } }]

    if (limit > 0) {
      values.push({ $skip: (page - 1) * limit }, { $limit: limit })
    }

    const pipeline: Stage[] = [
      ...query.stages,
      ...value.stages,
      ...sortValue.stages,
      {
        $project: {
          __sort: `$${sortValue.path}`,
          __values: projectionPathValues({ path: value.path }),
        },
      },
      { $unwind: { path: '$__values', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$__values', null] }, _sort: { $max: '$__sort' } } },
      { $facet: { count: [{ $count: 'totalDocs' }], values } },
    ]
    const rows = await aggregate({
      adapter,
      args,
      pipeline,
      sourceCollection: query.sourceCollection,
    })
    const result = rows[0] ?? { count: [], values: [] }

    return {
      ...paginate({ limit, page, totalDocs: result.count[0]?.totalDocs ?? 0 }),
      values: result.values.map((item: any) => ({
        [args.field]: JSON.parse(JSON.stringify(item._id)),
      })),
    }
  },
})

const aggregate = async ({
  adapter,
  args,
  pipeline,
  sourceCollection,
}: {
  adapter: MongooseAdapter
  args: Pick<Args, 'collection' | 'locale' | 'req'>
  pipeline: Stage[]
  sourceCollection?: string
}): Promise<any[]> => {
  const { collectionConfig, Model } = getCollection({
    adapter,
    collectionSlug: sourceCollection ?? args.collection,
  })

  const localization = adapter.payload.config.localization
  const collation = adapter.collation
    ? {
        locale:
          args.locale && !['*', 'all'].includes(args.locale)
            ? args.locale
            : localization
              ? localization.defaultLocale
              : 'en',
        ...adapter.collation,
      }
    : undefined

  return Model.aggregate(pipeline as PipelineStage[], {
    collation,
    session: await getSession(adapter, args.req),
  })
}

const paginate = ({
  limit,
  page,
  totalDocs,
}: {
  limit: number
  page: number
  totalDocs: number
}) => {
  const totalPages = limit > 0 ? Math.ceil(totalDocs / limit) : 1
  const hasNextPage = limit > 0 && totalPages > page
  const hasPrevPage = limit > 0 && page > 1

  return {
    hasNextPage,
    hasPrevPage,
    limit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter: limit > 0 ? (page - 1) * limit + 1 : 1,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs,
    totalPages,
  }
}

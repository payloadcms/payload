import type { CollectionSlug, Config, SanitizedCollectionConfig, SanitizedConfig } from 'payload'

import { describe, beforeAll, it, expect } from 'vitest'

import { sanitizeConfig } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildJoinAggregation } from './buildJoinAggregation.js'

let config: SanitizedConfig
let stationsConfig: SanitizedCollectionConfig

// buildSortParam appends a `-createdAt` fallback tiebreaker, so a
// `defaultSort` of `['-featured', 'name']` must produce all three keys.
const expectedSortSpec = { featured: -1, name: 1, createdAt: -1 }

const getAdapter = (): MongooseAdapter => {
  const connectionsConfig = config.collections.find((c) => c.slug === 'connections')!

  return {
    collections: {
      connections: {
        buildQuery: async () => ({}),
        collection: { name: 'connections' },
      },
    },
    disableFallbackSort: false,
    payload: {
      collections: {
        connections: { config: connectionsConfig },
        stations: { config: stationsConfig },
      },
      config,
    },
    useJoinAggregations: true,
    versions: {},
  } as unknown as MongooseAdapter
}

const getLookup = (
  aggregation: Awaited<ReturnType<typeof buildJoinAggregation>>,
  as: string,
): { pipeline: Record<string, unknown>[] } => {
  const lookup = aggregation
    .filter((stage) => '$lookup' in stage)
    .map(
      (stage) =>
        (stage as { $lookup: { as: string; pipeline: Record<string, unknown>[] } }).$lookup,
    )
    .find((lookup) => lookup.as === as)

  expect(lookup).toBeDefined()

  return lookup!
}

describe('buildJoinAggregation multi-key sort', () => {
  beforeAll(() => {
    config = sanitizeConfig({
      collections: [
        {
          fields: [
            { name: 'name', type: 'text' },
            { name: 'featured', type: 'checkbox' },
            { name: 'station', relationTo: 'stations', type: 'relationship' },
          ],
          slug: 'connections',
        },
        {
          fields: [
            { name: 'title', type: 'text' },
            {
              collection: 'connections',
              defaultSort: ['-featured', 'name'],
              name: 'connectionsJoin',
              on: 'station',
              type: 'join',
            },
            {
              collection: ['connections'],
              defaultSort: ['-featured', 'name'],
              name: 'connectionsPolyJoin',
              on: 'station',
              type: 'join',
            },
          ],
          slug: 'stations',
        },
      ],
      secret: 'test-secret',
    } as Config)

    stationsConfig = config.collections.find((c) => c.slug === 'stations')!
  })

  it('should apply every key of a multi-key sort in the standard join $lookup pipeline', async () => {
    const aggregation = await buildJoinAggregation({
      adapter: getAdapter(),
      collection: 'stations' as CollectionSlug,
      collectionConfig: stationsConfig,
    })

    const lookup = getLookup(aggregation, 'connectionsJoin.docs')

    const sortStage = lookup.pipeline.find((stage) => '$sort' in stage) as {
      $sort: Record<string, 1 | -1>
    }

    expect(sortStage.$sort).toStrictEqual(expectedSortSpec)
  })

  it('should apply every key of a multi-key sort in the polymorphic join $sort, $project and $sortArray stages', async () => {
    const aggregation = await buildJoinAggregation({
      adapter: getAdapter(),
      collection: 'stations' as CollectionSlug,
      collectionConfig: stationsConfig,
    })

    const lookup = getLookup(aggregation, 'connectionsPolyJoin.docs.connections')

    const sortStage = lookup.pipeline.find((stage) => '$sort' in stage) as {
      $sort: Record<string, 1 | -1>
    }

    expect(sortStage.$sort).toStrictEqual(expectedSortSpec)

    const projectStage = lookup.pipeline.find((stage) => '$project' in stage) as {
      $project: Record<string, unknown>
    }

    // every sort key must be projected so that $sortArray can sort on it
    expect(projectStage.$project).toStrictEqual({
      createdAt: 1,
      featured: 1,
      name: 1,
      relationTo: 1,
      value: '$_id',
    })

    const sortArrayStage = aggregation.find(
      (stage) =>
        '$set' in stage &&
        (stage as { $set: Record<string, unknown> }).$set['connectionsPolyJoin.docs'] !== undefined,
    ) as { $set: Record<string, { $sortArray: { sortBy: Record<string, 1 | -1> } }> }

    expect(sortArrayStage.$set['connectionsPolyJoin.docs']!.$sortArray.sortBy).toStrictEqual(
      expectedSortSpec,
    )
  })
})

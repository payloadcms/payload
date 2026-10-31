import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Where } from 'payload'

import { Types } from 'mongoose'
import { branchChangesCollectionSlug } from 'payload'
import { expect } from 'vitest'

import { buildQuery } from '../../packages/db-mongodb/src/queries/buildQuery.js'
import { test } from '../__helpers/int/vitest.js'
import { childrenSlug, parentsSlug } from './shared.js'

const point = ({ longitude }: { longitude: number }) => ({
  type: 'Point',
  coordinates: [longitude, 0],
})

test.suite('Branch related near queries', { config: './config.ts', db: 'mongo' }, () => {
  for (const scenario of ['relationship', 'nested relationship', 'join', 'nested join'] as const) {
    test(`should preserve distance bounds and branch visibility for a ${scenario}`, async ({
      payload,
    }) => {
      const adapter = payload.db as MongooseAdapter
      const req = { branch: 'work', context: {}, payload }
      const children = adapter.collections[childrenSlug]
      const parents = adapter.collections[parentsSlug]
      const ids = Object.fromEntries(
        ['hidden', 'visible', 'deleted', 'fallback', 'too-close', 'wrong-title'].map((id) => [
          id,
          new Types.ObjectId(),
        ]),
      )

      await children.collection.createIndex({ location: '2dsphere' })
      await parents.collection.insertMany(
        ['hidden', 'visible', 'deleted', 'fallback', 'too-close', 'wrong-title'].map((id) => ({
          _id: ids[id],
          _branch: 'main',
          favorite: [id],
        })),
      )
      await children.collection.insertMany([
        {
          _id: 'hidden',
          _branch: 'main',
          owner: ids['hidden'],
          title: 'match',
          location: point({ longitude: 0.01 }),
        },
        {
          _id: 'hidden-shadow',
          _branchDocID: 'hidden',
          _branch: 'work',
          owner: ids['hidden'],
          title: 'match',
          location: point({ longitude: 10 }),
        },
        {
          _id: 'visible',
          _branch: 'main',
          owner: ids['visible'],
          title: 'match',
          location: point({ longitude: 10 }),
        },
        {
          _id: 'visible-shadow',
          _branchDocID: 'visible',
          _branch: 'work',
          owner: ids['visible'],
          title: 'match',
          location: point({ longitude: 0.01 }),
        },
        {
          _id: 'deleted',
          _branch: 'main',
          owner: ids['deleted'],
          title: 'match',
          location: point({ longitude: 0.01 }),
        },
        {
          _id: 'fallback',
          _branch: 'main',
          owner: ids['fallback'],
          title: 'match',
          location: point({ longitude: 0.02 }),
        },
        {
          _id: 'too-close',
          _branch: 'main',
          owner: ids['too-close'],
          title: 'match',
          location: point({ longitude: 0 }),
        },
        {
          _id: 'wrong-title',
          _branch: 'main',
          owner: ids['wrong-title'],
          title: 'other',
          location: point({ longitude: 0.01 }),
        },
      ])
      await adapter.collections[branchChangesCollectionSlug].collection.insertMany(
        ['hidden', 'visible', 'deleted'].map((id) => ({
          branch: 'work',
          collectionSlug: childrenSlug,
          documentID: id,
          entityType: 'collection',
          operation: id === 'deleted' ? 'delete' : 'update',
        })),
      )

      const relatedWhere: Where = {
        and: [{ location: { near: [0, 0, 5000, 500] } }, { title: { equals: 'match' } }],
      }
      const field = scenario.includes('join') ? 'children' : 'favorite'
      const where: Where = scenario.startsWith('nested')
        ? { [field]: { [field === 'children' ? 'contains' : 'equals']: relatedWhere } }
        : {
            and: [
              { [`${field}.location`]: { near: [0, 0, 5000, 500] } },
              { [`${field}.title`]: { equals: 'match' } },
            ],
          }
      const query = await buildQuery({
        adapter,
        branch: 'work',
        collectionSlug: parentsSlug,
        fields: payload.collections[parentsSlug].config.flattenedFields,
        locale: 'en',
        req,
        where,
      })
      const results = await parents.collection.find(query).toArray()

      expect(results.map(({ _id }) => String(_id)).sort()).toEqual(
        [String(ids.fallback), String(ids.visible)].sort(),
      )
    })
  }
})

import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { expect } from 'vitest'

import { buildJoinAggregation } from '../../packages/db-mongodb/src/utilities/buildJoinAggregation.js'
import { test } from '../__helpers/int/vitest.js'
import { childrenSlug, parentsSlug } from './shared.js'

test.suite('Branch aggregation join identity', { config: './config.ts', db: 'mongo' }, () => {
  for (const scenario of [
    { field: 'children', versions: false },
    { field: 'allChildren', versions: false },
    { field: 'localizedChildren', versions: false },
    { field: 'children', versions: true },
  ]) {
    test(`should correlate ${scenario.field} with the canonical ${scenario.versions ? 'draft' : 'document'} identity`, async ({
      payload,
    }) => {
      const adapter = payload.db as MongooseAdapter
      const req = { branch: 'work', context: {}, payload }
      const rootModel = scenario.versions
        ? adapter.versions[parentsSlug]
        : adapter.collections[parentsSlug]
      const childModel = scenario.versions
        ? adapter.versions[childrenSlug]
        : adapter.collections[childrenSlug]
      const child = {
        _id: 'child',
        _branch: 'main',
        owner: 'canonical',
        localizedOwner: { en: 'canonical', es: 'elsewhere' },
      }
      const root = scenario.versions
        ? {
            _id: 'version',
            parent: 'shadow',
            _branchParent: 'canonical',
            _branch: 'work',
            version: {},
          }
        : { _id: 'shadow', _branchDocID: 'canonical', _branch: 'work' }

      await rootModel.collection.insertOne(root)
      await childModel.collection.insertOne(
        scenario.versions
          ? { _id: 'child-version', parent: 'child', _branch: 'main', latest: true, version: child }
          : child,
      )

      const pipeline = await buildJoinAggregation({
        adapter,
        branch: 'work',
        collection: parentsSlug,
        collectionConfig: payload.collections[parentsSlug].config,
        joins: { [scenario.field]: { count: true } },
        locale: 'en',
        projection: { [scenario.versions ? `version.${scenario.field}` : scenario.field]: true },
        req,
        versions: scenario.versions,
      })
      const [result] = await rootModel.aggregate([{ $match: { _id: root._id } }, ...pipeline])
      const joined = (scenario.versions ? result.version : result)[scenario.field]
      const localizedJoin = scenario.field === 'localizedChildren' ? joined.en : joined

      expect(localizedJoin.docs).toEqual(
        scenario.field === 'allChildren'
          ? [{ _id: 'child', relationTo: childrenSlug, value: 'child' }]
          : ['child'],
      )
      expect(localizedJoin.totalDocs).toBe(1)
      expect(result._id).toBe(root._id)
      expect(result.__payloadJoinParentID).toBeUndefined()
    })
  }
})

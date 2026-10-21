/* eslint-disable payload/no-relative-monorepo-imports -- Untimed native proof for the opt-in bulk fixture. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { encodeBranchProjectionID } from '../../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import { queryBranchContent } from '../../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { test } from '../../__helpers/int/vitest.js'
import {
  buildPerformanceData,
  getPerformanceLogicalID,
  getPerformanceScenario,
  hasPerformanceOverride,
  performanceLocales,
  performanceSlug,
} from './scenarios.js'
import { seedBranchPerformance } from './seed.js'
import { verifyPerformanceSeed } from './verifySeed.js'

test.suite(
  'Opt-in native performance fixture parity',
  {
    config: './config.ts',
    db: (adapter) =>
      process.env.PAYLOAD_BRANCH_PERF === 'true' &&
      ['mongodb', 'postgres', 'sqlite'].includes(adapter),
  },
  () => {
    test('should preserve complete bulk cache bodies when rebuilt from native frozen versions', async ({
      payload,
    }) => {
      const scenario = { ...getPerformanceScenario(), documents: 200 }

      await seedBranchPerformance({ payload, scenario })
      expect(await verifyPerformanceSeed({ payload, scenario })).toMatchObject({
        branches: scenario.branches + 1,
        documents: 4,
      })
      const req = await createPayloadRequest({ payload })

      const allLocales = await queryBranchContent({
        branchID: 'review-1',
        collection: performanceSlug,
        locale: 'all',
        overrideAccess: false,
        req,
        where: { id: { equals: getPerformanceLogicalID({ ordinal: 100 }) } },
      })
      const original = buildPerformanceData({ ordinal: 100, scenario })
      const override = buildPerformanceData({ hasOverride: true, ordinal: 100, scenario })
      const expectedTitle = { ...(original.title as Record<string, string>) }

      if (hasPerformanceOverride({ ordinal: 100, scenario })) {
        expectedTitle.fr = (override.title as Record<string, string>).fr!
      }
      expect(allLocales.docs[0]!.title).toStrictEqual(expectedTitle)
      expect(Object.keys(expectedTitle)).toHaveLength(scenario.locales)

      for (const ordinal of [0, 100]) {
        for (const locale of ['en', 'fr'] as const) {
          const branch = await queryBranchContent({
            branchID: 'review-1',
            collection: performanceSlug,
            locale,
            overrideAccess: false,
            req,
            where: { id: { equals: getPerformanceLogicalID({ ordinal }) } },
          })
          const legacy = await payload.db.queryDrafts({
            collection: performanceSlug,
            locale,
            req,
            where: { 'version.ordinal': { equals: ordinal } },
          })

          expect(branch.docs).toStrictEqual(legacy.docs)
        }
      }
      const corruptedLocale = performanceLocales[scenario.locales - 1]!
      const projection =
        payload.collections[performanceSlug]!.config.custom.branchQueryStorage.projection
      const projectionID = encodeBranchProjectionID({
        branchID: 'review-1',
        logicalID: getPerformanceLogicalID({ ordinal: 100 }),
      })
      const cache = await payload.db.findOne({
        collection: projection,
        locale: 'all',
        req,
        where: { id: { equals: projectionID } },
      })

      await payload.db.updateOne({
        collection: projection,
        data: {
          ...cache,
          title: { ...expectedTitle, [corruptedLocale]: 'corrupted non-English cache value' },
        },
        locale: 'all',
        req,
        where: {
          id: {
            equals: projectionID,
          },
        },
      })
      const corrupted = await queryBranchContent({
        branchID: 'review-1',
        collection: performanceSlug,
        locale: 'all',
        overrideAccess: false,
        req,
        where: { id: { equals: getPerformanceLogicalID({ ordinal: 100 }) } },
      })

      expect(corrupted.docs[0]).toStrictEqual({
        ...allLocales.docs[0],
        title: { ...expectedTitle, [corruptedLocale]: 'corrupted non-English cache value' },
      })
      await expect(verifyPerformanceSeed({ payload, scenario })).rejects.toThrow(
        'Native authority/cache body drift: review-1/100',
      )
      const repaired = await queryBranchContent({
        branchID: 'review-1',
        collection: performanceSlug,
        locale: 'all',
        overrideAccess: false,
        req,
        where: { id: { equals: getPerformanceLogicalID({ ordinal: 100 }) } },
      })

      expect(repaired.docs[0]!.title).toStrictEqual(expectedTitle)
    })
  },
)

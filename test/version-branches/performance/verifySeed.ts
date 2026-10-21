/* eslint-disable payload/no-relative-monorepo-imports -- Verify the bulk fixture against authoritative native hydration before measuring it. */
import type { Payload } from 'payload'

import { performance } from 'node:perf_hooks'
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import type { BranchQueryPerformanceScenario } from './scenarios.js'

import { rebuildBranchProjection } from '../../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import {
  getPerformanceBranches,
  getPerformanceLogicalID,
  getPerformanceSampleOrdinals,
  performanceLocales,
  performanceSlug,
} from './scenarios.js'

/** Compare complete decoded bodies before and after rebuilding from persisted heads and versions. */
export const verifyPerformanceSeed = async ({
  payload,
  scenario,
}: {
  payload: Payload
  scenario: BranchQueryPerformanceScenario
}) => {
  const req = await createPayloadRequest({ payload })
  const branches = ['main', ...getPerformanceBranches({ scenario })]
  const ordinals = getPerformanceSampleOrdinals({ scenario })
  const source = payload.collections[performanceSlug]!.config
  const samples = []
  const read = ({ branchID, ordinal }: { branchID: string; ordinal: number }) =>
    queryBranchContent({
      branchID,
      collection: performanceSlug,
      locale: 'all',
      overrideAccess: false,
      req,
      where: { id: { equals: getPerformanceLogicalID({ ordinal }) } },
    })

  for (const branchID of branches) {
    for (const ordinal of ordinals) {
      const before = await read({ branchID, ordinal })

      expect(before.docs).toHaveLength(1)
      expect(Object.keys(before.docs[0]!.title as Record<string, unknown>).sort()).toEqual(
        performanceLocales.slice(0, scenario.locales).sort(),
      )
      samples.push({ branchID, ordinal, before: before.docs[0] })
    }
  }
  const transactionID = await payload.db.beginTransaction()

  if (transactionID === null) {
    throw new Error('Native transaction required for authoritative sample rebuild.')
  }
  const rebuildReq = await createPayloadRequest({ payload })

  rebuildReq.transactionID = transactionID
  const started = performance.now()

  try {
    for (const { branchID, ordinal } of samples) {
      await rebuildBranchProjection({
        branchID,
        req: rebuildReq,
        target: {
          collection: source.custom.branchStorage.heads,
          parentID: getPerformanceLogicalID({ ordinal }),
        },
      })
    }
    await payload.db.commitTransaction(transactionID)
  } finally {
    if (payload.db.sessions?.[transactionID]) {
      await payload.db.rollbackTransaction(transactionID)
    }
  }
  const milliseconds = performance.now() - started

  for (const { branchID, ordinal, before } of samples) {
    const after = await read({ branchID, ordinal })

    expect(after.docs).toHaveLength(1)
    expect(
      after.docs[0],
      `Native authority/cache body drift: ${branchID}/${ordinal}`,
    ).toStrictEqual(before)
  }
  return { branches: branches.length, documents: ordinals.length, milliseconds }
}

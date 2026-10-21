/* eslint-disable @typescript-eslint/no-explicit-any -- Native environment metadata is measured outside all timed operations. */
import type { Payload } from 'payload'

import { availableParallelism, cpus, loadavg, release, totalmem } from 'node:os'

import { readPerformanceGitState } from './provenance.mjs'
import { getPerformanceSourceDigest } from './sourceDigest.mjs'

export const getBranchPerformanceEnvironment = async ({ payload }: { payload: Payload }) => {
  const adapter = payload.db as any
  const databaseVersion =
    adapter.name === 'mongoose'
      ? (await adapter.connection.db.command({ buildInfo: 1 })).version
      : adapter.pool
        ? (await adapter.pool.query('SELECT version() AS version')).rows[0].version
        : (await adapter.client.execute('SELECT sqlite_version() AS version')).rows[0].version
  const { paths, ...sourceDigest } = await getPerformanceSourceDigest({ includePaths: true })
  const expectedDigest = process.env.PAYLOAD_BRANCH_PERF_EXPECT_SOURCE_DIGEST
  const evidence = process.env.PAYLOAD_BRANCH_PERF_EVIDENCE ?? 'diagnostic'

  if (!['diagnostic', 'final'].includes(evidence)) {
    throw new Error('Performance evidence must be diagnostic or final.')
  }
  if (evidence === 'final' && !expectedDigest) {
    throw new Error('Final matrix evidence requires an explicit expected source digest.')
  }
  const expectedGitHead = process.env.PAYLOAD_BRANCH_PERF_EXPECT_GIT_HEAD
  if (evidence === 'final' && !expectedGitHead) {
    throw new Error('Final matrix evidence requires an explicit expected Git HEAD.')
  }
  if (expectedDigest && expectedDigest !== sourceDigest.value) {
    throw new Error('Performance implementation changed from the required source digest.')
  }
  const git = readPerformanceGitState({
    expectedHead: expectedGitHead,
    requireTrackedSource: evidence === 'final',
    sourcePaths: paths,
  })
  return {
    architecture: process.arch,
    availableParallelism: availableParallelism(),
    cpu: cpus()[0]?.model,
    databaseVersion,
    evidence,
    git,
    expectedGitHead,
    loadAverageAtStart: loadavg(),
    node: process.version,
    operatingSystemRelease: release(),
    platform: process.platform,
    sourceDigest,
    totalSystemMemoryBytes: totalmem(),
  }
}

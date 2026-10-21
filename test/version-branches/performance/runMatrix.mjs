import { mkdirSync, openSync, closeSync, writeFileSync } from 'node:fs'
import { getPerformanceSourceDigest } from './sourceDigest.mjs'
import { readPerformanceGitState } from './provenance.mjs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const adapter = process.argv[2]

if (!['mongodb', 'postgres', 'sqlite'].includes(adapter)) {
  throw new Error('Pass one native adapter: mongodb, postgres, or sqlite.')
}

const output = process.env.PAYLOAD_BRANCH_PERF_OUTPUT ?? '/private/tmp/payload-branch-performance'
const failures = []
const evidence = process.env.PAYLOAD_BRANCH_PERF_EVIDENCE ?? 'diagnostic'
const { paths, ...sourceDigest } = await getPerformanceSourceDigest({ includePaths: true })
const git = readPerformanceGitState({
  expectedHead: process.env.PAYLOAD_BRANCH_PERF_EXPECT_GIT_HEAD,
  requireTrackedSource: evidence === 'final',
  sourcePaths: paths,
})
const expected = process.env.PAYLOAD_BRANCH_PERF_EXPECT_SOURCE_DIGEST ?? sourceDigest.value
if (!['diagnostic', 'final'].includes(evidence) || expected !== sourceDigest.value) {
  throw new Error('Matrix evidence kind or required source digest is invalid.')
}
const directory = join(output, evidence, sourceDigest.value)
const manifest = {
  adapter,
  evidence,
  sourceDigest,
  git,
  startedAt: new Date().toISOString(),
  outcomes: [],
}
const saveManifest = () =>
  writeFileSync(join(directory, `${adapter}-matrix.json`), `${JSON.stringify(manifest, null, 2)}\n`)

mkdirSync(directory, { recursive: true })
saveManifest()
for (const documents of [10_000, 100_000]) {
  for (const locales of [2, 10]) {
    for (const branches of [1, 20]) {
      for (const density of [0.01, 0.8]) {
        const key = `${adapter}-${documents}-${locales}-${branches}-${density}`
        const file = openSync(join(directory, `${key}.log`), 'w')

        console.log(`Measuring ${key}; native evidence and log: ${directory}`)
        readPerformanceGitState({
          expectedHead: git.head,
          requireTrackedSource: evidence === 'final',
          sourcePaths: paths,
        })
        const result = spawnSync(
          process.execPath,
          [
            'node_modules/vitest/vitest.mjs',
            'run',
            '--project',
            'int',
            'test/version-branches/performance/query-performance.int.spec.ts',
          ],
          {
            env: {
              ...process.env,
              PAYLOAD_DATABASE: adapter,
              PAYLOAD_BRANCH_PERF: 'true',
              PAYLOAD_BRANCH_PERF_EVIDENCE: evidence,
              PAYLOAD_BRANCH_PERF_EXPECT_SOURCE_DIGEST: expected,
              PAYLOAD_BRANCH_PERF_EXPECT_GIT_HEAD: git.head,
              PAYLOAD_BRANCH_PERF_DOCUMENTS: String(documents),
              PAYLOAD_BRANCH_PERF_LOCALES: String(locales),
              PAYLOAD_BRANCH_PERF_BRANCHES: String(branches),
              PAYLOAD_BRANCH_PERF_DENSITY: String(density),
              PAYLOAD_BRANCH_PERF_OUTPUT: output,
            },
            stdio: ['ignore', file, file],
          },
        )

        closeSync(file)
        manifest.outcomes.push({
          key,
          exitCode: result.status,
          finishedAt: new Date().toISOString(),
        })
        saveManifest()
        if (result.status !== 0) {
          failures.push(key)
          console.error(
            `Performance gate failed for ${key}; inspect the retained evidence before proceeding.`,
          )
          if (process.env.PAYLOAD_BRANCH_PERF_CONTINUE_ON_FAILURE !== 'true') {
            process.exit(result.status ?? 1)
          }
        }
      }
    }
  }
}
if (failures.length) {
  console.error(`Failed scenarios: ${failures.join(', ')}`)
  process.exitCode = 1
}

manifest.finishedAt = new Date().toISOString()
saveManifest()

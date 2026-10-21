import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

import { getPerformanceSourceDigest } from './sourceDigest.mjs'
import { hasFinalPerformanceSamples, renderNativeEvidence } from './evidence.mjs'
import { readPerformanceGitState } from './provenance.mjs'

const { paths, ...source } = await getPerformanceSourceDigest({ includePaths: true })
const output = process.env.PAYLOAD_BRANCH_PERF_OUTPUT ?? '/private/tmp/payload-branch-performance'
const directory = join(output, 'final', source.value)
const rows = []
const environments = new Map()
const evidenceEntries = []
const percentileTables = []
let passed = 0
let failed = 0
let missing = 0
let measurementHead
let hasPinnedHeadSources = false
const number = ({ value }) => (Number.isFinite(value) ? value.toFixed(2) : '—')

for (const adapter of ['mongodb', 'postgres', 'sqlite']) {
  for (const documents of [10_000, 100_000]) {
    for (const locales of [2, 10]) {
      for (const branches of [1, 20]) {
        for (const density of [0.01, 0.8]) {
          const key = `${adapter}-${documents}-${locales}-${branches}-${density}`
          let report
          try {
            const body = await readFile(join(directory, `${key}.json`), 'utf8')
            report = JSON.parse(body)
            evidenceEntries.push({
              key,
              report,
              evidence: 'final',
              reportSHA256: createHash('sha256').update(body).digest('hex'),
            })
          } catch (error) {
            if (error.code !== 'ENOENT') throw error
          }
          let status = 'MISSING'
          if (report) {
            const head = report.environment?.git?.head
            if (head && !measurementHead) {
              measurementHead = head
              try {
                readPerformanceGitState({
                  referenceHead: head,
                  requireTrackedSource: true,
                  sourcePaths: paths,
                })
                hasPinnedHeadSources = true
              } catch {
                // Preserve a failed report summary rather than accepting source outside its measured commit.
              }
            }
            const isPassed =
              !report.error &&
              report.environment.evidence === 'final' &&
              report.environment.sourceDigest.value === source.value &&
              report.environment.isSourceUnchanged === true &&
              hasPinnedHeadSources &&
              head === measurementHead &&
              report.environment.expectedGitHead === head &&
              report.environment.gitAtCompletion?.head === head &&
              hasFinalPerformanceSamples({ report }) &&
              report.gate?.length === 5 &&
              report.gate.every(({ isWithinBudget }) => isWithinBudget) &&
              report.graph?.isWithinBudget === true &&
              report.graph.existingCallerTransaction &&
              report.maintenance?.validatedBranchBodies === branches + 1 &&
              report.maintenanceHeavy?.validatedBranchBodies === branches + 1
            status = isPassed ? 'PASS' : 'FAIL'
            environments.set(adapter, report.environment)
            const measurements = (report.measurements ?? []).map(
              (measurement) =>
                `| ${measurement.workload} | ${measurement.method} | ${number({ value: measurement.p50 })}/${number({ value: measurement.p95 })} | ${measurement.calls ?? '—'} |`,
            )
            const graphMeasurements = (report.graph?.measurements ?? []).map(
              (measurement) =>
                `| depth-two graph | ${measurement.method} | ${number({ value: measurement.p50 })}/${number({ value: measurement.p95 })} | ${measurement.calls ?? '—'} |`,
            )
            percentileTables.push(
              `<details>\n<summary>${key}: ${status}</summary>\n\n| Workload | Layer | Warm p50/p95 ms | Native calls |\n| --- | --- | ---: | ---: |\n${[...measurements, ...graphMeasurements].join('\n')}\n\nMaintenance ordinary/heavy latency: ${number({ value: report.maintenance?.milliseconds })}/${number({ value: report.maintenanceHeavy?.milliseconds })} ms; native calls: ${report.maintenance?.calls ?? '—'}/${report.maintenanceHeavy?.calls ?? '—'}; acknowledged affected rows: ${report.maintenance?.acknowledgedAffectedRows ?? '—'}/${report.maintenanceHeavy?.acknowledgedAffectedRows ?? '—'} per single logical head change.\n\n</details>`,
            )
          }
          if (status === 'PASS') passed++
          else if (status === 'FAIL') failed++
          else missing++
          const scalarP50 = report?.gate?.length
            ? Math.max(...report.gate.map(({ p50Ratio }) => p50Ratio))
            : undefined
          const scalarP95 = report?.gate?.length
            ? Math.max(...report.gate.map(({ p95Ratio }) => p95Ratio))
            : undefined
          const selective = report?.measurements?.find(
            ({ workload, method }) =>
              workload === 'selective-indexed-page' && method === 'branch-guarded-core',
          )
          const graph = report?.graph?.measurements?.find(
            ({ method }) => method === 'branch-guarded-core-raw-graph',
          )
          const allocated =
            report?.storage?.allocatedBytes == null
              ? undefined
              : report.storage.allocatedBytes +
                (adapter === 'mongodb' ? report.storage.indexBytes : 0)
          rows.push(
            `| ${adapter} | ${documents} | ${density} | ${locales} | ${branches} | ${status} | ${number({ value: scalarP50 })}/${number({ value: scalarP95 })} | ${number({ value: report?.graph?.p50Ratio })}/${number({ value: report?.graph?.p95Ratio })} | ${selective?.calls ?? '—'}/${graph?.calls ?? '—'} | ${number({ value: report?.seed?.milliseconds / 1000 })} | ${number({ value: allocated / 1024 / 1024 })} | ${number({ value: report?.peakResidentSetKilobytes / 1024 })} | ${report?.maintenance?.acknowledgedAffectedRows ?? '—'}/${report?.maintenanceHeavy?.acknowledgedAffectedRows ?? '—'} |`,
          )
        }
      }
    }
  }
}
const metadata = [...environments].map(
  ([adapter, environment]) =>
    `- ${adapter}: ${environment.databaseVersion}; Node ${environment.node}; ${environment.platform}/${environment.architecture}, OS ${environment.operatingSystemRelease}; ${environment.cpu}; ${environment.availableParallelism} available CPUs; Git HEAD ${environment.git?.head ?? 'unknown'}, dirty ${environment.git?.isDirty ?? 'unknown'}; ${number({ value: environment.totalSystemMemoryBytes / 1024 ** 3 })} GiB RAM.`,
)
const text = `Written with AI

# Settled-source native performance matrix

Source SHA-256: \`${source.value}\` (${source.files} source files; implementation and benchmark). This digest includes new and uncommitted source, not generated results. Only explicit final evidence with this exact digest, unchanged throughout each scenario, contributes to this table. Historical diagnostics are described in [PERFORMANCE.md](../PERFORMANCE.md).

Coverage: **${passed}/48 passed, ${failed} failed, ${missing} missing**. Both p50 and p95 must remain at most 2x the equivalent existing native draft workload. A scenario also requires full content/owned-locale parity, authoritative native hydration samples, the depth-two graph with cycles/denied targets, caller-transaction graph validation, and measured fanout maintenance verified on every branch. No exception is approved.

${metadata.length ? metadata.join('\n') : 'No final environment has been measured for this source digest.'}

Raw JSON, native plans, individual samples, logs, and matrix manifests: \`${directory}\`. Reproduce with \`PAYLOAD_BRANCH_PERF_EVIDENCE=final\` and the documented dedicated database commands. Matrix runners pin the starting digest automatically and reject source changes.

Reviewable representative native plans and scan counters are retained in [NATIVE-PLANS.md](./NATIVE-PLANS.md); historical diagnostic entries there never contribute to this coverage table.

Percentile columns show p50/p95 ratios. Calls show selective core/graph native commands. Storage is allocated database MiB (Mongo adds reported index bytes); peak RSS is worker MiB including setup. Write rows show ordinary/heavy acknowledged native SQL rows or Mongo documents, each for one logical main-head change, with the limitations documented in PERFORMANCE.md.

| Adapter | Documents | Override density | Locales | Working branches | Status | Worst scalar ratios | Graph ratios | Calls core/graph | Seed seconds | Storage MiB | Peak RSS MiB | Write rows |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

${percentileTables.length ? `## Measured layers and maintenance\n\n${percentileTables.join('\n\n')}` : 'No final per-workload percentile evidence is available for this source digest.'}
`
await writeFile(fileURLToPath(new URL('./RESULTS.md', import.meta.url)), text)
for (let index = 2; index < process.argv.length; index += 2) {
  if (process.argv[index] !== '--diagnostic-report' || !process.argv[index + 1]) {
    throw new Error(
      'Use repeated --diagnostic-report <path> arguments for historical native evidence.',
    )
  }
  const path = process.argv[index + 1]
  const body = await readFile(path, 'utf8')
  const report = JSON.parse(body)
  const adapter = report.adapter === 'mongoose' ? 'mongodb' : report.adapter
  const { documents, locales, branches, overrideDensity } = report.scenario
  evidenceEntries.push({
    key: `${adapter}-${documents}-${locales}-${branches}-${overrideDensity}`,
    report,
    evidence: 'diagnostic',
    reportSHA256: createHash('sha256').update(body).digest('hex'),
  })
}
await writeFile(
  fileURLToPath(new URL('./NATIVE-PLANS.md', import.meta.url)),
  renderNativeEvidence({ entries: evidenceEntries, sourceDigest: source.value }),
)
console.log(`Final matrix ${source.value}: ${passed} passed, ${failed} failed, ${missing} missing.`)
if (process.env.PAYLOAD_BRANCH_PERF_REQUIRE_COMPLETE === 'true' && (failed || missing))
  process.exitCode = 1

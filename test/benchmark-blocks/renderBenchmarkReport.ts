import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type { BenchmarkRun } from './benchmarkReport.js'
import type { AttributionWorkerResult, WorkerResult } from './measureSchemas.worker.js'
import type { BenchmarkScenarioName } from './schemaScenarios.js'

import {
  compareBenchmarks,
  evaluateBenchmarkAcceptance,
  summarizeBenchmark,
} from './benchmarkReport.js'
import { benchmarkScenarioNames } from './schemaScenarios.js'

export type StoredBenchmarkRun = {
  environment: WorkerResult['environment']
  iterations: number
  rawResults: Record<string, WorkerResult[]>
} & BenchmarkRun

export type StoredAttributionRun = {
  environment: AttributionWorkerResult['environment']
  scenarios: Record<string, AttributionWorkerResult>
}

export const renderBenchmarkReport = ({
  after,
  afterDigest,
  attribution,
  attributionDigest,
  before,
  beforeDigest,
}: {
  after: StoredBenchmarkRun
  afterDigest: string
  attribution: StoredAttributionRun
  attributionDigest: string
  before: StoredBenchmarkRun
  beforeDigest: string
}): string => {
  const comparison = compareBenchmarks({ after, before })
  const acceptanceChecks = evaluateBenchmarkAcceptance({ after, before })
  const resultRows = benchmarkScenarioNames
    .filter((scenario) => before.scenarios[scenario] && after.scenarios[scenario])
    .map((scenario) => {
      const beforeSummary = summarizeBenchmark({ samples: before.scenarios[scenario]! })
      const afterSummary = summarizeBenchmark({ samples: after.scenarios[scenario]! })
      const incrementalHeap = comparison.scenarios[scenario]!.incrementalHeap

      return `| ${scenario} | ${formatByteRange(beforeSummary.heapUsedDelta)} | ${formatByteRange(afterSummary.heapUsedDelta)} | ${formatNumberRange(beforeSummary.initializationMs, ' ms')} | ${formatNumberRange(afterSummary.initializationMs, ' ms')} | ${formatNumberRange(beforeSummary.schemaConstructors)} | ${formatNumberRange(afterSummary.schemaConstructors)} | ${formatNumberRange(beforeSummary.reachableSchemas)} | ${formatNumberRange(afterSummary.reachableSchemas)} | ${formatNumber(incrementalHeap.reductionPercent)}% |`
    })
  const absoluteMemoryRows = benchmarkScenarioNames
    .filter((scenario) => before.rawResults[scenario] && after.rawResults[scenario])
    .map((scenario) => {
      const beforeRSS = getAbsoluteMemoryRange({ key: 'rss', run: before, scenario })
      const afterRSS = getAbsoluteMemoryRange({ key: 'rss', run: after, scenario })
      const beforeHeap = getAbsoluteMemoryRange({ key: 'heapUsed', run: before, scenario })
      const afterHeap = getAbsoluteMemoryRange({ key: 'heapUsed', run: after, scenario })

      return `| ${scenario} | ${formatByteRange(beforeRSS)} | ${formatByteRange(afterRSS)} | ${formatByteRange(beforeHeap)} | ${formatByteRange(afterHeap)} |`
    })
  const incrementalRows = benchmarkScenarioNames
    .filter((scenario) => comparison.scenarios[scenario])
    .map((scenario) => {
      const incrementalHeap = comparison.scenarios[scenario]!.incrementalHeap

      return `| ${scenario} | ${formatBytes(incrementalHeap.before)} | ${formatBytes(incrementalHeap.after)} | ${formatNumber(incrementalHeap.reductionPercent)}% |`
    })
  const allocationRows = benchmarkScenarioNames
    .filter((scenario) => before.rawResults[scenario] && after.rawResults[scenario])
    .flatMap((scenario) =>
      Object.keys(after.rawResults[scenario]![0]!.attribution).map((category) => {
        const beforeRange = getAllocationRange({ category, run: before, scenario })
        const afterRange = getAllocationRange({ category, run: after, scenario })

        return `| ${scenario} | ${category} | ${formatNumberRange(beforeRange)} | ${formatNumberRange(afterRange)} |`
      }),
    )
  const cacheSummaryRows = benchmarkScenarioNames
    .filter((scenario) => attribution.scenarios[scenario])
    .map((scenario) => {
      const result = attribution.scenarios[scenario]!

      return `| ${scenario} | ${formatNumber(result.cache.hits)} | ${formatNumber(result.cache.misses)} | ${formatNumber(result.cache.entries.length)} | ${formatNumber(result.descriptors.length)} |`
    })
  const cacheEntryRows = benchmarkScenarioNames
    .filter((scenario) => attribution.scenarios[scenario])
    .flatMap((scenario) =>
      groupCacheEntries({ result: attribution.scenarios[scenario]! }).map(
        ({ hits, labels, misses, variantKey }) =>
          `| ${scenario} | ${variantKey} | ${labels.join(', ')} | ${formatNumber(hits)} | ${formatNumber(misses)} |`,
      ),
    )
  const acceptanceRows = acceptanceChecks.map(
    ({ name, details, passed }) => `| ${passed ? 'PASS' : 'FAIL'} | ${name} | ${details} |`,
  )
  const representativeDescriptor = getRepresentativeDescriptor({ attribution })
  const allChecksPass = acceptanceChecks.every(({ passed }) => passed)
  const inlineControlChecks = acceptanceChecks.filter(({ name }) =>
    name.startsWith('inline-control '),
  )
  const wideConstructorCheck = acceptanceChecks.find(
    ({ name }) => name === 'wide-references constructors',
  )
  const markdownCode = String.fromCharCode(96)

  return `# MongoDB Schema Build Cache Benchmarks

**Written with AI**

## Decision

${allChecksPass ? 'All measured acceptance checks pass.' : 'One or more measured acceptance checks failed.'} The initialization-scoped block-template cache is suitable for review. No additional production optimization is included. The main remaining allocation in the wide schema is the Mongoose discriminator clone required for each parent attachment. Disabling those clones would share more parent-specific mutable state, so this report does not recommend ${markdownCode}clone: false${markdownCode}.

## Environment

- Before revision: ${markdownCode}${before.environment.gitRevision}${markdownCode}
- After revision: ${markdownCode}${after.environment.gitRevision}${markdownCode}
- Attribution revision: ${markdownCode}${attribution.environment.gitRevision}${markdownCode}
- Node.js: ${after.environment.nodeVersion}
- Mongoose: ${after.environment.mongooseVersion}
- Payload: ${after.environment.payloadVersion}
- Platform: ${after.environment.operatingSystem} (${after.environment.architecture})
- Repetitions: ${after.iterations}
- Before data SHA-256: ${markdownCode}${beforeDigest}${markdownCode}
- After data SHA-256: ${markdownCode}${afterDigest}${markdownCode}
- Attribution data SHA-256: ${markdownCode}${attributionDigest}${markdownCode}

Each memory sample ran in a fresh Node.js process with ${markdownCode}--expose-gc${markdownCode} and an 8 GiB old-space limit. Values below are median with minimum–maximum in parentheses. RSS is supporting evidence because allocator behavior varies. Heap, constructor counts, and reachable compiled schemas are the primary evidence.

## Results

| Scenario | Heap delta before | Heap delta after | Init before | Init after | Constructors before | Constructors after | Reachable before | Reachable after | Incremental heap reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${resultRows.join('\n')}

The nested diamond scenarios receive the largest benefit because the same lower block graph was rebuilt for every route through the graph. The localized nested case also has two placement variants. The multiple-entity case benefits because the same definitions are reused across collections and globals in one initialization. The wide schema retains one discriminator attachment per block and field, so its reachable compiled schema count does not fall even though its temporary template work and heap use fall. The inline control uses separate block object identities and therefore has no cache hits by design.

## Absolute process memory after initialization

| Scenario | RSS before | RSS after | Heap used before | Heap used after |
| --- | ---: | ---: | ---: | ---: |
${absoluteMemoryRows.join('\n')}

## Heap above each revision's minimal scenario

| Scenario | Before | After | Reduction |
| --- | ---: | ---: | ---: |
${incrementalRows.join('\n')}

## Acceptance checks

| Result | Check | Evidence |
| --- | --- | --- |
${acceptanceRows.join('\n')}

${wideConstructorCheck ? `The wide constructor check reports ${wideConstructorCheck.details}.` : 'The benchmark input does not include a wide constructor check.'} ${
    inlineControlChecks.length === 0
      ? 'The benchmark input does not include inline-control guardrail checks.'
      : `The inline control ${inlineControlChecks.every(({ passed }) => passed) ? 'stays within' : 'exceeds'} the 5% guardrail.`
  }

## Constructor allocation categories

The discriminator-clone counter overlaps the constructor stack categories. It identifies how many constructor calls came from Mongoose clone operations rather than adding another constructor count. Block-template constructors are included in ${markdownCode}blocks-base${markdownCode}, and version constructors are included in ${markdownCode}top-level${markdownCode}, because the benchmark does not distinguish those phases.

| Scenario | Category | Before | After |
| --- | --- | ---: | ---: |
${allocationRows.join('\n')}

## Cache attribution totals

| Scenario | Hits | Misses | Label/variant entries | Stored descriptors |
| --- | ---: | ---: | ---: | ---: |
${cacheSummaryRows.join('\n')}

## Cache hits and misses by block and variant

Rows with the same variant and counts are grouped, but every block label is listed. Hits and misses are per listed block. Multiple misses for one label in the inline control represent separate block objects that intentionally share a slug but not an identity.

| Scenario | Variant | Block labels | Hits per block | Misses per block |
| --- | --- | --- | ---: | ---: |
${cacheEntryRows.join('\n')}

## Representative cached schema

This is a compact view of the stored template with the largest reachable schema graph in the nested diamond attribution run. The attribution JSON contains the complete descriptor.

${markdownCode.repeat(3)}json
${JSON.stringify(representativeDescriptor, null, 2)}
${markdownCode.repeat(3)}

## Technical explanation

Before this change, every referenced block path built a new Mongoose schema and recursively rebuilt its child block schemas. A reused block graph therefore expanded once for every path through the graph. Mongoose then cloned each block schema again when it attached the discriminator to a parent. The recursive rebuilds caused the very large constructor counts, retained schema graphs, initialization time, and heap growth.

After this change, one schema-build context exists for one MongoDB adapter initialization. It stores each block template by the block object's identity and the four inputs that change its schema: unique-index handling, draft handling, sortable-index handling, and effective localization. Later references reuse the completed template. Mongoose still clones the template when it attaches a discriminator, which preserves independent top-level registrations. The context is passed through live collections, collection versions, globals, global versions, and all recursive field builders, then cleared in a ${markdownCode}finally${markdownCode} block.

The context does not cross Payload instances or reloads. Inline blocks with different object identities do not share templates. Failed builds are not cached. The change does not alter MongoDB collection names, indexes, stored document shapes, Payload API response shapes, or generated types. Other database adapters and the Figma Content API do not use this Mongoose builder, so this optimization does not change their runtime behavior. The generic internal context can support a future adapter without exposing cache state through Payload's public API.

Mongoose's normal schema clone keeps some nested child-schema references. The memory reduction depends on reusing those immutable nested templates. Payload completes the nested discriminator graph before it stores a template and does not support post-initialization nested schema edits. The tests prove independent top-level registrations, stable complete descriptors, and a fresh context for reloads. Code that mutates a compiled nested discriminator after initialization remains outside this supported lifecycle.

## Further work

No additional optimization qualifies for this change. The wide schema still spends memory on required parent discriminator attachments, but removing Mongoose cloning would cross the schema ownership boundary and can share further mutable discriminator state. A future change would need a separate ownership design and a failing safety test before considering that option. Heap snapshots can also validate whether Mongoose path objects, rather than schema roots, are the largest remaining category in very wide schemas.
`
}

export const getFileDigest = ({ path }: { path: string }): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex')

const formatBytes = (value: number): string => `${(value / 1024 / 1024).toFixed(1)} MiB`

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)

const formatByteRange = (range: { maximum: number; median: number; minimum: number }): string =>
  `${formatBytes(range.median)} (${formatBytes(range.minimum)}–${formatBytes(range.maximum)})`

const formatNumberRange = (
  range: { maximum: number; median: number; minimum: number },
  suffix = '',
): string =>
  `${formatNumber(range.median)}${suffix} (${formatNumber(range.minimum)}–${formatNumber(range.maximum)})`

const getAbsoluteMemoryRange = ({
  key,
  run,
  scenario,
}: {
  key: 'heapUsed' | 'rss'
  run: StoredBenchmarkRun
  scenario: BenchmarkScenarioName
}) => getRange({ values: run.rawResults[scenario]!.map((result) => result.afterInit[key]) })

const getAllocationRange = ({
  category,
  run,
  scenario,
}: {
  category: string
  run: StoredBenchmarkRun
  scenario: BenchmarkScenarioName
}) =>
  getRange({
    values: run.rawResults[scenario]!.map(
      (result) => result.attribution[category as keyof WorkerResult['attribution']],
    ),
  })

const getRange = ({ values }: { values: number[] }) => {
  const sorted = [...values].sort((left, right) => left - right)
  const center = Math.floor(sorted.length / 2)

  if (sorted.length === 0) {
    throw new Error('A benchmark range requires at least one value.')
  }

  return {
    maximum: sorted.at(-1)!,
    median: sorted.length % 2 === 0 ? (sorted[center - 1]! + sorted[center]!) / 2 : sorted[center]!,
    minimum: sorted[0]!,
  }
}

const groupCacheEntries = ({ result }: { result: AttributionWorkerResult }) => {
  const groups = new Map<
    string,
    { hits: number; labels: string[]; misses: number; variantKey: string }
  >()

  for (const entry of result.cache.entries) {
    const key = `${entry.variantKey}\u0000${entry.hits}\u0000${entry.misses}`
    const group = groups.get(key) ?? {
      hits: entry.hits,
      labels: [],
      misses: entry.misses,
      variantKey: entry.variantKey,
    }

    group.labels.push(entry.label)
    groups.set(key, group)
  }

  return [...groups.values()]
    .map((group) => ({ ...group, labels: group.labels.sort() }))
    .sort((left, right) =>
      left.variantKey === right.variantKey
        ? left.labels[0]!.localeCompare(right.labels[0]!)
        : left.variantKey.localeCompare(right.variantKey),
    )
}

const getRepresentativeDescriptor = ({ attribution }: { attribution: StoredAttributionRun }) => {
  const descriptors = attribution.scenarios['nested-diamond']?.descriptors ?? []
  const representative = [...descriptors].sort(
    (left, right) => right.reachableSchemaCount - left.reachableSchemaCount,
  )[0]

  if (!representative) {
    throw new Error('The nested-diamond attribution has no cached schema descriptor.')
  }

  return {
    discriminatorCount: representative.discriminators.length,
    discriminatorSample: representative.discriminators.slice(0, 12),
    indexes: representative.indexes,
    label: representative.label,
    options: representative.options,
    pathCount: Object.keys(representative.paths).length,
    pathSample: Object.fromEntries(Object.entries(representative.paths).slice(0, 12)),
    reachableSchemaCount: representative.reachableSchemaCount,
    variantKey: representative.variantKey,
  }
}

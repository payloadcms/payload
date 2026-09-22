# MongoDB Schema Build Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Written with AI**

**Goal:** Reduce MongoDB adapter initialization memory by building each referenced block schema template once per variant and Payload initialization, while preserving all compiled Mongoose schemas and stored data behavior.

**Architecture:** Payload core will provide an internal, generic `SchemaBuildContext<TSchema>` that caches adapter artifacts by source-object identity and adapter-defined variant key. The MongoDB adapter will create one context inside each `init()` call, pass it through every live, version, global, and recursive schema build, and clear it after model compilation. A benchmark harness created before the production change will measure fresh child processes before and after the cache and will attribute the remaining schema allocations.

**Tech Stack:** TypeScript, Payload 4, Mongoose 9.9.2, Vitest 5, Node.js 24 with `--expose-gc`, pnpm, Turbo, MongoDB integration test fixtures.

**Spec:** `docs/superpowers/specs/2026-09-22-mongodb-schema-build-caching-design.md`

## Global Constraints

- Work only in the current checkout and branch. Do not create a Git worktree.
- Use native execution in this task. Do not dispatch implementation to subagents.
- Write each test before its production code and run the test to confirm the expected failure.
- Use object parameters for new and changed function signatures.
- Keep code and documentation in US English. Use British English in direct user communication.
- Keep `SchemaBuildContext` internal through `payload/internal`; do not export it from the public `payload` entry point.
- Do not store Mongoose schemas in module-level state or across adapter initializations.
- Continue to let Mongoose clone discriminator schemas. Do not pass `{ clone: false }` in this change unless the measured optimization gate and complete schema-equivalence tests approve a later task.
- Do not change collection names, indexes, stored document shapes, API response shapes, or generated Payload types.
- Keep the heavy benchmark outside standard CI. Small deterministic unit tests for benchmark helpers can run in CI.
- Run every benchmark sample in a fresh child process with `--expose-gc`; use at least five repetitions for final results and report median, minimum, and maximum.
- Include the exact label `Written with AI` in the committed design, benchmark report, pull request description, and other teammate-facing text.
- Do not add an AI co-author or other AI credit to Git commits.

## Review Focus

- A block definition can be reached through many paths in a diamond graph; tests must show one template build per source identity and variant, with later paths recorded as cache hits.
- The same block can be built for live, versioned, localized, and sortable-index contexts; tests must show that schema-affecting variants do not share a template.
- Hot reload or a second Payload instance can reuse the same JavaScript block object with a different configuration; tests must show that separate initialization contexts never share schemas.
- A schema builder can throw after a cache miss; tests must show that the failed value is not stored and a later call can retry.
- Mongoose can mutate discriminator inputs when registering parent-specific metadata; descriptor tests must show that registration from a cached template creates equivalent independent compiled schemas without cross-parent discriminator data.

---

## File Map

### Benchmark and evidence

- Create `test/benchmark-blocks/schemaScenarios.ts`: Build the seven deterministic configurations from the design spec.
- Create `test/benchmark-blocks/describeMongooseSchema.ts`: Convert Mongoose schemas into stable, inspectable JSON and count reachable schema objects.
- Create `test/benchmark-blocks/benchmarkReport.ts`: Calculate medians, ranges, deltas, minimal-runtime subtraction, and Markdown tables.
- Create `test/benchmark-blocks/benchmarkReport.unit.spec.ts`: Test descriptor normalization and report calculations without running the heavy benchmark.
- Create `test/benchmark-blocks/measureSchemas.worker.ts`: Run one scenario once, instrument Mongoose schema construction, and emit one JSON result.
- Create `test/benchmark-blocks/measureSchemas.ts`: Start fresh workers, aggregate samples, compare result files, and generate the Markdown report.
- Create `test/benchmark-blocks/README.md`: Document exact commands, isolation, metrics, scenarios, and interpretation.
- Modify `vitest.config.ts`: Include only `test/benchmark-blocks/**/*.unit.spec.ts` in the unit project.
- Modify `package.json`: Add `bench:mongodb-schema-build` without adding it to normal test or CI scripts.
- Create `docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md`: Store final reproducible results and recommendations.

### Generic context

- Create `packages/payload/src/database/createSchemaBuildContext.ts`: Define and implement the internal generic context.
- Create `packages/payload/src/database/createSchemaBuildContext.spec.ts`: Test identity, variants, failures, diagnostics, isolation, and clearing.
- Modify `packages/payload/src/exports/internal.ts`: Export the factory and its types through `payload/internal` only.

### MongoDB adapter

- Create `packages/db-mongodb/src/models/schemaBuildContext.ts`: Define MongoDB context aliases and the stable block variant key.
- Create `packages/db-mongodb/src/models/buildSchema.spec.ts`: Test graph reuse and complete Mongoose schema equivalence.
- Modify `packages/db-mongodb/src/models/buildSchema.ts`: Pass the context through recursive builders and cache block templates.
- Modify `packages/db-mongodb/src/models/buildCollectionSchema.ts`: Accept an object parameter and the initialization context.
- Modify `packages/db-mongodb/src/models/buildGlobalModel.ts`: Accept the initialization context and pass it to global schemas.
- Modify `packages/db-mongodb/src/init.ts`: Own one context per initialization and clear it in `finally`.

### MongoDB behavior coverage

- Create `test/mongodb-schema-build-cache/config.ts`: Define referenced nested blocks, localization, drafts, a numeric-ID relationship, unique fields, and a point field.
- Create `test/mongodb-schema-build-cache/int.spec.ts`: Verify create, read, update, localization, versions, ID types, indexes, and reload isolation.
- Create `test/mongodb-schema-build-cache/payload-types.ts`: Generate fixture types with Payload's normal command.

---

### Task 1: Build the independent benchmark harness and record the baseline

**Files:**

- Create: `test/benchmark-blocks/schemaScenarios.ts`
- Create: `test/benchmark-blocks/describeMongooseSchema.ts`
- Create: `test/benchmark-blocks/benchmarkReport.ts`
- Create: `test/benchmark-blocks/benchmarkReport.unit.spec.ts`
- Create: `test/benchmark-blocks/measureSchemas.worker.ts`
- Create: `test/benchmark-blocks/measureSchemas.ts`
- Create: `test/benchmark-blocks/README.md`
- Modify: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `createBenchmarkConfig({ scenario }): Promise<SanitizedConfig>` for one of `minimal`, `wide-references`, `nested-diamond`, `nested-diamond-drafts`, `nested-diamond-localized`, `multiple-entities`, or `inline-control`.
- Produces: `describeMongooseSchema({ label, schema, variantKey }): MongooseSchemaDescriptor`.
- Produces: `summarizeBenchmark({ samples }): BenchmarkSummary` and `compareBenchmarks({ after, before }): BenchmarkComparison`.
- Produces: CLI commands that write versioned raw JSON and a generated Markdown comparison.

- [ ] **Step 1: Add failing unit tests for report calculations and schema descriptions**

Add `test/benchmark-blocks/benchmarkReport.unit.spec.ts` with focused tests that use small in-memory Mongoose schemas:

```ts
import mongoose from 'mongoose'
import { describe, expect, test } from 'vitest'

import type { BenchmarkRun, BenchmarkSample } from './benchmarkReport.js'

import { compareBenchmarks, summarizeBenchmark } from './benchmarkReport.js'
import { describeMongooseSchema } from './describeMongooseSchema.js'

const createSample = (
  overrides: Partial<BenchmarkSample>,
): BenchmarkSample => ({
  externalDelta: 0,
  heapTotalDelta: 0,
  heapUsedDelta: 0,
  initializationMs: 0,
  reachableSchemas: 0,
  rssDelta: 0,
  schemaClones: 0,
  schemaConstructors: 0,
  ...overrides,
})

const createRun = ({
  minimalHeap,
  nestedHeap,
}: {
  minimalHeap: number
  nestedHeap: number
}): BenchmarkRun => ({
  scenarios: {
    minimal: [createSample({ heapUsedDelta: minimalHeap })],
    'nested-diamond': [createSample({ heapUsedDelta: nestedHeap })],
  },
})

describe('MongoDB schema benchmark helpers', () => {
  test('should calculate median, minimum, and maximum without averaging outliers', () => {
    const summary = summarizeBenchmark({
      samples: [
        createSample({
          heapUsedDelta: 10,
          initializationMs: 10,
          schemaConstructors: 10,
        }),
        createSample({
          heapUsedDelta: 20,
          initializationMs: 20,
          schemaConstructors: 20,
        }),
        createSample({
          heapUsedDelta: 1_000,
          initializationMs: 1_000,
          schemaConstructors: 1_000,
        }),
      ],
    })

    expect(summary.heapUsedDelta).toEqual({
      maximum: 1_000,
      median: 20,
      minimum: 10,
    })
    expect(summary.schemaConstructors.median).toBe(20)
  })

  test('should subtract each revision minimal scenario before comparing graph cost', () => {
    const comparison = compareBenchmarks({
      before: createRun({ minimalHeap: 100, nestedHeap: 500 }),
      after: createRun({ minimalHeap: 150, nestedHeap: 250 }),
    })

    expect(comparison.scenarios['nested-diamond'].incrementalHeap.before).toBe(
      400,
    )
    expect(comparison.scenarios['nested-diamond'].incrementalHeap.after).toBe(
      100,
    )
    expect(
      comparison.scenarios['nested-diamond'].incrementalHeap.reductionPercent,
    ).toBe(75)
  })

  test('should describe paths, indexes, options, discriminators, and reachable schemas', () => {
    const child = new mongoose.Schema(
      { title: { index: true, type: String } },
      { _id: false },
    )
    const parent = new mongoose.Schema(
      { items: [new mongoose.Schema({}, { discriminatorKey: 'blockType' })] },
      { minimize: false },
    )
    parent.path('items').discriminator('text', child)

    const descriptor = describeMongooseSchema({
      label: 'fixture',
      schema: parent,
      variantKey: 'test',
    })

    expect(descriptor.paths.items.instance).toBe('Array')
    expect(descriptor.discriminators).toContain('items:text')
    expect(descriptor.options.minimize).toBe(false)
    expect(descriptor.reachableSchemaCount).toBeGreaterThan(1)
  })
})
```

Add `test/benchmark-blocks/**/*.unit.spec.ts` to the unit project's `include` array in `vitest.config.ts`.

- [ ] **Step 2: Run the helper tests and confirm the expected failure**

Run:

```bash
pnpm exec vitest run --project unit test/benchmark-blocks/benchmarkReport.unit.spec.ts
```

Expected: FAIL because `benchmarkReport.ts` and `describeMongooseSchema.ts` do not exist.

- [ ] **Step 3: Implement deterministic descriptors and calculations**

Implement stable sorted output. The descriptor must include path names and Mongoose instances, child schemas, discriminator names, indexes and index options, the schema options `_id`, `id`, `minimize`, `timestamps`, and `discriminatorKey`, plus a `WeakSet`-based reachable schema count. Do not serialize functions or model constructors.

Use these report types:

```ts
export type BenchmarkSample = {
  externalDelta: number
  heapTotalDelta: number
  heapUsedDelta: number
  initializationMs: number
  reachableSchemas: number
  rssDelta: number
  schemaClones: number
  schemaConstructors: number
}

export type MetricRange = {
  maximum: number
  median: number
  minimum: number
}

export type BenchmarkRun = {
  scenarios: Record<string, BenchmarkSample[]>
}

const benchmarkMetricNames = [
  'externalDelta',
  'heapTotalDelta',
  'heapUsedDelta',
  'initializationMs',
  'reachableSchemas',
  'rssDelta',
  'schemaClones',
  'schemaConstructors',
] as const

const getMetricRange = ({ values }: { values: number[] }): MetricRange => {
  if (values.length === 0) {
    throw new Error('At least one benchmark sample is required.')
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const center = Math.floor(sortedValues.length / 2)
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[center - 1] + sortedValues[center]) / 2
      : sortedValues[center]

  return {
    maximum: sortedValues.at(-1)!,
    median,
    minimum: sortedValues[0],
  }
}

export const summarizeBenchmark = ({
  samples,
}: {
  samples: BenchmarkSample[]
}): Record<keyof BenchmarkSample, MetricRange> =>
  Object.fromEntries(
    benchmarkMetricNames.map((metricName) => [
      metricName,
      getMetricRange({ values: samples.map((sample) => sample[metricName]) }),
    ]),
  ) as Record<keyof BenchmarkSample, MetricRange>

export const compareBenchmarks = ({
  after,
  before,
}: {
  after: BenchmarkRun
  before: BenchmarkRun
}) => {
  const afterMinimal = summarizeBenchmark({
    samples: after.scenarios.minimal,
  }).heapUsedDelta.median
  const beforeMinimal = summarizeBenchmark({
    samples: before.scenarios.minimal,
  }).heapUsedDelta.median
  const scenarioNames = Object.keys(before.scenarios).filter(
    (scenarioName) => scenarioName in after.scenarios,
  )

  return {
    scenarios: Object.fromEntries(
      scenarioNames.map((scenarioName) => {
        const afterHeap = summarizeBenchmark({
          samples: after.scenarios[scenarioName],
        }).heapUsedDelta.median
        const beforeHeap = summarizeBenchmark({
          samples: before.scenarios[scenarioName],
        }).heapUsedDelta.median
        const afterIncrementalHeap = afterHeap - afterMinimal
        const beforeIncrementalHeap = beforeHeap - beforeMinimal

        return [
          scenarioName,
          {
            incrementalHeap: {
              after: afterIncrementalHeap,
              before: beforeIncrementalHeap,
              reductionPercent:
                beforeIncrementalHeap === 0
                  ? 0
                  : ((beforeIncrementalHeap - afterIncrementalHeap) /
                      beforeIncrementalHeap) *
                    100,
            },
          },
        ]
      }),
    ),
  }
}
```

The implementation must reject an empty sample array with `Error('At least one benchmark sample is required.')` and must keep input arrays unchanged.

- [ ] **Step 4: Run the helper tests and confirm they pass**

Run:

```bash
pnpm exec vitest run --project unit test/benchmark-blocks/benchmarkReport.unit.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Implement the seven fixed benchmark scenarios**

Use config-level string references for every reusable block. Use these fixed shapes so both revisions receive identical work:

```ts
export const benchmarkScenarioNames = [
  'minimal',
  'wide-references',
  'nested-diamond',
  'nested-diamond-drafts',
  'nested-diamond-localized',
  'multiple-entities',
  'inline-control',
] as const
```

- `minimal`: one collection with one text field and no custom blocks.
- `wide-references`: 600 blocks fields, each referring to the same 40 leaf blocks, matching the issue reproduction scale.
- `nested-diamond`: six layers of four shared blocks; every block at one layer has a blocks field that refers to all four blocks in the next layer; 20 top-level blocks fields refer to all four roots.
- `nested-diamond-drafts`: the same graph on one draft-enabled collection.
- `nested-diamond-localized`: the draft graph with locales `en` and `de`, half of the top-level blocks fields localized, and localized text inside the shared leaves.
- `multiple-entities`: the diamond graph shared by four collections and two globals, all versioned.
- `inline-control`: 100 blocks fields, each containing 20 newly allocated but structurally equal inline block objects; do not reuse object identity in this control.

Each config must set `typescript.autoGenerate: false`, `telemetry: false`, and use `mongooseAdapter({ url: false })`. Keep seed hooks and application plugins out of the benchmark configs.

- [ ] **Step 6: Implement one-sample worker isolation and allocation attribution**

`measureSchemas.worker.ts` must:

1. Validate one scenario name from `process.argv`.
2. Set production mode before importing Payload configuration code.
3. Replace `mongoose.Schema` with a constructor `Proxy` before importing Payload, wrap `mongoose.Schema.prototype.clone`, increment both counters, and classify the first repository stack frame.
4. Force garbage collection three times at each checkpoint when `global.gc` is available.
5. Record memory before initialization, after `getPayload({ config, disableDBConnect: true })`, and after `payload.destroy()`.
6. Count schemas reachable from `payload.db.collections`, `payload.db.versions`, and `payload.db.globals` with a `WeakSet`.
7. Emit exactly one JSON object to stdout and diagnostics to stderr.

The JSON must include:

```ts
type WorkerResult = {
  afterDestroy: NodeJS.MemoryUsage
  afterInit: NodeJS.MemoryUsage
  attribution: Record<string, number>
  beforeInit: NodeJS.MemoryUsage
  environment: {
    architecture: string
    gitRevision: string
    mongooseVersion: string
    nodeVersion: string
    operatingSystem: string
    payloadVersion: string
  }
  initializationMs: number
  reachableSchemas: number
  scenario: BenchmarkScenarioName
  schemaClones: number
  schemaConstructors: number
}
```

Classification labels must be `top-level`, `version`, `blocks-base`, `block-template`, `discriminator-clone`, `array-group-tab`, and `mongoose-internal`. When a stack is ambiguous, classify it as `mongoose-internal` instead of guessing. Keep constructor and clone counts separate because Mongoose can clone through an internal constructor reference that a replaced exported property does not observe.

- [ ] **Step 7: Implement the controller, comparison output, and package script**

The controller must use `process.execPath` and start each worker with `--expose-gc`, `--import`, and `tsx`. It must fail if a worker emits invalid JSON or exits nonzero. Support these exact commands:

```bash
pnpm bench:mongodb-schema-build -- --iterations 5 --output /private/tmp/mongodb-schema-build-baseline.json
pnpm bench:mongodb-schema-build -- --iterations 5 --output /private/tmp/mongodb-schema-build-cached.json
pnpm bench:mongodb-schema-build -- --compare /private/tmp/mongodb-schema-build-baseline.json /private/tmp/mongodb-schema-build-cached.json --markdown docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md
```

Add this root script without wiring it into `test`, `test:unit`, or CI:

```json
"bench:mongodb-schema-build": "pnpm runts ./test/benchmark-blocks/measureSchemas.ts"
```

The controller must sort scenarios in the declared order, calculate deltas from the before-initialization checkpoint, subtract the matching revision's minimal scenario for incremental results, and include raw samples in the JSON file.

- [ ] **Step 8: Document reproduction and run a one-iteration smoke benchmark**

`test/benchmark-blocks/README.md` must explain that RSS is supporting evidence, heap delta and schema constructor counts are primary evidence, each child process is fresh, and the command does not run in CI. Include `Written with AI` visibly.

Run:

```bash
pnpm bench:mongodb-schema-build -- --iterations 1 --scenario minimal --output /private/tmp/mongodb-schema-build-smoke.json
```

Expected: PASS with one sample, finite nonnegative schema counts, all three memory checkpoints, and a clean worker exit.

- [ ] **Step 9: Run the helper tests and commit the harness**

Run:

```bash
pnpm exec vitest run --project unit test/benchmark-blocks/benchmarkReport.unit.spec.ts
pnpm exec prettier --check test/benchmark-blocks vitest.config.ts package.json
```

Expected: PASS.

Commit:

```bash
git add package.json vitest.config.ts test/benchmark-blocks
git commit -m "test: add MongoDB schema build benchmark"
```

- [ ] **Step 10: Record the five-run baseline before any MongoDB cache code exists**

Run:

```bash
pnpm bench:mongodb-schema-build -- --iterations 5 --output /private/tmp/mongodb-schema-build-baseline.json
```

Expected: PASS. Preserve this file outside the repository. Verify its `gitRevision` is the benchmark-only commit and archive its SHA-256 digest in the execution notes:

```bash
shasum -a 256 /private/tmp/mongodb-schema-build-baseline.json
```

### Task 2: Add the generic initialization-scoped schema build context

**Files:**

- Create: `packages/payload/src/database/createSchemaBuildContext.spec.ts`
- Create: `packages/payload/src/database/createSchemaBuildContext.ts`
- Modify: `packages/payload/src/exports/internal.ts`

**Interfaces:**

- Produces: `createSchemaBuildContext<TSchema>({ onEvent? }): SchemaBuildContext<TSchema>`.
- Produces: `SchemaBuildCacheEvent<TSchema>`, `SchemaBuildContext<TSchema>`, and `SchemaBuildContextSnapshot` through `payload/internal`.

- [ ] **Step 1: Write failing tests for identity, variants, errors, events, and clearing**

Create tests for all of these cases:

```ts
test('should build once for the same definition identity and variant')
test('should build separate artifacts for separate variants')
test('should not merge equal definitions with different object identities')
test('should not share artifacts between contexts')
test('should retry after a builder throws')
test('should report ordered hit, miss, and store events')
test('should reset artifacts and counters when cleared')
```

Use `vi.fn()` builders and an events array. For the error case, make the first build throw and the second return an object; assert two builder calls and one stored result. For separate contexts, pass the exact same definition object and assert different artifacts.

- [ ] **Step 2: Run the context test and confirm the expected failure**

Run:

```bash
pnpm exec vitest run --project unit packages/payload/src/database/createSchemaBuildContext.spec.ts
```

Expected: FAIL because `createSchemaBuildContext.ts` does not exist.

- [ ] **Step 3: Implement the typed context**

Use these exact public-internal types:

```ts
export type SchemaBuildCacheEvent<TSchema> = {
  action: 'hit' | 'miss' | 'store'
  label: string
  schema?: TSchema
  variantKey: string
}

export type SchemaBuildContextSnapshot = {
  entries: Array<{
    hits: number
    label: string
    misses: number
    variantKey: string
  }>
  hits: number
  misses: number
}

export type SchemaBuildContext<TSchema> = {
  clear: () => void
  getOrCreate: (args: {
    build: () => TSchema
    definition: object
    label: string
    variantKey: string
  }) => TSchema
  snapshot: () => SchemaBuildContextSnapshot
}
```

The factory must hold artifacts in `let schemasByDefinition = new WeakMap<object, Map<string, TSchema>>()`. Store counters in nested `Map<label, Map<variantKey, counts>>` objects so labels containing separators cannot collide. Emit `miss` before calling `build`, emit `store` only after a successful return, and include `schema` only on the `store` event. Sort snapshot entries by `label` and then `variantKey`. `clear()` must replace the `WeakMap` and clear every counter.

- [ ] **Step 4: Export the helper internally and run the tests**

Add value and type exports to `packages/payload/src/exports/internal.ts`; do not modify `packages/payload/src/index.ts`.

Run:

```bash
pnpm exec vitest run --project unit packages/payload/src/database/createSchemaBuildContext.spec.ts
pnpm run build:payload
```

Expected: PASS.

- [ ] **Step 5: Commit the generic context**

```bash
git add packages/payload/src/database/createSchemaBuildContext.ts packages/payload/src/database/createSchemaBuildContext.spec.ts packages/payload/src/exports/internal.ts
git commit -m "feat: add schema build context"
```

### Task 3: Add failing MongoDB graph and schema-equivalence tests

**Files:**

- Create: `packages/db-mongodb/src/models/schemaBuildContext.ts`
- Create: `packages/db-mongodb/src/models/buildSchema.spec.ts`
- Modify later in Task 4: `packages/db-mongodb/src/models/buildSchema.ts`

**Interfaces:**

- Consumes: `createSchemaBuildContext<Schema>` and `SchemaBuildContext<Schema>` from `payload/internal`.
- Produces: `MongoSchemaBuildContext` and `getBlockSchemaVariantKey({ buildSchemaOptions, isLocalized })` for the builder and tests.
- Test helper: `createCompleteBlockGraph(): Block[]` returns the `leaf`, `left`, `right`, and `root` definitions with every field named in Step 3.
- Test helper: `createPayloadFixture({ blocks, customIDType, locales, useBigIntForNumberIDs }): Payload` returns the minimum typed Payload state needed by `buildSchema`.
- Test helper: `buildVariantSchema({ context, payload, variant }): Schema` builds the complete graph below beneath one top-level blocks field.

- [ ] **Step 1: Define the MongoDB variant key helper with direct unit coverage**

Create `schemaBuildContext.ts` with:

```ts
import type { Schema } from 'mongoose'
import type { SchemaBuildContext } from 'payload/internal'

import type { BuildSchemaOptions } from './buildSchema.js'

export type MongoSchemaBuildContext = SchemaBuildContext<Schema>

export const getBlockSchemaVariantKey = ({
  buildSchemaOptions,
  isLocalized,
}: {
  buildSchemaOptions: BuildSchemaOptions
  isLocalized: boolean
}): string =>
  [
    `disableUnique:${Boolean(buildSchemaOptions.disableUnique)}`,
    `draftsEnabled:${Boolean(buildSchemaOptions.draftsEnabled)}`,
    `indexSortableFields:${Boolean(buildSchemaOptions.indexSortableFields)}`,
    `isLocalized:${isLocalized}`,
  ].join('|')
```

Add a table test proving `undefined` and `false` produce the same key and that changing each of the four values changes the key.

- [ ] **Step 2: Write a diamond-graph cache test that fails against the current builder**

Build sanitized test configs with four layers: `leaf`, `left`, `right`, and `root`. Both `left` and `right` refer to `leaf`; `root` refers to both; two top-level fields refer to `root`. Create a context with an event observer and call `buildSchema` with a new `schemaBuildContext` argument.

Assert:

```ts
expect(context.snapshot().entries).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ label: 'block:leaf', misses: 1 }),
    expect.objectContaining({ label: 'block:root', misses: 1 }),
  ]),
)
expect(context.snapshot().hits).toBeGreaterThan(0)
```

Also assert that every expected discriminator exists at both parent paths.

- [ ] **Step 3: Add schema-equivalence tests for every variant input**

Inside `buildSchema.spec.ts`, add a local `describeSchema` test helper that records sorted paths, path instances, child schemas, discriminator names, indexes with options, and schema options. Compare a schema built with a shared context to a schema built with a fresh context for each case:

```ts
test.each([
  {
    disableUnique: false,
    draftsEnabled: false,
    indexSortableFields: false,
    isLocalized: false,
  },
  {
    disableUnique: true,
    draftsEnabled: true,
    indexSortableFields: false,
    isLocalized: false,
  },
  {
    disableUnique: false,
    draftsEnabled: false,
    indexSortableFields: true,
    isLocalized: false,
  },
  {
    disableUnique: false,
    draftsEnabled: false,
    indexSortableFields: false,
    isLocalized: true,
  },
])('should preserve the complete schema for $variant', (variant) => {
  const sharedContext = createSchemaBuildContext<Schema>()
  const payload = createPayloadFixture({
    blocks: createCompleteBlockGraph(),
    customIDType: 'number',
    locales: ['en', 'de'],
    useBigIntForNumberIDs: false,
  })

  buildVariantSchema({ context: sharedContext, payload, variant })
  const cachedSchema = buildVariantSchema({
    context: sharedContext,
    payload,
    variant,
  })
  const independentSchema = buildVariantSchema({
    context: createSchemaBuildContext<Schema>(),
    payload,
    variant,
  })

  expect(describeSchema(cachedSchema)).toEqual(
    describeSchema(independentSchema),
  )
})
```

The test graph must include a required text field, an optional unique field, a select field, a point field, an array, a named group, a named tab, a relationship to a numeric-ID collection, and a nested referenced block. This covers sparse and unique options, `2dsphere`, nested schemas, localized wrappers, and relationship value types.

- [ ] **Step 4: Add isolation and mutation-safety tests from Review Focus**

Add these tests before implementation:

```ts
test('should not share schemas between configs that reuse a block object')
test(
  'should create separate templates for localized and nonlocalized placements',
)
test('should create separate templates for live and version schemas')
test(
  'should preserve numeric, bigint, and string relationship ID types in separate contexts',
)
test(
  'should keep parent discriminator registrations independent after template reuse',
)
test(
  'should cache an inline block only when the same object identity is reused',
)
test('should leave compiled model schemas usable after context.clear()')
```

For mutation safety, register the same cached template beneath two different parent document arrays, then assert the two registered discriminator schemas are not the same object, have the same descriptor, and do not gain each other's parent-only discriminators.

- [ ] **Step 5: Run the MongoDB unit tests and confirm failure for the missing integration**

Run:

```bash
pnpm exec vitest run --project unit packages/db-mongodb/src/models/buildSchema.spec.ts
```

Expected: FAIL because `buildSchema` does not accept or use `schemaBuildContext`, so the observer records no cache events and repeated templates are built more than once.

- [ ] **Step 6: Commit only the failing tests and variant helper**

```bash
git add packages/db-mongodb/src/models/buildSchema.spec.ts packages/db-mongodb/src/models/schemaBuildContext.ts
git commit -m "test: cover MongoDB block schema reuse"
```

### Task 4: Thread one context through MongoDB schema construction

**Files:**

- Modify: `packages/db-mongodb/src/models/buildSchema.ts`
- Modify: `packages/db-mongodb/src/models/buildCollectionSchema.ts`
- Modify: `packages/db-mongodb/src/models/buildGlobalModel.ts`
- Modify: `packages/db-mongodb/src/init.ts`
- Test: `packages/db-mongodb/src/models/buildSchema.spec.ts`

**Interfaces:**

- Consumes: `MongoSchemaBuildContext` and `getBlockSchemaVariantKey` from Task 3.
- Changes: `buildSchema({ buildSchemaOptions, compoundIndexes?, configFields, flattenedFields?, parentIsLocalized?, payload, schemaBuildContext? }): Schema`.
- Changes: `buildCollectionSchema({ collection, payload, schemaBuildContext, schemaOptions? }): Schema`.
- Changes: `buildGlobalModel({ adapter, schemaBuildContext }): GlobalModel | null`.

- [ ] **Step 1: Add the optional context to `buildSchema` and every field generator**

Add the optional property to the existing inline argument type, then derive one context at the start of the existing function body:

```ts
schemaBuildContext?: MongoSchemaBuildContext

const schemaBuildContext =
  args.schemaBuildContext ?? createSchemaBuildContext<Schema>()
```

Add `schemaBuildContext: MongoSchemaBuildContext` as the sixth `FieldSchemaGenerator` argument. Pass it from the top-level field loop and through all recursive routes: array, blocks, collapsible, named and unnamed groups, row, named and unnamed tabs. Pass it to every nested `buildSchema` call.

- [ ] **Step 2: Cache the resolved block template by identity and variant**

Resolve a string block reference before asking the context for a template. Return early for a missing reference as the existing code does. Use effective localization, not only the direct field flag:

```ts
const isLocalized = Boolean(parentIsLocalized || field.localized)
const blockSchema = schemaBuildContext.getOrCreate({
  build: () => {
    const template = new mongoose.Schema({}, { _id: false, id: false })

    for (const blockField of block.fields) {
      if (!fieldIsVirtual(blockField)) {
        getSchemaGenerator(blockField.type)?.(
          blockField,
          template,
          payload,
          buildSchemaOptions,
          isLocalized,
          schemaBuildContext,
        )
      }
    }

    return template
  },
  definition: block,
  label: `block:${block.slug}`,
  variantKey: getBlockSchemaVariantKey({ buildSchemaOptions, isLocalized }),
})
```

Pass this template to Mongoose's existing `discriminator(block.slug, blockSchema)` call. Do not add `clone: false`.

- [ ] **Step 3: Make initialization own the context lifecycle**

Refactor changed functions to object parameters. In `init.ts`, create the context after `afterCreateConnection` and wrap all model construction in `try/finally`:

```ts
const schemaBuildContext = createSchemaBuildContext<Schema>()

try {
  // Build live collections, collection versions, globals, and global versions.
  // Pass schemaBuildContext to every build call.
} finally {
  schemaBuildContext.clear()
}
```

The `finally` block must run for successful initialization and for any schema or model compilation error. Do not assign the context to the adapter or Payload object.

- [ ] **Step 4: Run the focused unit tests**

Run:

```bash
pnpm exec vitest run --project unit packages/payload/src/database/createSchemaBuildContext.spec.ts packages/db-mongodb/src/models/buildSchema.spec.ts
```

Expected: PASS. Confirm the diamond graph reports one miss per block and variant, repeated references report hits, and context clearing does not change compiled schema descriptors.

- [ ] **Step 5: Build both changed packages**

Run:

```bash
pnpm run build:payload
pnpm run build:db-mongodb
```

Expected: PASS with no declaration-generation errors from `payload/internal` imports.

- [ ] **Step 6: Commit the MongoDB implementation**

```bash
git add packages/db-mongodb/src/init.ts packages/db-mongodb/src/models/buildSchema.ts packages/db-mongodb/src/models/buildCollectionSchema.ts packages/db-mongodb/src/models/buildGlobalModel.ts
git commit -m "fix: reuse MongoDB block schema templates"
```

### Task 5: Add focused MongoDB behavior and reload regression coverage

**Files:**

- Create: `test/mongodb-schema-build-cache/config.ts`
- Create: `test/mongodb-schema-build-cache/int.spec.ts`
- Create: `test/mongodb-schema-build-cache/payload-types.ts`

**Interfaces:**

- Consumes: the normal Payload Local API, the shared integration fixture, `reload`, and MongoDB adapter models.
- Produces: MongoDB-only end-to-end behavior proof for cached schemas.

- [ ] **Step 1: Create the fixture configuration**

Use `buildConfigWithDefaults` with `suite: 'mongodb-schema-build-cache'` and a `config` object containing the collections, blocks, and localization values below. Define shared slugs as exported constants. The fixture must contain:

- A `numeric-targets` collection with a number `id` field.
- A shared `leaf` config block with localized text, an optional unique text field, a point field, and a relationship to `numeric-targets`.
- `left` and `right` blocks that each contain a blocks field referring to `leaf`.
- A `root` block with blocks fields referring to `left` and `right`.
- A `pages` collection with drafts enabled and two blocks fields referring to `root`, one localized and one not localized.
- Localization with `en` and `de` locale codes.

Register blocks once in top-level `config.blocks` and use string block slugs everywhere else.

- [ ] **Step 2: Write the integration tests before generating types or changing fixture support**

Use the shared fixture exactly once at the root and limit the suite to MongoDB:

```ts
test.suite({ config: './config.ts', db: 'mongo' })(
  'MongoDB schema build cache',
  () => {
    test('should create and read nested referenced blocks')
    test('should update a value inside a nested referenced block')
    test('should keep localized nested blocks independent in en and de')
    test('should create and read a version with nested referenced blocks')
    test('should preserve numeric relationship values inside cached blocks')
    test('should preserve unique and geospatial index definitions')
    test('should rebuild block templates after a configuration reload')
  },
)
```

Each test must verify one behavior. Use `payload.create`, `payload.findByID`, `payload.update`, and `payload.findVersions`. For the index test, read the compiled `pages` Mongoose schema from `payload.db.collections.pages` and assert the unique and `2dsphere` definitions including options.

For reload isolation, keep the original sanitized config, make a shallow replacement of the `leaf` block with a new `secondConfigValue` text field, and call:

```ts
await reload(alternateConfig, payload, true, { disableDBConnect: true })
```

Assert the new compiled discriminator contains `secondConfigValue`. In `finally`, reload the original config so the test leaves the file-scoped fixture unchanged.

- [ ] **Step 3: Run the new suite and confirm the fixture fails before completion**

Run:

```bash
pnpm run test:int mongodb-schema-build-cache
```

Expected: FAIL until the fixture types and exact nested document data are complete. Any failure caused by cached-schema behavior must remain visible; do not weaken assertions to make the suite pass.

- [ ] **Step 4: Generate fixture types and complete exact document assertions**

Run:

```bash
pnpm run dev:generate-types mongodb-schema-build-cache
```

Use the generated types in the tests. Complete each create and update payload with explicit `blockType` values for `root`, `left`, `right`, and `leaf`. Assert returned values at every nested level, use `depth: 0` for relationship ID assertions, and read localized data with `locale: 'all'`.

- [ ] **Step 5: Run the focused integration suite**

Run:

```bash
pnpm run test:int mongodb-schema-build-cache
```

Expected: PASS on MongoDB. The suite must report as skipped when run with `PAYLOAD_DATABASE=postgres` because it is adapter-specific.

- [ ] **Step 6: Commit the behavior coverage**

```bash
git add test/mongodb-schema-build-cache
git commit -m "test: verify cached MongoDB block schemas"
```

### Task 6: Run the post-change benchmark and apply the measured optimization gate

**Files:**

- Create: `docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md`
- Modify only if evidence qualifies: the smallest adapter file responsible for the measured remaining allocation category and its focused test.

**Interfaces:**

- Consumes: baseline JSON from Task 1 and the unchanged benchmark command.
- Produces: cached JSON, a generated comparison report, cache attribution, and a documented decision about further optimization.

- [ ] **Step 1: Add cache-event attribution mode to the existing benchmark worker**

Extend `measureSchemas.worker.ts` and `measureSchemas.ts` with `--attribution`. This mode must build schemas directly with `buildCollectionSchema`, `buildSchema`, and a diagnostic `createSchemaBuildContext<Schema>({ onEvent })`. It must cover live collections, collection versions, global schemas, and global versions with the same options used by `init.ts`. On each `store` event, call `describeMongooseSchema`; aggregate hits and misses by `label` and `variantKey`; clear the context before exit. This mode must not replace the end-to-end memory mode.

Run a one-scenario smoke check first:

```bash
pnpm bench:mongodb-schema-build -- --attribution --scenario nested-diamond --output /private/tmp/mongodb-schema-build-attribution-smoke.json
```

Expected: PASS with one miss per distinct block and variant, hits greater than zero, and a descriptor for every stored template.

- [ ] **Step 2: Record the five-run cached result and full attribution**

Run:

```bash
pnpm bench:mongodb-schema-build -- --iterations 5 --output /private/tmp/mongodb-schema-build-cached.json
pnpm bench:mongodb-schema-build -- --attribution --output /private/tmp/mongodb-schema-build-attribution.json
shasum -a 256 /private/tmp/mongodb-schema-build-cached.json
shasum -a 256 /private/tmp/mongodb-schema-build-attribution.json
```

Expected: PASS. All seven scenarios must have five valid samples. The nested issue-style scenarios must show misses proportional to distinct block definitions and variants, not reference paths.

- [ ] **Step 3: Generate and inspect the comparison report**

Run:

```bash
pnpm bench:mongodb-schema-build -- --compare /private/tmp/mongodb-schema-build-baseline.json /private/tmp/mongodb-schema-build-cached.json --attribution-file /private/tmp/mongodb-schema-build-attribution.json --markdown docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md
```

The generated report must start with `Written with AI` and include environment details, both file digests, absolute memory, initialization deltas, memory above each revision's minimal scenario, initialization time, schema constructor counts, reachable schema counts, attribution categories, cache hits and misses by block and variant, and one representative cached schema descriptor.

- [ ] **Step 4: Check the acceptance thresholds**

Require all of the following:

1. At least 95% fewer `mongoose.Schema` constructor calls for `wide-references` and `nested-diamond`, unless the report identifies the remaining calls as required discriminator attachments.
2. Lower median incremental heap for every referenced-block scenario.
3. No more than 5% regression in median incremental heap or initialization time for `inline-control`.
4. No unexplained increase in reachable schemas from compiled models.
5. Stable descriptor output and passing integration tests.

If a threshold fails, stop the optimization task and diagnose the failing metric with constructor attribution and heap snapshots before changing code.

- [ ] **Step 5: Decide whether a second production optimization qualifies**

Calculate each remaining category as a share of post-cache incremental heap and constructor calls. A second optimization qualifies only if one named category has a concrete implementation that:

- Reduces median incremental heap in an affected nonminimal scenario by at least 15% beyond the context cache.
- Keeps the inline control within the 5% guardrail.
- Preserves every descriptor and integration assertion.
- Keeps cache lifetime inside one adapter initialization.
- Does not share a schema after parent-specific discriminator metadata is attached.

`clone: false` is rejected unless a new failing mutation-safety test proves a safe ownership boundary for every parent registration. If no candidate meets every condition, add a clear “No additional optimization included” decision to the report and list the measured residual categories as follow-up work. This is the expected safe outcome, not an incomplete task.

- [ ] **Step 6: If and only if a candidate qualifies, add its failing test before its implementation**

Add one focused test to `packages/db-mongodb/src/models/buildSchema.spec.ts` that counts or describes the exact repeated category. Run it and record the failure. Implement only the measured change, rerun the focused unit and integration suites, then rerun five benchmark repetitions into a third file. Keep the change only if the third result satisfies every gate; otherwise revert only that uncommitted candidate change and retain the context-cache result.

- [ ] **Step 7: Commit the evidence and any qualified optimization**

Run:

```bash
git add docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md
git add packages/db-mongodb/src/models/buildSchema.spec.ts packages/db-mongodb/src/models/buildSchema.ts
git diff --cached --check
git commit -m "docs: report MongoDB schema cache benchmarks"
```

Before staging the two adapter paths, confirm they changed. If no second optimization qualified, stage and commit only the report.

### Task 7: Complete repository verification and review

**Files:**

- Verify all changed files.
- Modify only for defects found by the commands below, with a new failing test before any behavior correction.

**Interfaces:**

- Consumes: all implementation, integration coverage, and benchmark evidence.
- Produces: a verified branch ready for a pull request.

- [ ] **Step 1: Run focused unit tests**

```bash
pnpm exec vitest run --project unit packages/payload/src/database/createSchemaBuildContext.spec.ts packages/db-mongodb/src/models/buildSchema.spec.ts test/benchmark-blocks/benchmarkReport.unit.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused and existing MongoDB integration suites**

```bash
pnpm run test:int mongodb-schema-build-cache
pnpm run test:int fields
pnpm run test:int versions
```

Expected: PASS. These suites cover the new graph and the existing broad blocks, localization, custom ID, and version behavior.

- [ ] **Step 3: Run package builds and test-suite type checking**

```bash
pnpm run build:payload
pnpm run build:db-mongodb
pnpm run build:tests
```

Expected: PASS.

- [ ] **Step 4: Run lint, formatting, and whitespace checks on changed files**

```bash
pnpm exec eslint packages/payload/src/database/createSchemaBuildContext.ts packages/payload/src/database/createSchemaBuildContext.spec.ts packages/payload/src/exports/internal.ts packages/db-mongodb/src/init.ts packages/db-mongodb/src/models/buildSchema.ts packages/db-mongodb/src/models/buildSchema.spec.ts packages/db-mongodb/src/models/buildCollectionSchema.ts packages/db-mongodb/src/models/buildGlobalModel.ts packages/db-mongodb/src/models/schemaBuildContext.ts test/benchmark-blocks test/mongodb-schema-build-cache
pnpm exec prettier --check packages/payload/src/database packages/payload/src/exports/internal.ts packages/db-mongodb/src/init.ts packages/db-mongodb/src/models test/benchmark-blocks test/mongodb-schema-build-cache docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md
git diff --check origin/main...HEAD
```

Expected: PASS.

- [ ] **Step 5: Run the full MongoDB integration suite if the focused verification is clean**

```bash
pnpm run test:int
```

Expected: PASS. If an unrelated pre-existing failure occurs, rerun that file once and record the exact failure without claiming it is caused by this change.

- [ ] **Step 6: Use the verification and code-review skills**

Read and follow `superpowers:verification-before-completion`, then `requesting-code-review`. Review the full branch diff against the design spec, with special attention to context lifetime, variant completeness, Mongoose discriminator cloning, reload isolation, and benchmark reproducibility. Fix each confirmed issue with a failing test first and repeat the affected verification command.

- [ ] **Step 7: Commit any review corrections**

```bash
git status --short
git diff --check
```

If review corrections exist, stage only those files and commit them with a specific non-AI-attributed message. If no corrections exist, do not create an empty commit.

### Task 8: Open the pull request and report results

**Files:**

- No repository files unless final verification identifies a documented correction.

**Interfaces:**

- Produces: a pushed branch, a GitHub pull request linked to issue `#17214`, and a final user report with benchmark results and recommendations.

- [ ] **Step 1: Draft the pull request description from verified evidence**

Use the `write-pr-description` skill. The description must visibly include `Written with AI` and these sections:

```markdown
**Written with AI**

## What changed

## Root cause

## Why the cache lifetime is correct

## Adapter and API scope

## Schema safety

## Benchmarks

## Allocation attribution

## Verification

## Follow-up recommendations
```

State that the behavior change is limited to the MongoDB adapter, that all Payload APIs on MongoDB benefit during initialization, and that the Figma Content API and Drizzle adapters do not build Mongoose schemas. Link issue `#17214`. Copy benchmark values only from the generated report.

- [ ] **Step 2: Check branch state before publishing**

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

Expected: clean working tree and only intended commits.

- [ ] **Step 3: Push and create the pull request**

```bash
git push -u origin codex/fix-mongodb-block-schema-memory
gh pr create --base main --head codex/fix-mongodb-block-schema-memory --title "fix(db-mongodb): reduce referenced block schema memory" --body-file /private/tmp/mongodb-schema-build-pr.md
```

After GitHub returns the URL, attach it to this task with the pull-request artifact tool.

- [ ] **Step 4: Post the final technical summary and benchmark evidence**

Report:

- The PR URL.
- The exact before/after median RSS, heap delta, initialization time, constructor count, and reachable-schema count for each scenario.
- Which schema shapes gained most and least.
- Whether a second optimization met the 15% gate.
- The technical before/after flow: recursive route expansion before, initialization-scoped template reuse plus required Mongoose attachment clones after.
- Why schemas, indexes, localization, versions, custom IDs, stored data, REST, GraphQL, and Local API behavior remain correct.
- The Figma Content API and Drizzle scope conclusion.
- Follow-up recommendations, separated from the merge recommendation.

Do not claim the work is complete until all required checks have passed and the PR exists.

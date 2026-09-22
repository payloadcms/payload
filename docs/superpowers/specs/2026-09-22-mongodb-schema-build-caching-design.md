# MongoDB Schema Build Caching Design

**Written with AI**

## Status

Proposed for review.

## Context

The MongoDB adapter creates Mongoose schemas for every collection, global, version model, nested field, and block discriminator during Payload initialization. Config-level block references allow many fields and blocks to reuse the same block definition. The current MongoDB schema builder resolves each reference and rebuilds the complete nested block schema every time it appears.

A wide, nested block graph is therefore expanded once for every route through that graph. Draft-enabled entities multiply the work because Payload builds both live and version schemas. Multiple collections and globals multiply it again. The resulting allocation growth follows the number of routes through the graph rather than the number of distinct block definitions.

Issue `payloadcms/payload#17214` reports 193,751 `mongoose.Schema` allocations and approximately 2.5 GiB RSS for one representative layout configuration. A proof-of-concept block-template cache reduces those measurements substantially, but its module-level lifetime can reuse a template across unrelated Payload configurations.

## Goals

- Build each distinct MongoDB block schema template once per schema variant during one adapter initialization.
- Prevent cached Mongoose objects from crossing adapter initialization, Payload instance, configuration, hot reload, or test boundaries.
- Preserve all existing Mongoose schema paths, field types, indexes, localization wrappers, discriminator behavior, and stored document shapes.
- Provide a small generic schema-build context that other database adapters can reuse without importing Mongoose concepts.
- Provide optional diagnostic events that can describe cache hits, misses, variants, and stored schema artifacts without adding production logging.
- Add deterministic regression tests for cache behavior and schema correctness.
- Add an independent, repeatable benchmark that reports allocation, retained-memory, and initialization-time changes.
- Identify which models and schema categories receive the largest benefit.
- Measure the remaining cost against a minimal Payload MongoDB baseline before deciding whether more optimization is justified.

## Non-goals

- Add RSS or heap thresholds to normal CI in this pull request.
- Change database storage, collection names, indexes, API response shapes, or generated Payload types.
- Share Mongoose schemas with the Figma Content API or Drizzle adapters.
- Add a structural hash for blocks. Object identity remains the definition identity because two structurally equal inline blocks can have different ownership and future behavior.
- Disable Mongoose discriminator cloning without separate evidence that the resulting schema is not changed by parent-specific discriminator registration.
- Add a permanent production profiler or expose cached Mongoose schemas through Payload's public API.

## Design principles

### Reuse the lifecycle, not the adapter artifact

Database adapters compile different artifacts. MongoDB builds Mongoose schemas, Drizzle builds relational schema structures, and the Figma Content API builds its own wire schema. Core Payload must not treat these objects as interchangeable.

The reusable concept is an initialization-scoped schema-build context:

- One context belongs to one adapter initialization.
- The adapter defines the artifact type and variant key.
- The context caches by source-object identity and variant key.
- A new initialization receives a new context.
- The context can emit optional diagnostic events to a caller-provided observer.
- The context can be cleared or released after compilation.

This gives adapters the same cache lifecycle and inspection interface while allowing each adapter to define its own schema semantics.

### Keep the generic helper internal

The generic helper will live in Payload core under `packages/payload/src/database/` and be exported through `payload/internal`. It will not be part of the public `payload` package API. Official and external adapters can adopt it without committing Payload to a stable public API before more than one adapter has used it.

### Make cache ownership explicit

The MongoDB adapter will create a `SchemaBuildContext<mongoose.Schema>` at the start of `init()`. The same context will be passed to live collection, version collection, global, global-version, and recursive nested-field schema construction. It will not be stored in module state.

The context will be released after model compilation. Compiled models retain the Mongoose discriminator schemas they need. Build-only template roots that are not referenced by compiled models can then be collected.

## Generic schema-build context

Payload core will provide an internal factory with behavior equivalent to the following interface:

```ts
export type SchemaBuildCacheEvent<TSchema> = {
  action: 'hit' | 'miss' | 'store'
  label: string
  schema?: TSchema
  variantKey: string
}

export type SchemaBuildContext<TSchema> = {
  clear: () => void
  getOrCreate: (args: {
    build: () => TSchema
    definition: object
    label: string
    variantKey: string
  }) => TSchema
  snapshot: () => {
    entries: Array<{
      hits: number
      label: string
      misses: number
      variantKey: string
    }>
    hits: number
    misses: number
  }
}

export const createSchemaBuildContext = <TSchema>(args?: {
  onEvent?: (event: SchemaBuildCacheEvent<TSchema>) => void
}): SchemaBuildContext<TSchema>
```

The implementation will use a `WeakMap<object, Map<string, TSchema>>`. The optional observer receives the schema only on `store`, which lets a benchmark describe a cached artifact without retaining diagnostic data in normal production use. The context itself will retain aggregate counters and label-based counts only until it is released.

`getOrCreate` is synchronous because current adapter schema construction is synchronous. The factory will not attempt to cache failed builds. Recursive cycles remain subject to Payload's existing block-configuration validation and are not introduced or hidden by this cache.

## MongoDB variant identity

The MongoDB adapter will own a named variant type rather than concatenate unnamed booleans at each call site:

```ts
type BlockSchemaVariant = {
  disableUnique: boolean
  draftsEnabled: boolean
  indexSortableFields: boolean
  isLocalized: boolean
}
```

A single helper will convert this value into a stable key. `undefined` and `false` will have the same key where their existing schema behavior is the same.

These four inputs affect the generated template:

- `disableUnique` changes unique-index options.
- `draftsEnabled` changes sparse indexes and select-field null handling.
- `indexSortableFields` changes field index generation.
- `isLocalized` changes localized wrappers and nested field behavior.

Payload-specific state such as locale codes, registered block references, custom ID types, and `useBigIntForNumberIDs` does not need to appear in this variant key because the context cannot cross adapter initialization. Those values remain constant for the life of the context.

## MongoDB build flow

The adapter initialization will follow this sequence:

1. Create one schema-build context.
2. Build each live collection schema with that context.
3. Build each collection version schema with that context.
4. Build global discriminators with that context.
5. Build global version schemas with that context.
6. Register all Mongoose models as before.
7. Capture diagnostics only when a benchmark or test supplied an observer.
8. Clear and release the context before `init()` returns.

When a blocks field is processed, the adapter will resolve a string reference through `payload.blocks` as it does now. It will then call `getOrCreate` with the resolved block object, block slug, and variant key. On a miss, it will build the template recursively using the same context. On a hit, it will pass the existing template to Mongoose's document-array discriminator method.

Mongoose clones a discriminator schema before adding parent-specific discriminator metadata. Payload will continue to rely on that supported behavior. The cache will not pass `{ clone: false }` in the initial implementation.

## Schema correctness and inspection

The pull request will include a benchmark-only Mongoose schema descriptor. It will convert a cached template or compiled model schema into inspectable JSON containing:

- Schema category and label.
- Variant flags.
- Direct path names.
- Mongoose path instance types.
- Nested document-array paths.
- Registered discriminator names.
- Declared indexes and relevant index options.
- Schema options that affect stored documents, including `_id`, `id`, `minimize`, timestamps, and discriminator key.
- The number of unique reachable schema objects, counted with a `WeakSet`.

The descriptor will not serialize functions, internal model constructors, or full schema objects. It is diagnostic output, not a compatibility format.

Correctness tests will compare descriptors for cached and independently built schemas. They will also perform MongoDB create, read, update, version, and localization operations so the test suite checks behavior as well as structural metadata.

## Test strategy

Tests must be written and observed failing before production code changes.

### Generic context unit tests

Tests in Payload core will verify:

- Repeated source identity and variant return one artifact and call the builder once.
- Different variants of one source build separate artifacts.
- Different source objects with equal content build separate artifacts.
- Two contexts never share artifacts.
- Failed builders do not populate the cache.
- Observer events and snapshot counts are correct.
- `clear()` removes all cache entries and counters.

### MongoDB schema-builder unit tests

A small diamond-shaped block graph will verify:

- Shared descendant blocks have one template miss per variant.
- Repeated references produce cache hits.
- Live and version schemas use the correct distinct variants.
- Localized and nonlocalized placements use distinct variants.
- Contexts created for configurations with different locale codes do not share templates.
- Contexts created for different custom relationship ID types do not share templates.
- Inline block objects are cached only when the same object identity is reused.
- Template descriptors preserve paths, types, indexes, options, and discriminator names.
- Clearing or releasing the build context does not damage compiled model schemas.

### MongoDB integration tests

Focused integration coverage will verify:

- Create and read nested referenced blocks.
- Update a nested block value.
- Create and read localized nested blocks in at least two locales.
- Create and read a versioned document with nested referenced blocks.
- Relationship fields inside a cached block use the configured custom ID type.
- Unique and geospatial indexes inside block schemas remain present with the same options.
- A second Payload initialization with a different configuration does not inherit the first schema.

The existing MongoDB integration suite will run after the focused tests.

## Benchmark design

The benchmark will be committed under `test/benchmark-blocks/` but will not use a `*.spec.ts` filename or be added to standard CI scripts. A documented package script will run it manually.

### Isolation

The benchmark controller will start a new child process for every scenario and repetition. Each worker will run Node with `--expose-gc`, disable the database connection, disable type generation and seed hooks, and force garbage collection at defined measurement points.

The benchmark will have two modes. The end-to-end mode will initialize Payload normally and measure process memory, schema allocations, and elapsed time. The attribution mode will invoke the same schema builders with a diagnostic context so it can record cache events and describe stored templates. The attribution mode will not be used as a substitute for the end-to-end memory result.

Each scenario will run at least five times on the same commit and machine. The report will use medians and show minimum and maximum values. Raw JSON will include the Node, operating system, architecture, Mongoose, Payload, and Git revision information needed to reproduce the result.

### Measurement points

Each worker will report:

- After imports and sanitized configuration, before adapter initialization.
- After adapter initialization, model compilation, automatic context release, and garbage collection.
- After Payload destruction and garbage collection runs.

The report will include absolute values and initialization deltas for:

- RSS.
- Heap used.
- Heap total.
- External memory.
- Initialization wall-clock time.
- Total `mongoose.Schema` constructor calls.
- Unique schema objects reachable from compiled models.

RSS is supporting evidence because it is noisy. Median initialization heap delta and deterministic schema counts are the main comparison values.

### Scenarios

1. **Minimal:** Required Payload system collections with no user block graph. This establishes the runtime floor.
2. **Wide referenced blocks:** The existing `benchmark-blocks` pattern with many fields referring to shared leaf blocks.
3. **Nested diamond graph:** Several roots and containers converge on shared descendants, reproducing the path multiplication from issue `#17214`.
4. **Nested graph with drafts:** The same graph with live and version schemas.
5. **Nested graph with drafts and localization:** The same graph in localized and nonlocalized contexts.
6. **Multiple collections and globals:** Shared block definitions used by several collections and one global, with versioning enabled.
7. **Inline control:** Equivalent inline blocks with separate object identities. This establishes where reuse is intentionally limited.

### Attribution

Schema constructor calls will be classified by the first relevant stack frame into:

- Top-level collection/global schemas.
- Version schemas.
- Block field base schemas.
- Cached block templates.
- Mongoose discriminator clones.
- Array, group, and named-tab schemas.
- Other Mongoose-internal clones.

Results will also be grouped by collection/global model, live/version role, block slug, and variant key. Cache events will report the blocks with the most hits and the variants responsible for misses.

The final report will show which categories were removed, which remain necessary, and how much of the post-fix RSS belongs to the minimal Payload runtime rather than the layout graph.

## Measured optimization gate

The first production implementation will contain only the initialization-scoped context and block-template caching. Benchmarks will run before and after that change.

Further production optimization may be included in the same pull request only when all of these conditions are true:

- Allocation attribution identifies a specific remaining source rather than an assumed one.
- The change reduces median incremental heap for at least one affected nonminimal scenario by at least 15 percent beyond the context cache.
- It does not increase median incremental heap or initialization time for the inline control by more than 5 percent.
- Schema descriptor and integration tests prove equivalent paths, indexes, options, discriminators, localization, versions, and custom relationship ID behavior.
- Cache lifetime remains limited to one adapter initialization.
- The implementation does not share a discriminator schema after Mongoose has added parent-specific metadata.

If no candidate satisfies the gate, the pull request will stop at the safe context cache and document the residual allocation categories as follow-up recommendations.

## Benchmark reporting and pull request communication

The pull request description will contain:

- The exact root cause.
- Why an initialization-scoped cache is correct.
- Why the change is MongoDB-specific while the context lifecycle is reusable.
- Before-and-after benchmark tables for every scenario.
- Schema allocation attribution.
- One representative cached-schema descriptor.
- The minimal-runtime comparison needed to interpret absolute RSS.
- Commands and environment details required to reproduce the results.
- Any additional optimization accepted through the measured gate.
- Follow-up recommendations for memory-performance tracking that are not included in this pull request.

The description and any public benchmark report will include the required `Written with AI` label.

## Acceptance criteria

- No module-level cache stores schema artifacts.
- A new adapter initialization always receives an empty context.
- The nested diamond benchmark shows template misses proportional to distinct blocks and variants rather than routes through the graph.
- The implementation achieves at least a 95 percent reduction in `mongoose.Schema` constructor calls for the nested issue-style scenario relative to the current implementation, unless attribution proves that the remaining calls are required discriminator attachments.
- Cached and independently built schema descriptors are equivalent for all covered variants.
- Focused MongoDB behavior tests and the existing MongoDB integration suite pass.
- The inline control does not regress median incremental heap or initialization time by more than 5 percent.
- Benchmark scripts are repeatable, documented, and excluded from normal CI.
- The pull request reports absolute memory and memory above the minimal baseline.

## Follow-up work outside this pull request

- Decide whether scheduled performance jobs should retain benchmark history and detect long-term regressions.
- Evaluate adoption of the internal schema-build context in the Figma Content API or Drizzle adapters when they have a demonstrated repeated-compilation cost.
- Consider a stable public adapter API only after at least two adapters use the internal context successfully.
- Evaluate heap-snapshot comparison tooling separately from normal CI thresholds.

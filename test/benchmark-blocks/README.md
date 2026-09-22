# MongoDB Schema Build Benchmark

**Written with AI**

This benchmark measures Mongoose schema construction during Payload initialization. It covers a minimal config, wide block references, nested shared block graphs, drafts, localization, multiple entities, and separate inline block objects.

Each sample runs in a fresh Node.js child process with `--expose-gc`. The worker disables the database connection and type generation. It records memory before initialization, after model compilation and garbage collection, and after Payload destruction and garbage collection.

Run all scenarios five times:

```sh
pnpm bench:mongodb-schema-build -- --iterations 5 --output /private/tmp/mongodb-schema-build.json
```

Run one scenario once for a smoke check:

```sh
pnpm bench:mongodb-schema-build -- --iterations 1 --scenario minimal --output /private/tmp/mongodb-schema-build-smoke.json
```

Compare two result files:

```sh
pnpm bench:mongodb-schema-build -- --compare /private/tmp/before.json /private/tmp/after.json --markdown docs/superpowers/reports/2026-09-22-mongodb-schema-build-caching-benchmarks.md
```

RSS is supporting evidence because the operating system and allocator can retain released pages. Median heap delta and deterministic Mongoose schema construction counts are the primary evidence. Reachable schemas show whether compiled model structure changed.

The heavy benchmark is manual. Standard test and CI commands do not run it. The small report and descriptor unit tests remain part of the unit suite.

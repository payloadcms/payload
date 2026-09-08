# SQLite tooling runtime regression

This optional fixture exercises the workspace SQLite/D1 adapters with the issue's
Next.js 16.2.4 / OpenNext 1.19.4 versions. Run it from a copy under the ignored
`tmp/` directory; it is intentionally outside the pnpm workspace. It needs no
Cloudflare account, database credentials, or deployment.

From the repository root after installing workspace dependencies:

```sh
mkdir -p tmp
cp -R test/drizzle-kit-runtime tmp/drizzle-kit-runtime
cd tmp/drizzle-kit-runtime
npm install --ignore-scripts --no-audit --no-fund
node setup.mjs
npm run build
npm run build:worker
npm run verify:output
```

`setup.mjs` links the actual workspace adapters and moves the local lockfile so
OpenNext detects the same monorepo root as Next. Keep `validation-lock.json` with
build logs when reporting results. Use a fresh copy for each run.

`verify:output` checks `.next/server/**/*.nft.json` and `.open-next/` for Drizzle Kit package files
or hashed `drizzle-kit-<hash>/api` imports. Neither should be present. The lazy
wrapper's function names and error text can remain in JavaScript output.

Run `npx wrangler dev --local` and request `/api/d1`: expect HTTP 200 and
`{"d1":"function"}`. This validates adapter loading, not D1 database operations.
The SQLite route `/api/sqlite` separately exposes libSQL runtime compatibility:
this version combination can fail with an unresolved `@libsql/client-<hash>`
alias, independently of Drizzle Kit. Do not count Worker bundling alone as a
successful SQLite runtime test.

Run `npm run dev` and request `/api/tooling`: expect HTTP 200 and
`{"dialect":"sqlite"}`. Server packages are deliberately bundled in development
so this checks adapter-relative resolution after Turbopack transforms them.
Stop both servers and remove the temporary fixture after testing.

The fast automated tests run without these fixture dependencies:

```sh
pnpm test:unit packages/drizzle/src/sqlite/createRequireDrizzleKit.spec.ts packages/drizzle/src/sqlite/drizzleKitRuntimeGraph.spec.ts packages/drizzle/src/sqlite/drizzleKitTooling.spec.ts packages/payload/src/utilities/dynamicImport.spec.ts
```

They cover deferred/concurrent loads, failure recovery, API mapping, emitted
adapter bundles, and real snapshot/migration generation and schema application
in a Node subprocess without `VITEST`. Schema application uses disposable
in-memory libSQL databases for both adapter resolution roots, not a D1 binding.

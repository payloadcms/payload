import { mkdirSync, renameSync, symlinkSync } from 'node:fs'

const modules = new URL('./node_modules/@payloadcms/', import.meta.url)
mkdirSync(modules, { recursive: true })
for (const adapter of ['db-sqlite', 'db-d1-sqlite', 'next']) {
  symlinkSync(
    new URL(`../../packages/${adapter}`, import.meta.url),
    new URL(adapter, modules),
    'dir',
  )
}
// OpenNext and Next must agree on the monorepo root. Preserve the fixture's resolved versions.
renameSync(
  new URL('./package-lock.json', import.meta.url),
  new URL('./validation-lock.json', import.meta.url),
)

/**
 * Bin for `pnpm list-published`: prints each publishable package's latest/beta/canary
 * dist-tag versions from the npm registry. Kept separate from the library module so
 * the report never runs as a side effect of importing `isVersionPublished`.
 */
import { getPackageRegistryVersions } from './lib/getPackageRegistryVersions.js'

getPackageRegistryVersions().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

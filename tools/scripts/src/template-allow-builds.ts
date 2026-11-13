/**
 * Dependency build scripts a standalone template has to run.
 *
 * pnpm v11+ reads build approvals only from the `allowBuilds` map in pnpm-workspace.yaml: the
 * `pnpm` field in package.json is ignored, and `strictDepBuilds` defaults to true, so a dependency
 * build that has not been approved fails the install with ERR_PNPM_IGNORED_BUILDS. This is the list
 * the template preview install approves and the list each generated non-workspace template ships.
 *
 * `bufferutil` and `utf-8-validate` are direct dependencies of `@vercel/postgres`, which
 * `@payloadcms/db-vercel-postgres` depends on, so the Vercel Postgres template pulls them.
 */
export const TEMPLATE_ALLOW_BUILDS = [
  '@swc/core', // plugin template
  'bufferutil', // @vercel/postgres, via @payloadcms/db-vercel-postgres
  'esbuild',
  'mongodb-memory-server', // plugin template
  'sharp',
  'unrs-resolver',
  'utf-8-validate', // @vercel/postgres < 0.10
  'workerd', // with-cloudflare-d1 template
]

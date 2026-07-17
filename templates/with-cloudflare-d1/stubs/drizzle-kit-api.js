// Stub for drizzle-kit/api
//
// drizzle-kit/api is only used by the Payload CLI for migrations and schema
// operations — never at runtime in a Cloudflare Worker. However, it is
// transitively imported by @payloadcms/drizzle/sqlite, so without a stub it
// gets pulled into the OpenNext Cloudflare server bundle (~7.3 MiB).
//
// withPayload() already externalizes drizzle-kit/api via webpack externals
// and serverExternalPackages, but OpenNext's esbuild-based bundler does not
// fully respect those — it still tries to resolve and bundle the module.
// Aliasing to this stub in next.config.ts prevents that.
//
// This is a workaround until https://github.com/payloadcms/payload/pull/17009
// (lazy-load drizzle-kit) is merged and published.
//
// See: https://github.com/payloadcms/payload/issues/16470
module.exports = {
  generateSQLiteDrizzleJson: () => {
    throw new Error('drizzle-kit/api is stubbed in production build')
  },
  generateSQLiteMigration: () => {
    throw new Error('drizzle-kit/api is stubbed in production build')
  },
  pushSQLiteSchema: () => {
    throw new Error('drizzle-kit/api is stubbed in production build')
  },
}

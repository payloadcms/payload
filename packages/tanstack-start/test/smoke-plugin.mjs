// Smoke test: verifies `withPayload` still produces a valid Vite config shape
// and that all Payload workaround sub-modules wire up correctly. Run against the
// built output: `node packages/tanstack-start/test/smoke-plugin.mjs`.
//
// The React, RSC, and TanStack Start plugins are now instantiated internally, so
// this test no longer injects mocks for them — it validates the parts of the
// config `withPayload` owns directly.
import { withPayload } from '../dist/exports/vite.js'

const factory = withPayload({
  payloadConfigPath: '/tmp/fake-payload.config.ts',
})

const config = factory({ command: 'serve', mode: 'development' })

const errors = []
const expectKey = (obj, key) => {
  if (!(key in obj)) errors.push(`missing key: ${key}`)
}

expectKey(config, 'css')
expectKey(config, 'define')
expectKey(config, 'environments')
expectKey(config, 'optimizeDeps')
expectKey(config, 'plugins')
expectKey(config, 'resolve')
expectKey(config, 'ssr')

const pluginNames = config.plugins
  .filter(Boolean)
  .flat()
  .map((p) => p?.name)
  .filter(Boolean)

// The Payload workaround plugins we own by name — the RSC/TanStack/React plugins
// are third-party and may be returned as arrays, so we don't assert their names.
for (const expected of [
  'payload:client-module-resolution',
  'payload:wrap-cjs-client',
  'payload:ssr-strip-dist-style-imports',
  'payload:react-dom-server-in-rsc',
  'payload:dev-transforms',
]) {
  if (!pluginNames.includes(expected)) errors.push(`missing plugin: ${expected}`)
}

if (!config.ssr.external.includes('drizzle-kit')) errors.push('ssr.external missing drizzle-kit')
if (!config.ssr.noExternal.some((p) => p === '@payloadcms/ui'))
  errors.push('ssr.noExternal missing @payloadcms/ui')

if (!config.optimizeDeps.include.includes('react-dom > scheduler')) {
  errors.push('optimizeDeps.include missing react-dom > scheduler')
}
if (!config.optimizeDeps.exclude.includes('payload')) {
  errors.push("optimizeDeps.exclude missing 'payload'")
}
if (!config.optimizeDeps.exclude.includes('@payloadcms/ui')) {
  errors.push("optimizeDeps.exclude missing '@payloadcms/ui'")
}

// The `vite` override must be merged on top of the defaults: arrays appended,
// objects deep-merged, and the Payload base preserved.
const mergedFactory = withPayload({
  payloadConfigPath: '/tmp/fake-payload.config.ts',
  vite: {
    optimizeDeps: { include: ['recharts'] },
    server: { port: 4000 },
  },
})
const merged = mergedFactory({ command: 'serve', mode: 'development' })

if (merged.server?.port !== 4000) {
  errors.push('vite override not merged: server.port !== 4000')
}
if (!merged.optimizeDeps.include.includes('recharts')) {
  errors.push('vite override not appended: optimizeDeps.include missing recharts')
}
if (!merged.optimizeDeps.include.includes('react-dom > scheduler')) {
  errors.push('vite override clobbered base: optimizeDeps.include lost defaults')
}

if (errors.length) {
  console.error('FAIL\n' + errors.map((e) => ' - ' + e).join('\n'))
  process.exit(1)
}
console.log('OK: withPayload produces expected config shape')
console.log(
  `  ssr.external=${config.ssr.external.length}  ssr.noExternal=${config.ssr.noExternal.length}`,
)
console.log(
  `  optimizeDeps.include=${config.optimizeDeps.include.length}  optimizeDeps.exclude=${config.optimizeDeps.exclude.length}`,
)

// Smoke test: verifies the refactored payloadPlugin still produces a valid
// Vite config shape and that all sub-modules wire up correctly.
import { payloadPlugin } from '../dist/vite/plugin.js'

const fakePlugin = { name: 'fake' }
const fakeTanstackStart = (opts) => ({
  name: 'tanstack-start-mock',
  __options: opts,
})

const factory = payloadPlugin({
  payloadConfigPath: '/tmp/fake-payload.config.ts',
  reactPlugin: { ...fakePlugin, name: 'react' },
  rscPlugin: { ...fakePlugin, name: 'rsc' },
  tanstackStart: fakeTanstackStart,
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
expectKey(config, 'server')
expectKey(config, 'ssr')

const pluginNames = config.plugins.filter(Boolean).map((p) => p.name)
for (const expected of [
  'payload:client-module-resolution',
  'payload:wrap-cjs-client',
  'payload:ssr-strip-dist-style-imports',
  'payload:dev-transforms',
  'rsc',
  'tanstack-start-mock',
  'react',
]) {
  if (!pluginNames.includes(expected)) errors.push(`missing plugin: ${expected}`)
}

const tanstackMock = config.plugins.find((p) => p?.name === 'tanstack-start-mock')
if (!tanstackMock?.__options?.importProtection?.client?.specifiers?.length) {
  errors.push('importProtection.client.specifiers not wired')
}
if (
  !tanstackMock?.__options?.importProtection?.server ||
  !Array.isArray(tanstackMock.__options.importProtection.server.files) ||
  tanstackMock.__options.importProtection.server.files.length !== 0
) {
  errors.push('importProtection.server.files must be [] (disables *.client.* SSR self-denial)')
}
if (!tanstackMock?.__options?.rsc?.enabled) {
  errors.push('rsc.enabled not set')
}
if (tanstackMock?.__options?.router?.autoCodeSplitting !== false) {
  errors.push('router.autoCodeSplitting must be false (so SSR routes hydrate eagerly)')
}
const splitGroupings = tanstackMock?.__options?.router?.codeSplittingOptions?.defaultBehavior
if (!Array.isArray(splitGroupings) || splitGroupings.length !== 0) {
  errors.push(
    'router.codeSplittingOptions.defaultBehavior must be [] (the autoCodeSplitting flag is silently dropped by tanstackStart, so this is the actual mechanism that disables ?tsr-split=component lazy chunks)',
  )
}

if (!config.ssr.external.includes('drizzle-kit')) errors.push('ssr.external missing drizzle-kit')
if (!config.ssr.noExternal.some((p) => p === '@payloadcms/ui'))
  errors.push('ssr.noExternal missing @payloadcms/ui')

if (!config.optimizeDeps.include.includes('scheduler')) {
  errors.push('optimizeDeps.include missing scheduler')
}
if (!config.optimizeDeps.exclude.includes('payload')) {
  errors.push("optimizeDeps.exclude missing 'payload'")
}
if (!config.optimizeDeps.exclude.includes('@payloadcms/ui')) {
  errors.push("optimizeDeps.exclude missing '@payloadcms/ui'")
}

if (errors.length) {
  console.error('FAIL\n' + errors.map((e) => ' - ' + e).join('\n'))
  process.exit(1)
}
console.log('OK: payloadPlugin produces expected config shape')
console.log(`  plugins=${pluginNames.length}  ssr.external=${config.ssr.external.length}  ssr.noExternal=${config.ssr.noExternal.length}`)
console.log(`  optimizeDeps.include=${config.optimizeDeps.include.length}  optimizeDeps.exclude=${config.optimizeDeps.exclude.length}`)

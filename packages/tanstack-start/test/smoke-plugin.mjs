// Smoke test: verifies `withPayload` still produces a valid Vite config shape
// and that all Payload workaround sub-modules wire up correctly. Run against the
// built output: `node packages/tanstack-start/test/smoke-plugin.mjs`.
//
// The React, RSC, and TanStack Start plugins are now instantiated internally, so
// this test no longer injects mocks for them — it validates the parts of the
// config `withPayload` owns directly.
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import {
  payloadReactOptions,
  payloadRscOptions,
  payloadTanstackStartOptions,
  withPayload,
} from '../dist/exports/vite.js'

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
  'payload:stub-prettier-in-client',
  'payload:dev-transforms',
]) {
  if (!pluginNames.includes(expected)) errors.push(`missing plugin: ${expected}`)
}

// The `~@payloadcms/ui/scss` tilde importer must be wired for every consumer.
if (typeof config.css?.preprocessorOptions?.scss?.importers?.[0]?.findFileUrl !== 'function') {
  errors.push('scss tilde importer not wired')
}

// Dependency-warning suppression is on by default, so a customLogger is set.
if (!config.customLogger) {
  errors.push('customLogger not set (silenceDependencyWarnings default)')
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

// Payload's required plugin options are exposed so the consumer can call the
// plugin factories themselves. They must carry the admin's required settings.
const rscOptions = payloadRscOptions()
if (rscOptions.serverHandler !== false) {
  errors.push('payloadRscOptions missing serverHandler: false')
}

const tsOptions = payloadTanstackStartOptions()
if (tsOptions.rsc?.enabled !== true) {
  errors.push('payloadTanstackStartOptions missing rsc.enabled')
}
if (tsOptions.router?.autoCodeSplitting !== false) {
  errors.push('payloadTanstackStartOptions missing router.autoCodeSplitting: false')
}
// The blanket `.client.*` SSR denial disable must be gone — host `.client.*`
// files keep TanStack's default protection; Payload is exempted in onViolation.
if (tsOptions.importProtection?.server) {
  errors.push('payloadTanstackStartOptions should not override importProtection.server (blanket disable)')
}
if (typeof payloadReactOptions().include === 'undefined') {
  errors.push('payloadReactOptions missing include')
}

// Guest/builder form: the consumer instantiates viteReact/rsc/tanstackStart
// themselves and assembles the final config. `withPayload` returns whatever the
// builder returns (after warning suppression), and hands the builder its base
// config (workaround plugins only) plus the required plugin options.
let builderContext
const builtConfig = withPayload(
  { payloadConfigPath: '/tmp/fake-payload.config.ts' },
  (context) => {
    builderContext = context
    return {
      ...context.config,
      plugins: [
        ...context.config.plugins,
        rsc(context.pluginOptions.rsc),
        tanstackStart(context.pluginOptions.tanstackStart),
        viteReact(context.pluginOptions.react),
      ],
      server: { port: 4000 },
    }
  },
)({ command: 'serve', mode: 'development' })

if (!builderContext) {
  errors.push('builder callback was not invoked')
}
if (builderContext && !builderContext.env) {
  errors.push('builder context missing env')
}
if (builderContext && !builderContext.pluginOptions?.rsc) {
  errors.push('builder context missing pluginOptions.rsc')
}
// The base config handed to the builder must only carry Payload's workaround
// plugins — the three third-party plugins are the consumer's to add.
if (builderContext && builderContext.config.plugins.length !== 6) {
  errors.push(
    `builder base config should carry 6 workaround plugins, got ${builderContext.config.plugins?.length}`,
  )
}
if (builtConfig.server?.port !== 4000) {
  errors.push('builder return value not used')
}
if (!builtConfig.customLogger) {
  errors.push('warning suppression not applied to builder result')
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

import type { PluginOption, UserConfigFnObject } from 'vite'

import path from 'node:path'

import {
  optimizeDepsExcludeDefaults,
  optimizeDepsIncludeDefaults,
  payloadNoExternalPatterns,
  payloadRscNoExternalPatterns,
  ssrExternalPackages,
} from './constants.js'
import {
  defaultImportProtectionIgnoreImporters,
  onImportProtectionViolation,
  serverOnlyClientSpecifiers,
} from './importProtection.js'
import { clientModuleResolution } from './plugins/clientModuleResolution.js'
import { payloadDevTransforms } from './plugins/devTransforms.js'
import { ssrStripDistStyleImports } from './plugins/stripDistStyleImports.js'
import { wrapCjsForClient } from './plugins/wrapCjsForClient.js'

export interface PayloadPluginOptions {
  /** Additional resolve aliases */
  additionalAliases?: Array<{ find: RegExp | string; replacement: string }>
  /** Additional import protection ignoreImporters patterns */
  additionalIgnoreImporters?: RegExp[]
  /** Extra optimizeDeps.include entries */
  additionalOptimizeDepsInclude?: string[]
  /** Extra ssr.external entries */
  additionalSsrExternal?: string[]
  /** Path to the user's payload.config.ts (required) */
  payloadConfigPath: string
  /** Extra Vite plugins to include */
  plugins?: PluginOption[]
  /** @vitejs/plugin-react instance — must be passed by consumer to ensure correct resolution */
  reactPlugin: PluginOption
  /** TanStack router routes directory relative to srcDirectory. Defaults to 'app' */
  routesDirectory?: string
  /** @vitejs/plugin-rsc instance — required for RSC support, must be passed by consumer */
  rscPlugin: PluginOption
  /** TanStack source directory. Defaults to 'src' */
  srcDirectory?: string
  /** tanstackStart from '@tanstack/react-start/plugin/vite' — must be passed by consumer to ensure correct resolution */
  tanstackStart: typeof import('@tanstack/react-start/plugin/vite').tanstackStart
}

/**
 * Vite plugin for Payload + TanStack Start. The Vite-side counterpart to
 * `withPayload` for Next.js: it configures the Vite environment so the Payload
 * admin can run, then composes the TanStack Start plugin with two small
 * Payload-specific workarounds (dev HMR injection, SSR style stripping). Each
 * remaining workaround lives in its own file under `./plugins/` so it can be
 * deleted individually once the corresponding upstream fix lands.
 */
export function payloadPlugin(options: PayloadPluginOptions): UserConfigFnObject {
  const {
    additionalAliases = [],
    additionalIgnoreImporters = [],
    additionalOptimizeDepsInclude = [],
    additionalSsrExternal = [],
    payloadConfigPath,
    plugins: extraPlugins = [],
    reactPlugin,
    routesDirectory = 'app',
    rscPlugin,
    srcDirectory = 'src',
    tanstackStart,
  } = options

  process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED = 'true'

  return (_env) => ({
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['import', 'global-builtin'],
        } as any,
      },
    },
    define: {
      global: 'globalThis',
      'process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED': JSON.stringify('true'),
    },
    environments: {
      rsc: { resolve: { noExternal: payloadRscNoExternalPatterns } },
      ssr: { resolve: { noExternal: payloadNoExternalPatterns } },
    } as any,
    optimizeDeps: {
      exclude: optimizeDepsExcludeDefaults,
      include: [...optimizeDepsIncludeDefaults, ...additionalOptimizeDepsInclude],
    },
    plugins: [
      clientModuleResolution(),
      wrapCjsForClient(),
      ssrStripDistStyleImports(),
      payloadDevTransforms(),
      rscPlugin,
      tanstackStart({
        importProtection: {
          client: { excludeFiles: [], specifiers: serverOnlyClientSpecifiers },
          ignoreImporters: [
            ...defaultImportProtectionIgnoreImporters,
            ...additionalIgnoreImporters,
          ],
          include: ['**/*'],
          mockAccess: 'warn',
          onViolation: onImportProtectionViolation,
          // Disable TanStack Start's default `**/*.client.*` file-based denial in
          // the SSR environment. Payload uses the `.client.tsx` filename suffix
          // for React Client Components (with a `'use client'` directive) that
          // MUST be server-rendered to HTML during SSR. The default rule would
          // otherwise replace those files with an `import-protection mock` Proxy
          // during SSR, which crashes React (TypeError: Cannot convert object to
          // primitive value) the moment React tries to format a warning that
          // mentions one of these components.
          server: { files: [] },
        },
        // Disable TanStack Router's automatic per-route code-splitting.
        //
        // With splitting enabled each route's `component` is fetched lazily
        // via `?tsr-split=component` after the initial SSR HTML is streamed.
        // Until that lazy chunk lands the rendered admin tree has no client
        // React attached, so any button clicks (e.g. the
        // `#toggle-list-filters` chevron in `<ListControls />`) hit a static
        // DOM, the click is dropped, and once the chunk finally loads the
        // component re-mounts with its initial `useState` instead of the
        // toggled value. That single behaviour was the root cause of the
        // "page renders but nothing is interactive" tanstack-start E2E
        // failures (`#list-controls-where`, `[data-lexical-editor]`, etc.) -
        // playwright traces show "Download the React DevTools" landing
        // *after* the playwright click, confirming late hydration.
        //
        // We pass BOTH knobs because `tanstackStart`'s schema silently
        // strips the user-supplied `autoCodeSplitting` (its `tsrConfig`
        // does `configSchema.omit({ autoCodeSplitting: true, target: true
        // })`) and then leaves the value `undefined` — which is fine for
        // the conditional inside `unpluginRouterComposedFactory`, but the
        // TanStack Start vite plugin *unconditionally* installs the router
        // code-splitter via `tanStackRouterCodeSplitter(...)` regardless.
        // The only knob that survives all of that and is honoured by the
        // splitter is `router.codeSplittingOptions.defaultBehavior` — set
        // to an empty array, the splitter still walks each `createFileRoute`
        // file but produces no virtual `?tsr-split=...` modules, so every
        // route component ships in the initial bundle and hydration starts
        // immediately on first paint. We keep `autoCodeSplitting: false` as
        // a belt-and-braces signal in case the start plugin ever stops
        // dropping it.
        //
        // Eager-loading routes ships a slightly larger initial bundle but
        // makes the admin actually interactive on first paint.
        router: {
          autoCodeSplitting: false,
          codeSplittingOptions: { defaultBehavior: [] },
          // Exclude only generated importMap files. We deliberately do NOT
          // exclude `*.server-function.ts` here even though the name suggests
          // a TanStack Start server function — `api.server-function.ts` is
          // the *route handler* that mounts `/api/server-function` for admin
          // form saves; excluding it leaves the catch-all `api.$.ts` to fall
          // through to Payload's `handleEndpoints`, which has no such route
          // and replies "Route not found", breaking every admin save.
          routeFileIgnorePattern: 'importMap\\.(?:js|server\\.ts)$',
          routesDirectory,
        } as any,
        rsc: { enabled: true },
        srcDirectory,
      }),
      reactPlugin,
      ...extraPlugins,
    ],
    resolve: {
      alias: [
        { find: '@payload-config', replacement: path.resolve(payloadConfigPath) },
        ...additionalAliases,
      ],
      dedupe: ['react', 'react-dom', 'scheduler', '@payloadcms/ui'],
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
      tsconfigPaths: true,
    } as any,
    server: {
      warmup: { clientFiles: ['./src/importMap.js'] },
    },
    ssr: {
      external: [...ssrExternalPackages, ...additionalSsrExternal],
      noExternal: payloadNoExternalPatterns,
    },
  })
}

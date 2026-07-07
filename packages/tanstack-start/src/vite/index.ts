import type { UserConfig, UserConfigFnObject } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { mergeConfig } from 'vite'

import { payloadNoExternalPatterns, ssrExternalPackages } from './config/external.js'
import { optimizeDepsExcludeDefaults, optimizeDepsIncludeDefaults } from './config/optimizeDeps.js'
import {
  defaultImportProtectionIgnoreImporters,
  onImportProtectionViolation,
  serverOnlyClientSpecifiers,
} from './importProtection.js'
import { clientModuleResolution } from './workarounds/clientModuleResolution.js'
import { payloadDevTransforms } from './workarounds/devTransforms.js'
import { reactDomServerInRsc } from './workarounds/reactDomServerInRsc.js'
import { ssrStripDistStyleImports } from './workarounds/stripDistStyleImports.js'
import { wrapCjsForClient } from './workarounds/wrapCjsForClient.js'

export type WithPayloadOptions = {
  /**
   * Additional import-protection `ignoreImporters` patterns. This is a
   * Payload-specific knob on the TanStack Start plugin, so it cannot be
   * expressed through `vite` — pass it here.
   */
  additionalIgnoreImporters?: RegExp[]
  /** Path to the user's `payload.config.ts` (required) */
  payloadConfigPath: string
  /** TanStack router routes directory relative to `srcDirectory`. Defaults to `'app'` */
  routesDirectory?: string
  /** TanStack source directory. Defaults to `'src'` */
  srcDirectory?: string
  /**
   * Extra Vite config merged on top of the Payload defaults via Vite's own
   * `mergeConfig`. Objects are deep-merged and arrays are appended, so this is
   * the single hook for everything a consumer used to reach through separate
   * options: extra `plugins`, `resolve.alias` entries, `optimizeDeps.include`,
   * `ssr.external`, `server`, `build`, and so on.
   *
   * @example
   * withPayload({
   *   payloadConfigPath: './src/payload.config.ts',
   *   vite: { server: { port: 4000 } },
   * })
   */
  vite?: UserConfig
}

/**
 * Vite config helper for Payload + TanStack Start. The Vite-side counterpart to
 * `withPayload` for Next.js: it owns the whole Vite setup needed to run the
 * Payload admin — the RSC, React, and TanStack Start plugins plus a small set of
 * Payload-specific workarounds — so a consumer's `vite.config.ts` collapses to:
 *
 * ```ts
 * import { withPayload } from '@payloadcms/tanstack-start/vite'
 *
 * export default withPayload({ payloadConfigPath: './src/payload.config.ts' })
 * ```
 *
 * The React (`@vitejs/plugin-react`), RSC (`@vitejs/plugin-rsc`), and TanStack
 * Start plugins are instantiated internally with the settings the admin
 * requires — consumers no longer pass them in. Each remaining Payload
 * workaround lives in its own file under `./workarounds/` so it can be deleted
 * individually once the corresponding upstream fix lands.
 */
export function withPayload(options: WithPayloadOptions): UserConfigFnObject {
  const {
    additionalIgnoreImporters = [],
    payloadConfigPath,
    routesDirectory = 'app',
    srcDirectory = 'src',
    vite,
  } = options

  return (_env) => {
    const base: UserConfig = {
      css: {
        preprocessorOptions: {
          scss: {
            silenceDeprecations: ['import', 'global-builtin'],
          } as any,
        },
      },
      define: {
        global: 'globalThis',
      },
      environments: {
        rsc: { resolve: { noExternal: payloadNoExternalPatterns } },
        ssr: { resolve: { noExternal: payloadNoExternalPatterns } },
      } as any,
      optimizeDeps: {
        exclude: optimizeDepsExcludeDefaults,
        include: optimizeDepsIncludeDefaults,
      },
      plugins: [
        clientModuleResolution(),
        wrapCjsForClient(),
        ssrStripDistStyleImports(),
        reactDomServerInRsc(),
        payloadDevTransforms(),
        rsc({ serverHandler: false }),
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
            // Exclude generated importMap files and colocated server-function
            // modules (`*.functions.ts`). Admin form saves are dispatched via
            // `runPayloadServerFn` (a TanStack Start `createServerFn`) rather than
            // a hand-rolled route, so there is no longer an `api.server-function.ts`
            // to special-case here. The `*.functions.ts` shims live next to the
            // routes that use them (e.g. `app/_payload/*.functions.ts`); they
            // define `createServerFn`s, not routes, so they must not be scanned.
            routeFileIgnorePattern: 'importMap\\.(?:js|server\\.ts)$|\\.functions\\.',
            routesDirectory,
          } as any,
          rsc: { enabled: true },
          srcDirectory,
        }),
        viteReact({ exclude: [], include: /\.[jt]sx?$/ }),
      ],
      resolve: {
        alias: [{ find: '@payload-config', replacement: path.resolve(payloadConfigPath) }],
        dedupe: [
          'react',
          'react-dom',
          'scheduler',
          '@payloadcms/ui',
          '@payloadcms/richtext-lexical',
        ],
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
        tsconfigPaths: true,
      } as any,
      ssr: {
        external: ssrExternalPackages,
        noExternal: payloadNoExternalPatterns,
      },
    }

    return vite ? mergeConfig(base, vite) : base
  }
}

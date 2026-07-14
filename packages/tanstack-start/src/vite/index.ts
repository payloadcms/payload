import type { ConfigEnv, Logger, PluginOption, UserConfig, UserConfigFnObject } from 'vite'

// Optional peers, not deps: `plugin-rsc` is a singleton, so bundling our own copy
// alongside the host's would load two instances and crash.
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { createLogger, mergeConfig } from 'vite'

import { payloadNoExternalPatterns, ssrExternalPackages } from './config/external.js'
import { optimizeDepsExcludeDefaults, optimizeDepsIncludeDefaults } from './config/optimizeDeps.js'
import { payloadScssImporters } from './config/scss.js'
import {
  defaultImportProtectionIgnoreImporters,
  onImportProtectionViolation,
  serverOnlyClientSpecifiers,
} from './importProtection.js'
import { clientModuleResolution } from './workarounds/clientModuleResolution.js'
import { payloadDevTransforms } from './workarounds/devTransforms.js'
import { reactDomServerInRsc } from './workarounds/reactDomServerInRsc.js'
import { ssrStripDistStyleImports } from './workarounds/stripDistStyleImports.js'
import { stubPrettierInClient } from './workarounds/stubPrettierInClient.js'
import { wrapCjsForClient } from './workarounds/wrapCjsForClient.js'

/**
 * Vite dependency warnings Payload consumers can't act on: third-party packages
 * ship sourcemaps whose original sources aren't published, so Vite warns on
 * every one. Suppressed by default (see `silenceDependencyWarnings`).
 */
const suppressibleWarningPatterns = ['points to missing source files', 'Sourcemap for']

/**
 * Wraps a Vite logger so warnings matching {@link suppressibleWarningPatterns}
 * are dropped. Mutates and returns the given logger (or a fresh default one).
 */
function withQuietedDependencyWarnings(existing?: Logger): Logger {
  const logger = existing ?? createLogger()
  const shouldSuppress = (msg: unknown): boolean =>
    typeof msg === 'string' && suppressibleWarningPatterns.some((pattern) => msg.includes(pattern))

  const baseWarn = logger.warn.bind(logger)
  const baseWarnOnce = logger.warnOnce.bind(logger)
  logger.warn = (msg, options) => {
    if (!shouldSuppress(msg)) {
      baseWarn(msg, options)
    }
  }
  logger.warnOnce = (msg, options) => {
    if (!shouldSuppress(msg)) {
      baseWarnOnce(msg, options)
    }
  }
  return logger
}

/** Applies dependency-warning suppression to a config in place when enabled. */
function applyDependencyWarningSuppression(config: UserConfig, enabled: boolean): UserConfig {
  if (enabled) {
    config.customLogger = withQuietedDependencyWarnings(config.customLogger)
  }
  return config
}

export type WithPayloadOptions = {
  /** Extra import-protection `ignoreImporters` patterns for the TanStack Start plugin. */
  additionalIgnoreImporters?: RegExp[]
  /** Route id of Payload's admin layout, eager-loaded instead of code-split. Defaults to `'/_payload'`. */
  adminRouteId?: string
  /** Extra globs exempted from the `.client.*` SSR denial (beyond the default node_modules exemption). */
  clientDenialExcludeFiles?: string[]
  /** Path to the user's `payload.config.ts` (required) */
  payloadConfigPath: string
  /** TanStack router routes directory relative to `srcDirectory`. Defaults to `'app'` */
  routesDirectory?: string
  /** Silence Vite warnings about third-party dependency sourcemaps. Defaults to `true`. */
  silenceDependencyWarnings?: boolean
  /** TanStack source directory. Defaults to `'src'` */
  srcDirectory?: string
  /** Extra Vite config deep-merged over the Payload defaults. Ignored in `build` mode. */
  vite?: UserConfig
}

/** The options Payload's admin requires for each third-party plugin. */
export type PayloadPluginOptions = {
  react: NonNullable<Parameters<typeof viteReact>[0]>
  rsc: NonNullable<Parameters<typeof rsc>[0]>
  tanstackStart: NonNullable<Parameters<typeof tanstackStart>[0]>
}

export type WithPayloadBuilderContext = {
  /** Payload's base Vite config; `plugins` holds Payload's workaround plugins only. */
  config: UserConfig
  env: ConfigEnv
  /** Options to pass to the `viteReact`/`rsc`/`tanstackStart` factories you import. */
  pluginOptions: PayloadPluginOptions
}

/** Assembles the final Vite config from Payload's base config and plugin options. */
export type WithPayloadBuilder = (context: WithPayloadBuilderContext) => UserConfig

/**
 * Vite config helper for Payload + TanStack Start; the counterpart to Next.js'
 * `withPayload`.
 *
 * Zero-config — Payload instantiates the RSC, React, and TanStack Start plugins:
 *
 * ```ts
 * export default withPayload({ payloadConfigPath: './src/payload.config.ts' })
 * ```
 *
 * Guest mode — pass a `build` callback to instantiate them yourself (one copy of
 * each; `@vitejs/plugin-rsc` is a hard singleton):
 *
 * ```ts
 * export default withPayload(
 *   { payloadConfigPath: './src/payload.config.ts' },
 *   ({ config, pluginOptions }) => ({
 *     ...config,
 *     plugins: [
 *       ...config.plugins,
 *       rsc(pluginOptions.rsc),
 *       tanstackStart(pluginOptions.tanstackStart),
 *       viteReact(pluginOptions.react),
 *     ],
 *   }),
 * )
 * ```
 */
export function withPayload(
  options: WithPayloadOptions,
  build?: WithPayloadBuilder,
): UserConfigFnObject {
  const {
    additionalIgnoreImporters = [],
    adminRouteId,
    clientDenialExcludeFiles = [],
    payloadConfigPath,
    routesDirectory = 'app',
    silenceDependencyWarnings = true,
    srcDirectory = 'src',
    vite,
  } = options

  return (env) => {
    const base: UserConfig = {
      build: {
        cssMinify: 'esbuild',
      },
      css: {
        preprocessorOptions: {
          scss: {
            importers: payloadScssImporters,
            silenceDeprecations: ['import', 'global-builtin'],
          } as any,
        },
      },
      define: {
        global: 'globalThis',
      },
      environments: {
        rsc: {
          build: { rollupOptions: { external: ssrExternalPackages } },
          resolve: { noExternal: payloadNoExternalPatterns },
        },
        ssr: {
          build: { rollupOptions: { external: ssrExternalPackages } },
          resolve: { noExternal: payloadNoExternalPatterns },
        },
      } as any,
      optimizeDeps: {
        exclude: optimizeDepsExcludeDefaults,
        include: optimizeDepsIncludeDefaults,
      },
      // Payload's internal workaround plugins only. The RSC, TanStack Start, and
      // React plugins are appended below (default form) or by the consumer's
      // `build` callback (guest form).
      plugins: [
        clientModuleResolution(),
        wrapCjsForClient(),
        ssrStripDistStyleImports(),
        reactDomServerInRsc(),
        stubPrettierInClient(),
        payloadDevTransforms(),
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

    const pluginOptions: PayloadPluginOptions = {
      react: payloadReactOptions(),
      rsc: payloadRscOptions(),
      tanstackStart: payloadTanstackStartOptions({
        additionalIgnoreImporters,
        adminRouteId,
        clientDenialExcludeFiles,
        routesDirectory,
        srcDirectory,
      }),
    }

    if (build) {
      return applyDependencyWarningSuppression(
        build({ config: base, env, pluginOptions }),
        silenceDependencyWarnings,
      )
    }

    base.plugins = [
      ...(base.plugins as PluginOption[]),
      rsc(pluginOptions.rsc),
      tanstackStart(pluginOptions.tanstackStart),
      viteReact(pluginOptions.react),
    ]

    const merged = vite ? mergeConfig(base, vite) : base

    return applyDependencyWarningSuppression(merged, silenceDependencyWarnings)
  }
}

/** `@vitejs/plugin-rsc` options for Payload: `serverHandler: false` (TanStack owns the handler). */
export function payloadRscOptions(): NonNullable<Parameters<typeof rsc>[0]> {
  return { serverHandler: false }
}

/** `@vitejs/plugin-react` options for Payload: transform every `.[jt]sx?` file. */
export function payloadReactOptions(): NonNullable<Parameters<typeof viteReact>[0]> {
  return { exclude: [], include: /\.[jt]sx?$/ }
}

export type PayloadTanstackStartOptionsArgs = {
  /** Additional import-protection `ignoreImporters` patterns. */
  additionalIgnoreImporters?: RegExp[]
  /**
   * Route id of Payload's admin layout route, eager-loaded (not code-split) so it
   * hydrates on first paint. It and its children skip splitting; host routes keep
   * TanStack's default. Defaults to `'/_payload'` (the `_payload.tsx` convention).
   */
  adminRouteId?: string
  /**
   * Extra globs exempted from TanStack's `.client.*` SSR denial, on top of the
   * default node_modules exemption. Needed only when Payload's own `.client.*`
   * files resolve outside node_modules (e.g. the monorepo's `packages` sources).
   */
  clientDenialExcludeFiles?: string[]
  /** TanStack router routes directory relative to `srcDirectory`. Defaults to `'app'`. */
  routesDirectory?: string
  /** TanStack source directory. Defaults to `'src'`. */
  srcDirectory?: string
}

/**
 * The `tanstackStart` options Payload's admin requires (import-protection and
 * code-splitting). TanStack Start is one-per-app, so a host that already runs it
 * should merge these into its single `tanstackStart` call.
 */
export function payloadTanstackStartOptions(
  args: PayloadTanstackStartOptionsArgs = {},
): NonNullable<Parameters<typeof tanstackStart>[0]> {
  const {
    additionalIgnoreImporters = [],
    adminRouteId = '/_payload',
    clientDenialExcludeFiles = [],
    routesDirectory = 'app',
    srcDirectory = 'src',
  } = args

  return {
    importProtection: {
      client: { excludeFiles: [], specifiers: serverOnlyClientSpecifiers },
      ignoreImporters: [...defaultImportProtectionIgnoreImporters, ...additionalIgnoreImporters],
      include: ['**/*'],
      mockAccess: 'warn',
      onViolation: onImportProtectionViolation,
      // Payload's `.client.*` components are React Client Components that must be
      // server-rendered during SSR; TanStack's default `**/*.client.*` server
      // denial would mock and crash them. All such files live in `@payloadcms/*`
      // packages, so keep the denial (host `.client.*` files still get it) and
      // just exempt Payload's — `node_modules` covers published installs.
      server: { excludeFiles: ['**/node_modules/**', ...clientDenialExcludeFiles] },
    },
    router: {
      codeSplittingOptions: {
        // Eager-load only Payload's admin routes so they hydrate on first paint —
        // a split admin renders but isn't interactive until its lazy `?tsr-split=`
        // chunk lands. Returning `[]` disables splitting for a route; `undefined`
        // lets host routes keep TanStack's default per-route splitting.
        splitBehavior: ({ routeId }: { routeId: string }) =>
          routeId === adminRouteId || routeId.startsWith(`${adminRouteId}/`) ? [] : undefined,
      },
      // Ignore generated importMap files and colocated `*.functions.ts` modules
      // (they define `createServerFn`s, not routes).
      routeFileIgnorePattern: 'importMap\\.(?:js|server\\.ts)$|\\.functions\\.',
      routesDirectory,
    } as any,
    rsc: { enabled: true },
    srcDirectory,
  }
}

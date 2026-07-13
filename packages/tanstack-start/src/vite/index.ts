import type { ConfigEnv, Logger, PluginOption, UserConfig, UserConfigFnObject } from 'vite'

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
  const { additionalIgnoreImporters = [], routesDirectory = 'app', srcDirectory = 'src' } = args

  return {
    // No `server` rule: keep TanStack's default `.client.*` SSR protection for
    // host files. Payload's own `.client.*` are exempted in
    // `onImportProtectionViolation`.
    importProtection: {
      client: { excludeFiles: [], specifiers: serverOnlyClientSpecifiers },
      ignoreImporters: [...defaultImportProtectionIgnoreImporters, ...additionalIgnoreImporters],
      include: ['**/*'],
      mockAccess: 'warn',
      onViolation: onImportProtectionViolation,
    },
    // Disable per-route code-splitting so route components ship in the initial
    // bundle and hydrate on first paint — otherwise the admin renders but isn't
    // interactive until each lazy `?tsr-split=` chunk lands. `defaultBehavior:
    // []` is the knob the splitter actually honours; `autoCodeSplitting: false`
    // is a belt-and-braces signal (the plugin's schema strips it).
    router: {
      autoCodeSplitting: false,
      codeSplittingOptions: { defaultBehavior: [] },
      // Ignore generated importMap files and colocated `*.functions.ts` modules
      // (they define `createServerFn`s, not routes).
      routeFileIgnorePattern: 'importMap\\.(?:js|server\\.ts)$|\\.functions\\.',
      routesDirectory,
    } as any,
    rsc: { enabled: true },
    srcDirectory,
  }
}

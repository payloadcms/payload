import type { ImportMap } from 'payload'

import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { SharedEnvironment } from '../shared/registry.js'

export type CustomComponentsOptions = {
  importMapFile: string
  outDir: string
}

export type CustomComponents = {
  /** When these were compiled. */
  builtAt: number
  cssURLs: string[]
  importMap: ImportMap
  /** Client reference ID (the browser URL of its chunk) -> compiled SSR module. */
  ssrFiles: Record<string, string>
}

type Build = { components: CustomComponents; inputs: string[]; startedAt: number }

/** Written next to the output, with paths relative to it, so a build can be deployed elsewhere. */
type Manifest = { cssURLs: string[]; rscFile: string; ssrFiles: Record<string, string> }

type ClientRefs = Record<string, { exports: string[]; url: string }>

const USE_CLIENT = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/

/** Deep `@payloadcms/ui` client imports resolve to the barrel, which holds the admin's contexts. */
const UI_SUBPATH = /^@payloadcms\/ui\/(?:elements|fields|forms|graphics|hooks|icons|providers)\//

/**
 * Compiles the app's custom components (the generated import map, plus `custom.css` next to the admin
 * route) with esbuild, outside the host framework. React and `@payloadcms/ui` resolve to the prebuilt
 * runtime's instances and `payload` to the host's, so the components render inside the admin like any
 * built-in one.
 *
 * In development, the next request after an input changed rebuilds them. In production, the output of
 * `payload build` is loaded as is.
 */
export function createCustomComponentsCompiler(
  options: { assetsURL: string } & CustomComponentsOptions,
) {
  // `Reflect.get`: the bundle's static `process.env.NODE_ENV` is pinned to production at build time.
  const nodeEnv = Reflect.get(process.env, 'NODE_ENV')
  let current: Promise<Build> | undefined

  return async (): Promise<CustomComponents> => {
    if (current && nodeEnv === 'development') {
      const { inputs, startedAt } = await current
      const stats = await Promise.all(inputs.map((input) => fs.stat(input).catch(() => undefined)))
      if (stats.some((stat) => !stat || stat.mtimeMs > startedAt)) {
        current = undefined
      }
    }

    current ??=
      nodeEnv === 'production'
        ? load({ inputs: [], outDir: options.outDir }).catch(() => compile(options))
        : compile(options)
    return (await current).components
  }
}

export async function compile({
  assetsURL,
  importMapFile,
  outDir,
}: { assetsURL: string } & CustomComponentsOptions): Promise<Build> {
  const startedAt = Date.now()
  await fs.rm(outDir, { force: true, recursive: true })

  const common = {
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    format: 'esm',
    jsx: 'automatic',
    logLevel: 'error',
    metafile: true,
  } as const satisfies esbuild.BuildOptions
  const rsc = {
    ...common,
    conditions: ['react-server'],
    entryPoints: [importMapFile],
    platform: 'node',
  } as const satisfies esbuild.BuildOptions

  const clientModules = new Set<string>()
  const serverCSS = new Set<string>()
  await esbuild.build({
    ...rsc,
    plugins: [await sharedPlugin('rsc'), clientBoundaryPlugin({ clientModules, serverCSS })],
    write: false,
  })

  const clientRefs: ClientRefs = {}
  const manifest: Manifest = { cssURLs: [], rscFile: `rsc/importMap-${startedAt}.js`, ssrFiles: {} }
  const inputs = new Set<string>()
  const collectInputs = (result: esbuild.BuildResult) =>
    Object.keys(result.metafile!.inputs)
      .filter((input) => !input.includes(':') && !input.includes('node_modules'))
      .forEach((input) => inputs.add(path.resolve(input)))

  // The admin's global stylesheet, `(payload)/custom.css`, next to the `admin` folder of the import map.
  const customCSS = path.resolve(path.dirname(importMapFile), '../custom.css')
  const hasCustomCSS = await fs.stat(customCSS).then(
    () => true,
    () => false,
  )

  // Stylesheets imported by server components load in the browser, like `custom.css`.
  const cssEntries = [...serverCSS, ...(hasCustomCSS ? [customCSS] : [])]

  if (clientModules.size > 0 || cssEntries.length > 0) {
    const clientDir = path.join(outDir, 'client')
    const client = await esbuild.build({
      ...common,
      // Next.js polyfills `path` in browser code, and client code relies on it (e.g. cloud storage).
      alias: {
        'node:path': 'next/dist/compiled/path-browserify',
        path: 'next/dist/compiled/path-browserify',
      },
      // Like the prebuilt browser bundle, read the environment the page carries (see entry.ssr.tsx).
      define: { ...common.define, 'process.env': 'globalThis.__PAYLOAD_ENV__' },
      entryNames: '[name]-[hash]',
      entryPoints: [...clientModules, ...cssEntries],
      outdir: clientDir,
      platform: 'browser',
      plugins: [await sharedPlugin('browser')],
      splitting: true,
    })
    for (const [file, output] of Object.entries(client.metafile.outputs)) {
      const url = `${assetsURL}${path.relative(clientDir, file).split(path.sep).join('/')}`
      if (file.endsWith('.css')) {
        manifest.cssURLs.push(url)
      } else if (output.entryPoint) {
        clientRefs[path.resolve(output.entryPoint)] = { exports: output.exports, url }
      }
    }
    collectInputs(client)
  }

  if (clientModules.size > 0) {
    const ssr = await esbuild.build({
      ...common,
      entryNames: '[name]-[hash]',
      entryPoints: [...clientModules],
      loader: { '.css': 'empty' },
      outdir: path.join(outDir, 'ssr'),
      platform: 'node',
      plugins: [await sharedPlugin('ssr')],
      splitting: true,
    })
    for (const [file, output] of Object.entries(ssr.metafile.outputs)) {
      const ref = output.entryPoint && clientRefs[path.resolve(output.entryPoint)]
      if (ref) {
        manifest.ssrFiles[ref.url] = path.relative(outDir, file)
      }
    }
  }

  collectInputs(
    await esbuild.build({
      ...rsc,
      outfile: path.join(outDir, manifest.rscFile),
      plugins: [await sharedPlugin('rsc'), clientBoundaryPlugin({ clientRefs })],
    }),
  )
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest))

  return load({ inputs: [...inputs], outDir, startedAt })
}

async function load({
  inputs,
  outDir,
  startedAt = Date.now(),
}: {
  inputs: string[]
  outDir: string
  startedAt?: number
}): Promise<Build> {
  const manifest = JSON.parse(
    await fs.readFile(path.join(outDir, 'manifest.json'), 'utf8'),
  ) as Manifest
  const { importMap } = (await import(
    /* @vite-ignore */ pathToFileURL(path.join(outDir, manifest.rscFile)).href
  )) as { importMap: ImportMap }
  const ssrFiles = Object.fromEntries(
    Object.entries(manifest.ssrFiles).map(([url, file]) => [url, path.join(outDir, file)]),
  )

  return {
    components: { builtAt: startedAt, cssURLs: manifest.cssURLs, importMap, ssrFiles },
    inputs,
    startedAt,
  }
}

/**
 * Resolves shared specifiers to the instances already loaded in this process instead of bundling
 * copies: the runtime's own (`__payload_shared__`) and, on the server, the host's `payload`.
 */
async function sharedPlugin(env: SharedEnvironment): Promise<esbuild.Plugin> {
  const modules: Record<string, { load: string; names: string[] }> = {}

  // The browser registers the same modules as SSR, but only in the browser: read SSR's export names.
  const registry = globalThis.__payload_shared__![env === 'browser' ? 'ssr' : env]!
  for (const [specifier, load] of Object.entries(registry)) {
    modules[specifier] = {
      load: `await globalThis.__payload_shared__.${env}[${JSON.stringify(specifier)}]()`,
      names: exportNames(await load()),
    }
  }

  if (env !== 'browser') {
    for (const [specifier, module] of Object.entries(globalThis.__payload_host__!)) {
      modules[specifier] = {
        load: `globalThis.__payload_host__[${JSON.stringify(specifier)}]`,
        names: exportNames(module as Record<string, unknown>),
      }
    }
  }

  return {
    name: 'payload-shared',
    setup(build) {
      build.onResolve(
        // Any bare specifier: the host's modules include `@payload-config`.
        { filter: /^[^./]/ },
        ({ path: specifier }) => {
          const shared = modules[specifier]
            ? specifier
            : UI_SUBPATH.test(specifier)
              ? '@payloadcms/ui'
              : undefined
          return shared ? { namespace: 'payload-shared', path: shared } : undefined
        },
      )
      build.onLoad({ filter: /.*/, namespace: 'payload-shared' }, ({ path: specifier }) => ({
        contents: [
          `const ns = ${modules[specifier]!.load};`,
          // CommonJS packages (React) arrive as `{ default: exports }`.
          `const m = ns.default && typeof ns.default === 'object' && Object.keys(ns).length <= 2 ? { ...ns.default, ...ns } : ns;`,
          `export default ns.default ?? m;`,
          ...modules[specifier]!.names.map((name) => `export const ${name} = m.${name};`),
        ].join('\n'),
        loader: 'js',
      }))
    },
  }
}

function exportNames(namespace: Record<string, unknown>): string[] {
  const module =
    namespace.default && typeof namespace.default === 'object' && Object.keys(namespace).length <= 2
      ? { ...namespace.default, ...namespace }
      : namespace
  return Object.keys(module).filter((name) => name !== 'default' && /^[A-Z_$][\w$]*$/i.test(name))
}

/**
 * Collects `'use client'` modules and stylesheets (with `clientModules`), or replaces each `'use client'`
 * module with client references whose IDs are the browser URLs of their compiled chunks (with
 * `clientRefs`). Stylesheets are left out of the server graph either way.
 */
function clientBoundaryPlugin({
  clientModules,
  clientRefs,
  serverCSS,
}: {
  clientModules?: Set<string>
  clientRefs?: ClientRefs
  serverCSS?: Set<string>
}): esbuild.Plugin {
  return {
    name: 'payload-client-boundary',
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, ({ path: file }) => {
        serverCSS?.add(path.resolve(file))
        return { contents: '', loader: 'empty' }
      })
      build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async ({ path: file }) => {
        if (!USE_CLIENT.test(await fs.readFile(file, 'utf8'))) {
          return undefined
        }
        if (clientModules) {
          clientModules.add(path.resolve(file))
          return { contents: '', loader: 'js' }
        }
        const { exports, url } = clientRefs![path.resolve(file)]!
        return {
          contents: [
            `import { registerClientReference } from '@vitejs/plugin-rsc/rsc';`,
            ...exports.map((name) => {
              const reference = `registerClientReference(() => { throw new Error('${name} is a client component') }, ${JSON.stringify(url)}, ${JSON.stringify(name)})`
              return name === 'default'
                ? `export default ${reference};`
                : `export const ${name} = ${reference};`
            }),
          ].join('\n'),
          loader: 'js',
          resolveDir: path.dirname(file),
        }
      })
    },
  }
}

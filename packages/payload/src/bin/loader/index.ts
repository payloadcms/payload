/* eslint-disable @typescript-eslint/unbound-method */
import { getTsconfig } from 'get-tsconfig'
import path from 'path'
import ts from 'typescript'
import { fileURLToPath, pathToFileURL } from 'url'

import { CLIENT_EXTENSIONS } from './clientExtensions.js'
import { compile } from './compile.js'

interface ResolveContext {
  conditions: string[]
  parentURL: string | undefined
}
interface ResolveResult {
  format?: string
  shortCircuit?: boolean
  url: string
}
type ResolveArgs = [
  specifier: string,
  context?: ResolveContext,
  nextResolve?: (...args: ResolveArgs) => Promise<ResolveResult>,
]
type ResolveFn = (...args: Required<ResolveArgs>) => Promise<ResolveResult>

const locatedConfig = getTsconfig()
const tsconfig = locatedConfig.config.compilerOptions as unknown as ts.CompilerOptions

tsconfig.module = ts.ModuleKind.ESNext

// Specify bundler resolution for Next.js compatibility.
// We will use TS to resolve file paths for most flexibility
tsconfig.moduleResolution = ts.ModuleResolutionKind.Bundler

// Don't resolve d.ts files, because we aren't type-checking
tsconfig.noDtsResolution = true

const moduleResolutionCache = ts.createModuleResolutionCache(
  ts.sys.getCurrentDirectory(),
  (x) => x,
  tsconfig,
)
const host: ts.ModuleResolutionHost = {
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
}
const TS_EXTENSIONS: string[] = [
  ts.Extension.Ts,
  ts.Extension.Tsx,
  ts.Extension.Dts,
  ts.Extension.Mts,
]

export const resolve: ResolveFn = async (specifier, context, nextResolve) => {
  const isTS = TS_EXTENSIONS.some((ext) => specifier.endsWith(ext))
  const isClient = CLIENT_EXTENSIONS.some((ext) => specifier.endsWith(ext))

  if (isClient) {
    const nextResult = await nextResolve(specifier, context, nextResolve)
    const specifierSegments = specifier.split('.')

    return {
      format: '.' + specifierSegments[specifierSegments.length - 1],
      shortCircuit: true,
      url: nextResult.url,
    }
  }

  // entrypoint
  if (!context.parentURL) {
    return {
      format: isTS ? 'ts' : undefined,
      shortCircuit: true,
      url: specifier,
    }
  }

  // import/require from external library
  const isMonorepoParent =
    context.parentURL.includes('/node_modules/@payloadcms') ||
    context.parentURL.includes('/node_modules/payload') // TODO: Disable this if load function used outside this monorepo (unnecessary for alpha-demo)
  if (context.parentURL.includes('/node_modules/') && !isTS && !isMonorepoParent) {
    return nextResolve(specifier)
  }

  const { resolvedModule } = ts.resolveModuleName(
    specifier,
    fileURLToPath(context.parentURL),
    tsconfig,
    host,
    moduleResolutionCache,
  )

  // import from local project to local project TS file
  if (resolvedModule) {
    const resolvedIsMonorepo =
      resolvedModule.resolvedFileName.includes('/node_modules/@payloadcms') ||
      resolvedModule.resolvedFileName.includes('/node_modules/payload') // TODO: Disable this if load function used outside this monorepo (unnecessary for alpha-demo)
    const resolvedIsNodeModule =
      resolvedModule.resolvedFileName.includes('/node_modules/') && !resolvedIsMonorepo
    const resolvedIsTS = TS_EXTENSIONS.includes(resolvedModule.extension)

    if (resolvedIsTS && !resolvedIsNodeModule) {
      return {
        format: 'ts',
        shortCircuit: true,
        url: pathToFileURL(resolvedModule.resolvedFileName).href,
      }
    }

    // We want to use TS "Bundler" moduleResolution for just about all files
    // so we pass the TS result here
    return nextResolve(pathToFileURL(resolvedModule.resolvedFileName).href)
  }

  // import from local project to either:
  // - something TS couldn't resolve
  // - external library
  // - local project non-TS file
  return nextResolve(specifier)
}

interface LoadContext {
  conditions: string[]
  format: null | string | undefined
}
interface LoadResult {
  format: string
  shortCircuit?: boolean
  source: ArrayBuffer | SharedArrayBuffer | Uint8Array | string
}
type LoadArgs = [
  url: string,
  context: LoadContext,
  nextLoad?: (...args: LoadArgs) => Promise<LoadResult>,
]
type LoadFn = (...args: Required<LoadArgs>) => Promise<LoadResult>

const swcOptions = {
  ...tsconfig,
  baseUrl: path.resolve(''),
  paths: undefined,
}

if (tsconfig.paths) {
  swcOptions.paths = tsconfig.paths
  if (tsconfig.baseUrl) {
    swcOptions.baseUrl = path.resolve(tsconfig.baseUrl)
  }
}

export const load: LoadFn = async (url, context, nextLoad) => {
  if (CLIENT_EXTENSIONS.some((e) => context.format === e)) {
    const rawSource = '{}'

    return {
      format: 'json',
      shortCircuit: true,
      source: rawSource,
    }
  }

  if (context.format === 'ts') {
    const { source } = await nextLoad(url, context)
    const code = typeof source === 'string' ? source : Buffer.from(source).toString()
    const compiled = await compile(code, fileURLToPath(url), swcOptions)
    return {
      format: 'module',
      shortCircuit: true,
      source: compiled,
    }
  } else {
    return nextLoad(url, context)
  }
}

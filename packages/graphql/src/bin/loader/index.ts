/* eslint-disable @typescript-eslint/unbound-method */
import { getTsconfig } from 'get-tsconfig'
import path from 'path'
import ts from 'typescript'
import { fileURLToPath, pathToFileURL } from 'url'

import { CLIENT_EXTENSIONS } from './clientExtensions.js'
import { compile } from './compile.js'
import { resolveOriginalPath } from './resolveOriginalPath.js'

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

// Ensure baseUrl is set in order to support paths
if (!tsconfig.baseUrl) {
  tsconfig.baseUrl = '.'
}

// Don't resolve d.ts files, because we aren't type-checking
tsconfig.noDtsResolution = true
tsconfig.module = ts.ModuleKind.ESNext
tsconfig.moduleResolution = ts.ModuleResolutionKind.NodeNext

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

  // If a client file is resolved, we'll set `format: client`
  // and short circuit, so the load step
  // will return source code of empty object
  if (isClient) {
    const nextResult = await nextResolve(specifier, context, nextResolve)

    return {
      format: 'client',
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

  // Try and resolve normally
  // This could fail, so we need to swallow that error
  // and keep going
  let nextResult: ResolveResult

  if (!isTS) {
    try {
      nextResult = await nextResolve(specifier, context, nextResolve)
    } catch (_) {
      // swallow error
    }
  }

  if (nextResult) {
    const nextResultIsTS = TS_EXTENSIONS.some((ext) => nextResult.url.endsWith(ext))

    return {
      ...nextResult,
      format: nextResultIsTS ? 'ts' : nextResult.format,
      shortCircuit: true,
    }
  }

  const { resolvedModule } = ts.resolveModuleName(
    specifier,
    fileURLToPath(context.parentURL),
    tsconfig,
    host,
    moduleResolutionCache,
  )

  if (resolvedModule) {
    const resolvedIsTS = TS_EXTENSIONS.includes(resolvedModule.extension)

    return {
      format: resolvedIsTS ? 'ts' : undefined,
      shortCircuit: true,
      url: pathToFileURL(await resolveOriginalPath(resolvedModule.resolvedFileName)).href, // The typescript module resolver does not resolve to the original path, but to the symlinked path, if present. This can cause issues
    }
  }

  // import from local project to either:
  // - something TS couldn't resolve
  // - local project non-TS file
  return nextResolve(specifier, context, nextResolve)
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
  if (context.format === 'client') {
    const rawSource = 'export default {}'

    return {
      format: 'module',
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

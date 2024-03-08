import { getTsconfig } from 'get-tsconfig'
import path from 'path'
import ts from 'typescript'
import { fileURLToPath, pathToFileURL } from 'url'

import { compile } from './register.js'

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
const EXTENSIONS: string[] = [ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Dts, ts.Extension.Mts]

export const resolve: ResolveFn = async (specifier, context, nextResolve) => {
  const isTS = EXTENSIONS.some((ext) => specifier.endsWith(ext))

  // entrypoint
  if (!context.parentURL) {
    return {
      format: isTS ? 'ts' : undefined,
      shortCircuit: true,
      url: specifier,
    }
  }

  // import/require from external library
  if (context.parentURL.includes('/node_modules/') && !isTS) {
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
  if (
    resolvedModule &&
    !resolvedModule.resolvedFileName.includes('/node_modules/') &&
    EXTENSIONS.includes(resolvedModule.extension)
  ) {
    return {
      format: 'ts',
      shortCircuit: true,
      url: pathToFileURL(resolvedModule.resolvedFileName).href,
    }
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
  if (context.format === 'ts') {
    const { source } = await nextLoad(url, context)
    const code = typeof source === 'string' ? source : Buffer.from(source).toString()
    const compiled = await compile(code, fileURLToPath(url), swcOptions, true)
    return {
      format: 'module',
      shortCircuit: true,
      source: compiled,
    }
  } else {
    return nextLoad(url, context)
  }
}

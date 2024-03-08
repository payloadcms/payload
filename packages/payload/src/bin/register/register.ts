import type { Options } from '@swc-node/core'

import { transform, transformSync } from '@swc-node/core'
import { SourcemapMap, installSourceMapSupport } from '@swc-node/sourcemap-support'
import { getTsconfig } from 'get-tsconfig'
import { platform } from 'os'
import { resolve } from 'path'
import { addHook } from 'pirates'
import * as ts from 'typescript'

import { tsCompilerOptionsToSwcConfig } from './read-default-tsconfig.js'

const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
const PLATFORM = platform()

const injectInlineSourceMap = ({
  code,
  filename,
  map,
}: {
  code: string
  filename: string
  map: string | undefined
}): string => {
  if (map) {
    SourcemapMap.set(filename, map)
    const base64Map = Buffer.from(map, 'utf8').toString('base64')
    const sourceMapContent = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`
    return `${code}\n${sourceMapContent}`
  }
  return code
}

export function compile(
  sourcecode: string,
  filename: string,
  options: ts.CompilerOptions & { fallbackToTs?: (filename: string) => boolean },
): string

export function compile(
  sourcecode: string,
  filename: string,
  options: ts.CompilerOptions & { fallbackToTs?: (filename: string) => boolean },
  async: false,
): string

export function compile(
  sourcecode: string,
  filename: string,
  options: ts.CompilerOptions & { fallbackToTs?: (filename: string) => boolean },
  async: true,
): Promise<string>

export function compile(
  sourcecode: string,
  filename: string,
  options: ts.CompilerOptions & { fallbackToTs?: (filename: string) => boolean },
  async: boolean,
): Promise<string> | string

export function compile(
  sourcecode: string,
  filename: string,
  options: ts.CompilerOptions & { fallbackToTs?: (filename: string) => boolean },
  async = false,
) {
  if (filename.endsWith('.d.ts')) {
    return ''
  }
  if (options.files && (options.files as string[]).length) {
    if (
      PLATFORM === 'win32' &&
      (options.files as string[]).every((file) => filename !== resolve(process.cwd(), file))
    ) {
      return sourcecode
    }
    if (
      PLATFORM !== 'win32' &&
      (options.files as string[]).every((file) => !filename.endsWith(file))
    ) {
      return sourcecode
    }
  }
  if (options && typeof options.fallbackToTs === 'function' && options.fallbackToTs(filename)) {
    delete options.fallbackToTs
    const { outputText, sourceMapText } = ts.transpileModule(sourcecode, {
      compilerOptions: options,
      fileName: filename,
    })
    return injectInlineSourceMap({ code: outputText, filename, map: sourceMapText })
  }

  const swcRegisterConfig: Options = tsCompilerOptionsToSwcConfig(options, filename)

  if (async) {
    return transform(sourcecode, filename, swcRegisterConfig).then(({ code, map }) => {
      return injectInlineSourceMap({ code, filename, map })
    })
  } else {
    const { code, map } = transformSync(sourcecode, filename, swcRegisterConfig)
    return injectInlineSourceMap({ code, filename, map })
  }
}

export function register(options: Partial<ts.CompilerOptions> = {}, hookOpts = {}) {
  const locatedConfig = getTsconfig()
  const tsconfig = locatedConfig.config.compilerOptions as unknown as ts.CompilerOptions
  options = tsconfig
  installSourceMapSupport()
  return addHook((code, filename) => compile(code, filename, options), {
    exts: DEFAULT_EXTENSIONS,
    ...hookOpts,
  })
}

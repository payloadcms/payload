import type { Options } from '@swc-node/core'

import { resolve } from 'path'
import ts from 'typescript'

function toTsTarget(target: ts.ScriptTarget): Options['target'] {
  switch (target) {
    case ts.ScriptTarget.ES3:
      return 'es3'
    case ts.ScriptTarget.ES5:
      return 'es5'
    case ts.ScriptTarget.ES2015:
      return 'es2015'
    case ts.ScriptTarget.ES2016:
      return 'es2016'
    case ts.ScriptTarget.ES2017:
      return 'es2017'
    case ts.ScriptTarget.ES2018:
      return 'es2018'
    case ts.ScriptTarget.ES2019:
      return 'es2019'
    case ts.ScriptTarget.ES2020:
      return 'es2020'
    case ts.ScriptTarget.ES2021:
      return 'es2021'
    case ts.ScriptTarget.ES2022:
    case ts.ScriptTarget.ESNext:
    case ts.ScriptTarget.Latest:
      return 'es2022'
    case ts.ScriptTarget.JSON:
      return 'es5'
  }
}

function toModule(moduleKind: ts.ModuleKind) {
  switch (moduleKind) {
    case ts.ModuleKind.CommonJS:
      return 'commonjs'
    case ts.ModuleKind.UMD:
      return 'umd'
    case ts.ModuleKind.AMD:
      return 'amd'
    case ts.ModuleKind.ES2015:
    case ts.ModuleKind.ES2020:
    case ts.ModuleKind.ES2022:
    case ts.ModuleKind.ESNext:
    case ts.ModuleKind.Node16:
    case ts.ModuleKind.NodeNext:
    case ts.ModuleKind.None:
      return 'es6'
    case ts.ModuleKind.System:
      throw new TypeError('Do not support system kind module')
  }
}

/**
 * The default value for useDefineForClassFields depends on the emit target
 * @see https://www.typescriptlang.org/tsconfig#useDefineForClassFields
 */
function getUseDefineForClassFields(
  compilerOptions: ts.CompilerOptions,
  target: ts.ScriptTarget,
): boolean {
  return compilerOptions.useDefineForClassFields ?? target >= ts.ScriptTarget.ES2022
}

export function tsCompilerOptionsToSwcConfig(
  options: ts.CompilerOptions,
  filename: string,
): Options {
  const isJsx = filename.endsWith('.tsx') || filename.endsWith('.jsx') || Boolean(options.jsx)
  const target = options.target ?? ts.ScriptTarget.ES2018
  return {
    baseUrl: options.baseUrl ? resolve(options.baseUrl) : undefined,
    dynamicImport: true,
    emitDecoratorMetadata: options.emitDecoratorMetadata ?? false,
    esModuleInterop: options.esModuleInterop ?? false,
    experimentalDecorators: options.experimentalDecorators ?? false,
    externalHelpers: Boolean(options.importHelpers),
    ignoreDynamic: Boolean(process.env.SWC_NODE_IGNORE_DYNAMIC),
    jsx: isJsx,
    keepClassNames: true,
    module: toModule(options.module ?? ts.ModuleKind.ES2015),
    paths: Object.fromEntries(
      Object.entries(options.paths ?? {}).map(([aliasKey, aliasPaths]) => [
        aliasKey,
        (aliasPaths ?? []).map((path) => resolve(options.baseUrl ?? './', path)),
      ]),
    ) as Options['paths'],
    react:
      options.jsxFactory ?? options.jsxFragmentFactory ?? options.jsx ?? options.jsxImportSource
        ? {
            importSource: options.jsxImportSource ?? 'react',
            pragma: options.jsxFactory,
            pragmaFrag: options.jsxFragmentFactory,
            runtime: (options.jsx ?? 0) >= ts.JsxEmit.ReactJSX ? 'automatic' : 'classic',
            useBuiltins: true,
          }
        : undefined,
    sourcemap: options.sourceMap && options.inlineSourceMap ? 'inline' : Boolean(options.sourceMap),
    swc: {
      inputSourceMap: options.inlineSourceMap,
      sourceRoot: options.sourceRoot,
    },
    target: toTsTarget(target),
    useDefineForClassFields: getUseDefineForClassFields(options, target),
  }
}

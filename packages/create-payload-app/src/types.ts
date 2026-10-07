import type arg from 'arg'

import type { ALL_DATABASE_ADAPTERS, ALL_STORAGE_ADAPTERS } from './lib/ast/types.js'

export interface Args extends arg.Spec {
  '--beta': BooleanConstructor
  '--branch': StringConstructor
  '--db': StringConstructor
  '--db-accept-recommended': BooleanConstructor
  '--db-connection-string': StringConstructor
  '--debug': BooleanConstructor
  '--dry-run': BooleanConstructor

  '--example': StringConstructor
  '--help': BooleanConstructor
  '--init-next': BooleanConstructor
  '--local-example': StringConstructor
  '--local-template': StringConstructor
  '--name': StringConstructor
  '--no-agent': BooleanConstructor
  '--no-deps': BooleanConstructor
  '--no-git': BooleanConstructor
  '--payload-version': StringConstructor
  '--secret': StringConstructor
  '--template': StringConstructor
  '--use-bun': BooleanConstructor
  '--use-npm': BooleanConstructor
  '--use-pnpm': BooleanConstructor
  '--use-yarn': BooleanConstructor

  // Aliases

  '-e': string
  '-h': string
  '-n': string
  '-t': string
}

export type CliArgs = arg.Result<Args>

export type ProjectTemplate = GitTemplate | PluginTemplate

export type ProjectExample = {
  name: string
  url: string
}

/**
 * Template that is cloned verbatim from a git repo
 * Performs .env manipulation based upon input
 */
export interface GitTemplate extends Template {
  type: 'starter'
  url: string
}

/**
 * Type specifically for the plugin template
 * No .env manipulation is done
 */
export interface PluginTemplate extends Template {
  type: 'plugin'
  url: string
}

interface Template {
  dbType?: DbType
  description?: string
  name: string
  type: ProjectTemplate['type']
}

export type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn'

export type DbType = (typeof ALL_DATABASE_ADAPTERS)[number]

export type DbDetails = {
  dbUri?: string
  type: DbType
}

export type NextAppDetails = {
  hasTopLevelLayout: boolean
  isPayloadInstalled?: boolean
  isSrcDir: boolean
  isSupportedNextVersion: boolean
  nextAppDir?: string
  nextConfigPath?: string
  nextConfigType?: NextConfigType
  nextVersion: null | string
}

export type NextConfigType = 'cjs' | 'esm' | 'ts'

export type TanStackAppKind = 'router-only' | 'start'

export type TanStackAppDetails = {
  isPayloadInstalled: boolean
  kind: TanStackAppKind
  projectDir: string
  rootRoutePath: string
  routerPath: string
  routesDir: string
  sourceDir: string
  viteConfigPath: string
}

export type TanStackDetectionResult =
  | { compatible: false; detected: true; reason: string }
  | { compatible: true; details: TanStackAppDetails; detected: true }
  | { detected: false }

export type StorageAdapterType = (typeof ALL_STORAGE_ADAPTERS)[number]

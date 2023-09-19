import type arg from 'arg'

export interface Args extends arg.Spec {
  '--help': BooleanConstructor
  '--name': StringConstructor
  '--template': StringConstructor
  '--db': StringConstructor
  '--secret': StringConstructor
  '--use-npm': BooleanConstructor
  '--use-yarn': BooleanConstructor
  '--use-pnpm': BooleanConstructor
  '--no-deps': BooleanConstructor
  '--dry-run': BooleanConstructor
  '--beta': BooleanConstructor
  '-h': string
  '-n': string
  '-t': string
}

export type CliArgs = arg.Result<Args>

export type ProjectTemplate = GitTemplate | PluginTemplate

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
  name: string
  type: ProjectTemplate['type']
  description?: string
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm'

export type DbType = 'mongodb' | 'postgres'

export type DbDetails = {
  type: DbType
  dbUri: string
}

export type BundlerType = 'webpack' | 'vite'

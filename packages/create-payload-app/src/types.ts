import type arg from 'arg'

export interface Args extends arg.Spec {
  '--beta': BooleanConstructor
  '--db': StringConstructor
  '--dry-run': BooleanConstructor
  '--help': BooleanConstructor
  '--name': StringConstructor
  '--no-deps': BooleanConstructor
  '--secret': StringConstructor
  '--template': StringConstructor
  '--use-bun': BooleanConstructor
  '--use-npm': BooleanConstructor
  '--use-pnpm': BooleanConstructor
  '--use-yarn': BooleanConstructor
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
  description?: string
  name: string
  type: ProjectTemplate['type']
}

export type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn'

export type DbType = 'mongodb' | 'postgres'

export type DbDetails = {
  dbUri: string
  type: DbType
}

export type BundlerType = 'vite' | 'webpack'
export type EditorType = 'lexical' | 'slate'

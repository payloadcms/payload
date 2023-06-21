import type arg from 'arg'

export interface Args extends arg.Spec {
  '--help': BooleanConstructor
  '--name': StringConstructor
  '--template': StringConstructor
  '--db': StringConstructor
  '--secret': StringConstructor
  '--use-npm': BooleanConstructor
  '--no-deps': BooleanConstructor
  '--dry-run': BooleanConstructor
  '--beta': BooleanConstructor
  '-h': string
  '-n': string
  '-t': string
}

export type CliArgs = arg.Result<Args>

export type ProjectTemplate = StaticTemplate | GitTemplate

export interface StaticTemplate extends Template {
  type: 'static'
  directory: string
}

export interface GitTemplate extends Template {
  type: 'starter'
  url: string
}

interface Template {
  name: string
  type: 'static' | 'starter'
  description?: string
}

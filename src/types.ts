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

export interface StaticTemplate {
  name: string
  type: 'static'
}

export interface GitTemplate {
  name: string
  type: 'starter'
  url: string
}
